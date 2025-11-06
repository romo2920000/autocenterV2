import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../models/customer.model';
import { CustomerService } from '../services/customer.service';

interface Vehicle {
  id?: string;
  customer_id?: string;
  placas: string;
  marca: string;
  modelo: string;
  anio: string;
  color?: string;
  vin?: string;
  kilometraje_inicial?: number;
  created_at?: Date;
}

interface ServiceHistoryItem {
  id: string;
  service_date: Date;
  vehicle_info: string;
  services: string[];
  total_cost: number;
  mileage: number;
  technician: string;
  folio: string;
}

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-2xl max-w-7xl mx-auto">
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold">Expediente del Cliente</h2>
            <p class="text-blue-100 mt-1">Historial completo de servicio automotriz</p>
          </div>
          <button
            (click)="onClose()"
            class="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando expediente...</p>
      </div>

      <div *ngIf="!loading" class="p-6">
        <!-- Información del Cliente -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <!-- Datos Personales -->
          <div class="lg:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800">Datos Personales</h3>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 font-medium">Nombre Completo</p>
                <p class="text-lg font-semibold text-gray-900">{{ customer.nombre_completo }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 font-medium">Teléfono</p>
                <p class="text-gray-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  {{ customer.telefono }}
                </p>
              </div>
              <div *ngIf="customer.email">
                <p class="text-sm text-gray-600 font-medium">Email</p>
                <p class="text-gray-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ customer.email }}
                </p>
              </div>
              <div *ngIf="customer.direccion">
                <p class="text-sm text-gray-600 font-medium">Dirección</p>
                <p class="text-gray-900">{{ customer.direccion }}</p>
                <p *ngIf="customer.ciudad" class="text-gray-700">{{ customer.ciudad }}</p>
              </div>
              <div *ngIf="customer.rfc">
                <p class="text-sm text-gray-600 font-medium">RFC</p>
                <p class="text-gray-900 font-mono">{{ customer.rfc }}</p>
              </div>
            </div>
          </div>

          <!-- Resumen de Actividad -->
          <div class="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-green-50 rounded-lg p-4 border border-green-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-green-700 font-medium">Total Servicios</p>
              </div>
              <p class="text-3xl font-bold text-green-800">{{ totalServices }}</p>
            </div>

            <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-blue-700 font-medium">Vehículos</p>
              </div>
              <p class="text-3xl font-bold text-blue-800">{{ vehicles.length }}</p>
            </div>

            <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-purple-700 font-medium">Gasto Total</p>
              </div>
              <p class="text-3xl font-bold text-purple-800">\${{ totalSpent.toFixed(0) }}</p>
            </div>

            <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-sm text-orange-700 font-medium">Última Visita</p>
              </div>
              <p class="text-sm font-bold text-orange-800">{{ lastVisit || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button
              (click)="activeTab = 'vehicles'"
              [class.border-blue-500]="activeTab === 'vehicles'"
              [class.text-blue-600]="activeTab === 'vehicles'"
              [class.border-transparent]="activeTab !== 'vehicles'"
              [class.text-gray-500]="activeTab !== 'vehicles'"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
                Vehículos ({{ vehicles.length }})
              </span>
            </button>
            <button
              (click)="activeTab = 'history'"
              [class.border-blue-500]="activeTab === 'history'"
              [class.text-blue-600]="activeTab === 'history'"
              [class.border-transparent]="activeTab !== 'history'"
              [class.text-gray-500]="activeTab !== 'history'"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Historial de Servicios ({{ serviceHistory.length }})
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content: Vehículos -->
        <div *ngIf="activeTab === 'vehicles'" class="space-y-4">
          <div *ngFor="let vehicle of vehicles" class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
            <div class="flex items-start justify-between">
              <div class="flex gap-4 flex-1">
                <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h4 class="text-xl font-bold text-gray-900">{{ vehicle.marca }} {{ vehicle.modelo }}</h4>
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">{{ vehicle.anio }}</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <p class="text-xs text-gray-500 font-medium">Placas</p>
                      <p class="text-sm font-semibold text-gray-900">{{ vehicle.placas }}</p>
                    </div>
                    <div *ngIf="vehicle.color">
                      <p class="text-xs text-gray-500 font-medium">Color</p>
                      <p class="text-sm font-semibold text-gray-900">{{ vehicle.color }}</p>
                    </div>
                    <div *ngIf="vehicle.vin">
                      <p class="text-xs text-gray-500 font-medium">VIN</p>
                      <p class="text-sm font-mono text-gray-900">{{ vehicle.vin }}</p>
                    </div>
                    <div *ngIf="vehicle.kilometraje_inicial">
                      <p class="text-xs text-gray-500 font-medium">Kilometraje Inicial</p>
                      <p class="text-sm font-semibold text-gray-900">{{ vehicle.kilometraje_inicial | number }} km</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="getVehicleServiceCount(vehicle.id!) > 0" class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-sm text-gray-600">
                <span class="font-semibold text-blue-600">{{ getVehicleServiceCount(vehicle.id!) }}</span> servicio(s) realizados
              </p>
            </div>
          </div>

          <div *ngIf="vehicles.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p class="text-gray-600 font-medium">No hay vehículos registrados</p>
          </div>
        </div>

        <!-- Tab Content: Historial -->
        <div *ngIf="activeTab === 'history'" class="space-y-4">
          <div *ngFor="let service of serviceHistory" class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">{{ service.folio }}</span>
                  <span class="text-sm text-gray-600">{{ service.service_date | date:'medium' }}</span>
                </div>
                <h4 class="text-lg font-semibold text-gray-900">{{ service.vehicle_info }}</h4>
                <p class="text-sm text-gray-600 mt-1">Kilometraje: <span class="font-semibold">{{ service.mileage | number }} km</span></p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-green-600">\${{ service.total_cost | number:'1.2-2' }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ service.technician }}</p>
              </div>
            </div>
            <div class="border-t border-gray-200 pt-3">
              <p class="text-xs text-gray-600 font-medium mb-2">Servicios Realizados:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  *ngFor="let svc of service.services"
                  class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {{ svc }}
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="serviceHistory.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <p class="text-gray-600 font-medium">No hay historial de servicios</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CustomerProfileComponent implements OnInit {
  @Input() customer!: Customer;
  @Output() closed = new EventEmitter<void>();

  vehicles: Vehicle[] = [];
  serviceHistory: ServiceHistoryItem[] = [];
  loading = false;
  activeTab: 'vehicles' | 'history' = 'vehicles';

  totalServices = 0;
  totalSpent = 0;
  lastVisit = '';

  constructor(private customerService: CustomerService) {}

  async ngOnInit() {
    await this.loadCustomerData();
  }

  async loadCustomerData() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadVehicles(),
        this.loadServiceHistory()
      ]);
      this.calculateStats();
    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadVehicles() {
    try {
      this.vehicles = await this.customerService.getCustomerVehicles(this.customer.id!);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      this.vehicles = [];
    }
  }

  async loadServiceHistory() {
    try {
      const orders = await this.customerService.getCustomerOrders(this.customer.id!);
      this.serviceHistory = orders.map(order => ({
        id: order.id || '',
        service_date: order.created_at || order.fecha,
        vehicle_info: this.getVehicleInfo(order.vehicle_id),
        services: this.getServicesFromOrder(order),
        total_cost: order.presupuesto,
        mileage: Number(order.diagnostic?.vehicleInfo?.mileage || 0),
        technician: order.technician_name || 'N/A',
        folio: order.folio
      }));
    } catch (error) {
      console.error('Error cargando historial:', error);
      this.serviceHistory = [];
    }
  }

  getVehicleInfo(vehicleId?: string): string {
    if (!vehicleId) return 'Vehículo no especificado';
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      return `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} - ${vehicle.placas}`;
    }
    return 'Vehículo no encontrado';
  }

  getServicesFromOrder(order: any): string[] {
    const services: string[] = [];
    if (order.servicios && order.servicios.length > 0) {
      services.push(...order.servicios.map((s: any) => s.nombre));
    }
    if (order.diagnostic?.items && order.diagnostic.items.length > 0) {
      services.push(...order.diagnostic.items.map((i: any) => i.item));
    }
    return services;
  }

  calculateStats() {
    this.totalServices = this.serviceHistory.length;
    this.totalSpent = this.serviceHistory.reduce((sum, s) => sum + s.total_cost, 0);

    if (this.serviceHistory.length > 0) {
      const lastService = this.serviceHistory[0];
      this.lastVisit = new Date(lastService.service_date).toLocaleDateString('es-MX');
    }
  }

  getVehicleServiceCount(vehicleId: string): number {
    return this.serviceHistory.filter(s => s.vehicle_info.includes(vehicleId)).length;
  }

  onClose() {
    this.closed.emit();
  }
}
