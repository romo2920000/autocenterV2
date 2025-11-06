import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../services/customer.service';

interface LostSalesData {
  category: string;
  item_name: string;
  severity: string;
  times_offered: number;
  times_rejected: number;
  times_accepted: number;
  rejection_rate: number;
  total_lost_revenue: number;
  total_revenue_captured: number;
  avg_service_cost: number;
}

@Component({
  selector: 'app-lost-sales-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="border-b pb-4 mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Reporte de Ventas Perdidas</h2>
        <p class="text-gray-600 mt-2">Análisis de servicios rechazados por clientes</p>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">Cargando datos...</p>
      </div>

      <div *ngIf="!loading && reportData.length === 0" class="text-center py-8">
        <p class="text-gray-600">No hay datos disponibles</p>
      </div>

      <div *ngIf="!loading && reportData.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-red-50 rounded-lg p-4">
            <p class="text-sm text-red-600 font-medium">Ingresos Perdidos</p>
            <p class="text-2xl font-bold text-red-700">$ {{ getTotalLostRevenue().toFixed(2) }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Ingresos Capturados</p>
            <p class="text-2xl font-bold text-green-700">$ {{ getTotalCapturedRevenue().toFixed(2) }}</p>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Total Ofertas</p>
            <p class="text-2xl font-bold text-blue-700">{{ getTotalOffers() }}</p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Tasa Rechazo Promedio</p>
            <p class="text-2xl font-bold text-yellow-700">{{ getAverageRejectionRate().toFixed(1) }}%</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Ofrecido</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aceptado</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Rechazado</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">% Rechazo</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ingreso Perdido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let item of reportData" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-900">{{ item.item_name }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.category }}</td>
                <td class="px-4 py-3 text-sm text-center text-gray-900">{{ item.times_offered }}</td>
                <td class="px-4 py-3 text-sm text-center text-green-700">{{ item.times_accepted }}</td>
                <td class="px-4 py-3 text-sm text-center text-red-700">{{ item.times_rejected }}</td>
                <td class="px-4 py-3 text-sm text-center">
                  <span
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                    [class.bg-red-100]="item.rejection_rate > 70"
                    [class.text-red-800]="item.rejection_rate > 70"
                    [class.bg-yellow-100]="item.rejection_rate > 40 && item.rejection_rate <= 70"
                    [class.text-yellow-800]="item.rejection_rate > 40 && item.rejection_rate <= 70"
                    [class.bg-green-100]="item.rejection_rate <= 40"
                    [class.text-green-800]="item.rejection_rate <= 40"
                  >
                    {{ item.rejection_rate.toFixed(1) }}%
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-red-700">
                  $ {{ item.total_lost_revenue.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t">
        <button
          (click)="onClose()"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class LostSalesReportComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  reportData: LostSalesData[] = [];
  loading = false;

  constructor(private customerService: CustomerService) {}

  async ngOnInit() {
    await this.loadReportData();
  }

  async loadReportData() {
    this.loading = true;
    try {
      this.reportData = await this.customerService.getLostSalesReport();
      console.log('📊 Datos de reporte cargados:', this.reportData);
      console.log('📊 Cantidad de registros:', this.reportData.length);
    } catch (error) {
      console.error('❌ Error cargando reporte de ventas perdidas:', error);
    } finally {
      this.loading = false;
    }
  }

  getTotalLostRevenue(): number {
    return this.reportData.reduce((sum, item) => sum + Number(item.total_lost_revenue), 0);
  }

  getTotalCapturedRevenue(): number {
    return this.reportData.reduce((sum, item) => sum + Number(item.total_revenue_captured), 0);
  }

  getTotalOffers(): number {
    return this.reportData.reduce((sum, item) => sum + Number(item.times_offered), 0);
  }

  getAverageRejectionRate(): number {
    if (this.reportData.length === 0) return 0;
    const total = this.reportData.reduce((sum, item) => sum + Number(item.rejection_rate), 0);
    return total / this.reportData.length;
  }

  onClose() {
    this.closed.emit();
  }
}
