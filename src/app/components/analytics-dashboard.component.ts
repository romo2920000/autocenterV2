import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface SalesByMonth {
  month: string;
  autocenter: string;
  total_orders: number;
  completed_orders: number;
  total_revenue: number;
  completed_revenue: number;
  avg_ticket: number;
}

interface TopProduct {
  product_name: string;
  sku: string;
  times_ordered: number;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
}

interface TopService {
  service_name: string;
  times_requested: number;
  total_revenue: number;
  avg_price: number;
}

interface ConversionRate {
  autocenter: string;
  month: string;
  total_orders: number;
  authorized_orders: number;
  rejected_orders: number;
  conversion_rate_percentage: number;
}

interface TopCustomer {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  total_orders: number;
  lifetime_value: number;
  avg_ticket: number;
  last_order_date: string;
  first_order_date: string;
}

interface LostSalesAnalysis {
  category: string;
  service_name: string;
  severity: string;
  times_rejected: number;
  total_lost_revenue: number;
  avg_lost_per_rejection: number;
  rejection_reasons: string[];
}

interface InactiveCustomer {
  customer_id: string;
  nombre_completo: string;
  telefono: string;
  last_order_date: string;
  months_inactive: number;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg mb-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
              <h1 class="text-3xl font-bold text-white">Dashboard Gerencial</h1>
            </div>
            <div class="flex gap-4">
              <select [(ngModel)]="selectedPeriod" (change)="loadAllData()" class="px-4 py-2 border rounded-lg bg-white">
                <option value="1">Último mes</option>
                <option value="3">Últimos 3 meses</option>
                <option value="6">Últimos 6 meses</option>
                <option value="12">Último año</option>
              </select>
              <button (click)="exportToPDF()" class="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-6">

      <!-- KPIs Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500">Ventas Totales</div>
          <div class="text-3xl font-bold text-gray-900">\${{ totalRevenue | number:'1.2-2' }}</div>
          <div class="text-sm text-green-600 mt-2">↑ {{ revenueGrowth }}% vs mes anterior</div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500">Presupuestos Totales</div>
          <div class="text-3xl font-bold text-gray-900">{{ totalOrders }}</div>
          <div class="text-sm text-blue-600 mt-2">{{ avgOrdersPerDay }} por día</div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500">Tasa de Conversión</div>
          <div class="text-3xl font-bold text-gray-900">{{ avgConversionRate }}%</div>
          <div class="text-sm" [class.text-green-600]="avgConversionRate >= 70" [class.text-yellow-600]="avgConversionRate < 70 && avgConversionRate >= 50" [class.text-red-600]="avgConversionRate < 50">
            {{ getConversionLabel() }}
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="text-sm text-gray-500">Ticket Promedio</div>
          <div class="text-3xl font-bold text-gray-900">\${{ avgTicket | number:'1.2-2' }}</div>
          <div class="text-sm text-gray-600 mt-2">Por presupuesto</div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ventas por Mes -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Ventas por Mes</h2>
          <canvas #salesChart></canvas>
        </div>

        <!-- Tasa de Conversión -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Tasa de Conversión</h2>
          <canvas #conversionChart></canvas>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Productos Más Vendidos -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Top 10 Productos Más Vendidos</h2>
          <canvas #productsChart></canvas>
        </div>

        <!-- Servicios Más Solicitados -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Top 10 Servicios Más Solicitados</h2>
          <canvas #servicesChart></canvas>
        </div>
      </div>

      <!-- Comparativa entre Centros -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Comparativa entre Centros Automotrices</h2>
        <canvas #autocentersChart></canvas>
      </div>

      <!-- Análisis de Ventas Perdidas -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Análisis de Ventas Perdidas</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="text-lg font-semibold mb-4">Servicios Más Rechazados</h3>
            <canvas #lostSalesServicesChart></canvas>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4">Motivos de Rechazo</h3>
            <canvas #rejectionReasonsChart></canvas>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veces Rechazado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue Perdido</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promedio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severidad</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let item of lostSalesData.slice(0, 10)">
                <td class="px-6 py-4 text-sm text-gray-900">{{ item.service_name }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ item.category }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ item.times_rejected }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">\${{ item.total_lost_revenue | number:'1.2-2' }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">\${{ item.avg_lost_per_rejection | number:'1.2-2' }}</td>
                <td class="px-6 py-4 text-sm">
                  <span [class]="getSeverityClass(item.severity)">
                    {{ getSeverityLabel(item.severity) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Clientes -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Clientes Más Frecuentes</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total (LTV)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Promedio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let customer of topCustomers.slice(0, 20)">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ customer.nombre_completo }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ customer.telefono }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ customer.total_orders }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">\${{ customer.lifetime_value | number:'1.2-2' }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">\${{ customer.avg_ticket | number:'1.2-2' }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(customer.last_order_date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Clientes Inactivos -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Clientes Inactivos (Sin servicio en 6+ meses)</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meses Inactivo</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let customer of inactiveCustomers.slice(0, 20)">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ customer.nombre_completo }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ customer.telefono }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ customer.last_order_date ? formatDate(customer.last_order_date) : 'Nunca' }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    {{ customer.months_inactive | number:'1.0-0' }} meses
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <button class="text-blue-600 hover:text-blue-800">Enviar recordatorio</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  `
})
export class AnalyticsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionChart') conversionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('servicesChart') servicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('autocentersChart') autocentersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lostSalesServicesChart') lostSalesServicesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rejectionReasonsChart') rejectionReasonsChartRef!: ElementRef<HTMLCanvasElement>;

  selectedPeriod = '6';

  salesData: SalesByMonth[] = [];
  topProducts: TopProduct[] = [];
  topServices: TopService[] = [];
  conversionData: ConversionRate[] = [];
  topCustomers: TopCustomer[] = [];
  lostSalesData: LostSalesAnalysis[] = [];
  inactiveCustomers: InactiveCustomer[] = [];

  totalRevenue = 0;
  totalOrders = 0;
  avgConversionRate = 0;
  avgTicket = 0;
  revenueGrowth = 0;
  avgOrdersPerDay = 0;

  charts: Chart[] = [];

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  async loadAllData() {
    await Promise.all([
      this.loadSalesByMonth(),
      this.loadTopProducts(),
      this.loadTopServices(),
      this.loadConversionRate(),
      this.loadTopCustomers(),
      this.loadLostSalesAnalysis(),
      this.loadInactiveCustomers()
    ]);

    this.calculateKPIs();

    if (this.charts.length > 0) {
      this.updateCharts();
    }
  }

  async loadSalesByMonth() {
    try {
      const { data, error } = await this.supabase.client
        .from('sales_by_month')
        .select('*')
        .order('month', { ascending: false })
        .limit(parseInt(this.selectedPeriod));

      if (error) throw error;
      this.salesData = data || [];
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  }

  async loadTopProducts() {
    try {
      const { data, error } = await this.supabase.client
        .from('top_products')
        .select('*')
        .limit(10);

      if (error) throw error;
      this.topProducts = data || [];
    } catch (error) {
      console.error('Error loading top products:', error);
    }
  }

  async loadTopServices() {
    try {
      const { data, error } = await this.supabase.client
        .from('top_services')
        .select('*')
        .limit(10);

      if (error) throw error;
      this.topServices = data || [];
    } catch (error) {
      console.error('Error loading top services:', error);
    }
  }

  async loadConversionRate() {
    try {
      const { data, error } = await this.supabase.client
        .from('conversion_rate')
        .select('*')
        .order('month', { ascending: false })
        .limit(parseInt(this.selectedPeriod));

      if (error) throw error;
      this.conversionData = data || [];
    } catch (error) {
      console.error('Error loading conversion rate:', error);
    }
  }

  async loadTopCustomers() {
    try {
      const { data, error } = await this.supabase.client
        .from('top_customers')
        .select('*')
        .limit(50);

      if (error) throw error;
      this.topCustomers = data || [];
    } catch (error) {
      console.error('Error loading top customers:', error);
    }
  }

  async loadLostSalesAnalysis() {
    try {
      const { data, error } = await this.supabase.client
        .from('lost_sales_analysis')
        .select('*')
        .limit(50);

      if (error) throw error;
      this.lostSalesData = data || [];
    } catch (error) {
      console.error('Error loading lost sales analysis:', error);
    }
  }

  async loadInactiveCustomers() {
    try {
      const { data, error } = await this.supabase.client
        .rpc('get_inactive_customers', { p_months: 6 });

      if (error) throw error;
      this.inactiveCustomers = data || [];
    } catch (error) {
      console.error('Error loading inactive customers:', error);
    }
  }

  calculateKPIs() {
    this.totalRevenue = this.salesData.reduce((sum, s) => sum + (s.completed_revenue || 0), 0);
    this.totalOrders = this.salesData.reduce((sum, s) => sum + (s.total_orders || 0), 0);
    this.avgTicket = this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;

    const totalAuth = this.conversionData.reduce((sum, c) => sum + (c.authorized_orders || 0), 0);
    const totalOrd = this.conversionData.reduce((sum, c) => sum + (c.total_orders || 0), 0);
    this.avgConversionRate = totalOrd > 0 ? Math.round((totalAuth / totalOrd) * 100) : 0;

    const days = parseInt(this.selectedPeriod) * 30;
    this.avgOrdersPerDay = days > 0 ? Math.round(this.totalOrders / days) : 0;

    if (this.salesData.length >= 2) {
      const currentMonth = this.salesData[0].completed_revenue || 0;
      const previousMonth = this.salesData[1].completed_revenue || 0;
      this.revenueGrowth = previousMonth > 0 ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0;
    }
  }

  createCharts() {
    this.destroyCharts();
    this.createSalesChart();
    this.createConversionChart();
    this.createProductsChart();
    this.createServicesChart();
    this.createAutocentersChart();
    this.createLostSalesCharts();
  }

  updateCharts() {
    this.destroyCharts();
    this.createCharts();
  }

  destroyCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  createSalesChart() {
    if (!this.salesChartRef) return;

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const groupedData = this.groupByMonth(this.salesData);
    const labels = Object.keys(groupedData).reverse();
    const revenues = labels.map(month => groupedData[month]);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels.map(l => this.formatMonth(l)),
        datasets: [{
          label: 'Ventas Completadas',
          data: revenues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  createConversionChart() {
    if (!this.conversionChartRef) return;

    const ctx = this.conversionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.conversionData.map(d => this.formatMonth(d.month)).reverse();
    const rates = this.conversionData.map(d => d.conversion_rate_percentage).reverse();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tasa de Conversión (%)',
          data: rates,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  createProductsChart() {
    if (!this.productsChartRef) return;

    const ctx = this.productsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.topProducts.map(p => p.product_name?.substring(0, 30) || 'Sin nombre');
    const quantities = this.topProducts.map(p => p.total_quantity);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad Vendida',
          data: quantities,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  createServicesChart() {
    if (!this.servicesChartRef) return;

    const ctx = this.servicesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.topServices.map(s => s.service_name?.substring(0, 30) || 'Sin nombre');
    const requests = this.topServices.map(s => s.times_requested);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Veces Solicitado',
          data: requests,
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgb(236, 72, 153)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  createAutocentersChart() {
    if (!this.autocentersChartRef) return;

    const ctx = this.autocentersChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const autocenters = [...new Set(this.salesData.map(s => s.autocenter))];
    const datasets = autocenters.map((autocenter, index) => {
      const data = this.salesData
        .filter(s => s.autocenter === autocenter)
        .map(s => s.completed_revenue);

      const colors = [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(236, 72, 153)',
        'rgb(251, 146, 60)',
        'rgb(168, 85, 247)'
      ];

      return {
        label: autocenter,
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.4
      };
    });

    const labels = [...new Set(this.salesData.map(s => this.formatMonth(s.month)))].reverse();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + value.toLocaleString()
            }
          }
        }
      }
    };

    this.charts.push(new Chart(ctx, config));
  }

  createLostSalesCharts() {
    if (this.lostSalesServicesChartRef) {
      const ctx = this.lostSalesServicesChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const top10 = this.lostSalesData.slice(0, 10);
        const config: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: top10.map(s => s.service_name?.substring(0, 25) || 'Sin nombre'),
            datasets: [{
              label: 'Revenue Perdido',
              data: top10.map(s => s.total_lost_revenue),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => '$' + value.toLocaleString()
                }
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, config));
      }
    }

    if (this.rejectionReasonsChartRef) {
      const ctx = this.rejectionReasonsChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const reasonsMap = new Map<string, number>();
        this.lostSalesData.forEach(item => {
          item.rejection_reasons.forEach(reason => {
            reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + item.times_rejected);
          });
        });

        const sortedReasons = Array.from(reasonsMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        const config: ChartConfiguration = {
          type: 'doughnut',
          data: {
            labels: sortedReasons.map(r => r[0]),
            datasets: [{
              data: sortedReasons.map(r => r[1]),
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(250, 204, 21, 0.8)',
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(99, 102, 241, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'right'
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, config));
      }
    }
  }

  groupByMonth(data: SalesByMonth[]): { [key: string]: number } {
    const grouped: { [key: string]: number } = {};
    data.forEach(item => {
      const month = item.month;
      if (!grouped[month]) {
        grouped[month] = 0;
      }
      grouped[month] += item.completed_revenue || 0;
    });
    return grouped;
  }

  formatMonth(dateStr: string): string {
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX');
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'urgent':
        return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
      case 'recommended':
        return 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800';
      case 'good':
        return 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
      default:
        return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'urgent': return 'Urgente';
      case 'recommended': return 'Recomendado';
      case 'good': return 'Bueno';
      default: return severity;
    }
  }

  getConversionLabel(): string {
    if (this.avgConversionRate >= 70) return 'Excelente';
    if (this.avgConversionRate >= 50) return 'Bueno';
    return 'Necesita mejorar';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  exportToPDF() {
    alert('Funcionalidad de exportar a PDF en desarrollo');
  }
}
