import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DiagnosticItem,
  DiagnosticPart,
  DiagnosticSeverity,
  VehicleDiagnostic,
  DIAGNOSTIC_CATEGORIES,
  DIAGNOSTIC_ITEMS_BY_CATEGORY,
  getSeverityColor,
  getSeverityBadgeColor,
  getSeverityLabel,
  getSeverityIcon,
} from '../models/diagnostic.model';
import { CustomerService } from '../services/customer.service';
import {
  ServiceDefinition,
  SERVICE_CATEGORIES,
  getServicesByCategory,
  PREDEFINED_SERVICES
} from '../models/service.model';

@Component({
  selector: 'app-vehicle-diagnostic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Diagnóstico del Vehículo</h3>
            <p class="text-sm text-gray-600">Clasificar condición de componentes y sistemas</p>
          </div>
        </div>
        <button
          type="button"
          *ngIf="!isExpanded"
          (click)="toggleExpand()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Agregar Diagnóstico
        </button>
      </div>

      <div *ngIf="isExpanded" class="space-y-6">
        <!-- Selección de vehículo existente o nuevo -->
        <div *ngIf="!hideVehicleSelection" class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Seleccionar Vehículo del Cliente
          </h4>

          <div *ngIf="customerVehicles.length > 0" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Vehículos Registrados</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                *ngFor="let vehicle of customerVehicles"
                (click)="selectVehicle(vehicle)"
                [class.border-green-500]="selectedVehicleId === vehicle.id"
                [class.bg-green-50]="selectedVehicleId === vehicle.id"
                class="border-2 border-gray-300 rounded-lg p-3 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="font-semibold text-gray-900">{{ vehicle.marca }} {{ vehicle.modelo }} {{ vehicle.anio }}</div>
                    <div class="text-sm text-gray-600">Placas: {{ vehicle.placas }}</div>
                    <div class="text-xs text-gray-500">{{ vehicle.kilometraje_inicial }} km</div>
                  </div>
                  <svg *ngIf="selectedVehicleId === vehicle.id" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <button
              type="button"
              (click)="showNewVehicleForm = !showNewVehicleForm"
              class="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ showNewVehicleForm ? 'Cancelar' : 'Registrar Nuevo Vehículo' }}
            </button>
          </div>

          <div *ngIf="customerVehicles.length === 0 || showNewVehicleForm" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-sm text-yellow-800 mb-2">
              <strong>Nuevo Vehículo:</strong> Complete los datos abajo y se registrará automáticamente.
            </p>
          </div>
        </div>

        <div *ngIf="!hideVehicleSelection" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 mb-3">Información del Vehículo</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Placas *</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.vehicleInfo.plate"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="ABC-123"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.vehicleInfo.brand"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Toyota, Honda, etc."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.vehicleInfo.model"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Corolla, Civic, etc."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.vehicleInfo.year"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="2020"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kilometraje</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.vehicleInfo.mileage"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="50,000 km"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
              <input
                type="text"
                [(ngModel)]="diagnostic.technicianName"
                [readonly]="!!currentUserName"
                [class]="currentUserName ? 'w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 text-sm cursor-not-allowed' : 'w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm'"
                placeholder="Nombre del técnico"
              />
            </div>
          </div>
        </div>


        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Agregar Item de Diagnóstico (Mano de Obra)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categoría de Servicio</label>
              <select
                [(ngModel)]="newItem.category"
                (change)="onServiceCategoryChange()"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Seleccionar categoría</option>
                <option *ngFor="let cat of serviceCategories" [value]="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
              <select
                [(ngModel)]="selectedServiceSku"
                (change)="onServiceSelected()"
                [disabled]="!newItem.category"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
              >
                <option value="">Seleccionar servicio</option>
                <option *ngFor="let service of availableServices" [value]="service.sku">
                  {{ service.nombre }} - {{ service.precioConIva }}
                </option>
              </select>
            </div>
          </div>

          <div *ngIf="selectedServiceData" class="mb-4 p-3 bg-white rounded-lg border border-blue-200">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h5 class="font-semibold text-blue-900">{{ selectedServiceData.nombre }}</h5>
                <p class="text-xs text-gray-500 mt-1">SKU: {{ selectedServiceData.sku }}</p>
                <p class="text-sm text-gray-700 mt-2">{{ selectedServiceData.descripcion }}</p>
              </div>
              <div class="text-right ml-4">
                <p class="text-sm font-semibold text-green-600">{{ selectedServiceData.precioConIva }}</p>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Estado / Severidad</label>
            <div class="flex gap-3">
              <button
                type="button"
                *ngFor="let sev of severities"
                (click)="newItem.severity = sev.value"
                [class]="getSeverityButtonClass(sev.value)"
                class="flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all"
              >
                <div class="flex items-center justify-center gap-2">
                  <span class="text-xl">{{ sev.icon }}</span>
                  <span>{{ sev.label }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción/Observaciones</label>
            <textarea
              [(ngModel)]="newItem.description"
              rows="2"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Detalles adicionales sobre la condición..."
            ></textarea>
          </div>


          <button
            type="button"
            (click)="addDiagnosticItem()"
            [disabled]="!canAddItem()"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Agregar Mano de Obra
          </button>
        </div>

        <!-- Sección para agregar refacciones relacionadas -->
        <div *ngIf="selectedServiceForParts" class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-orange-900 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              Agregar Refacciones para el Servicio
            </h4>
            <button
              type="button"
              (click)="selectedServiceForParts = null"
              class="text-gray-500 hover:text-gray-700"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="mb-3 p-2 bg-white border border-orange-300 rounded text-sm text-orange-800">
            <p><strong>Servicio seleccionado:</strong> {{ selectedServiceForParts.item }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                [(ngModel)]="newPart.descripcion"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="Nombre de la refacción"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Costo sin IVA</label>
              <input
                type="number"
                [(ngModel)]="newPart.costo"
                step="0.01"
                min="0"
                (input)="calculatePartPricing()"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                [(ngModel)]="newPart.cantidad"
                min="1"
                class="w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          <div *ngIf="newPart.costo && newPart.costo > 0" class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="grid grid-cols-4 gap-3 text-sm">
              <div>
                <p class="text-gray-600">Costo con IVA:</p>
                <p class="font-semibold text-gray-900">{{ (newPart.costo! * 1.16).toFixed(2) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Precio Venta:</p>
                <p class="font-semibold text-green-600">{{ newPart.precio?.toFixed(2) || '0.00' }}</p>
              </div>
              <div>
                <p class="text-gray-600">Margen:</p>
                <p class="font-semibold text-blue-600">{{ newPart.margen?.toFixed(2) || '0.00' }}</p>
              </div>
              <div>
                <p class="text-gray-600">% Margen:</p>
                <p class="font-semibold text-purple-600">{{ newPart.porcentaje?.toFixed(0) || '0' }}%</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            (click)="addDiagnosticPart()"
            [disabled]="!canAddPart()"
            class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Agregar Refacción
          </button>
        </div>

        <div *ngIf="diagnostic.items.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900">Items del Diagnóstico ({{ diagnostic.items.length }})</h4>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-red-800">Urgentes</span>
                <span class="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {{ getItemCountBySeverity('urgent') }}
                </span>
              </div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-yellow-800">Recomendables</span>
                <span class="bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {{ getItemCountBySeverity('recommended') }}
                </span>
              </div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-green-800">En Buen Estado</span>
                <span class="bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {{ getItemCountBySeverity('good') }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div
              *ngFor="let item of diagnostic.items; let i = index"
              [class]="getSeverityColor(item.severity)"
              class="p-4 rounded-lg border-2"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">{{ getCategoryIcon(item.category) }}</span>
                    <span class="font-medium text-sm">{{ item.item }}</span>
                    <span [class]="getSeverityBadgeColor(item.severity)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getSeverityLabel(item.severity) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 ml-7">{{ item.description }}</p>
                  <p class="text-xs text-gray-500 ml-7 mt-1">Categoría: {{ getCategoryName(item.category) }}</p>

                  <!-- Botón y refacciones relacionadas -->
                  <div class="ml-7 mt-3">
                    <button
                      type="button"
                      (click)="selectServiceForParts(item)"
                      class="text-xs px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-md font-medium transition-colors"
                    >
                      + Agregar Refacciones
                    </button>

                    <!-- Lista de refacciones relacionadas con este servicio -->
                    <div *ngIf="getServiceParts(item.id).length > 0" class="mt-2 space-y-1">
                      <p class="text-xs font-medium text-gray-700">Refacciones ({{ getServiceParts(item.id).length }}):</p>
                      <div *ngFor="let part of getServiceParts(item.id); let pi = index" class="bg-white border border-gray-200 rounded p-2 text-xs">
                        <div class="flex items-center justify-between">
                          <div class="flex-1">
                            <span class="font-medium text-gray-900">{{ part.descripcion }}</span>
                            <span class="text-gray-500 ml-2">Cant: {{ part.cantidad }} | Costo: {{ part.costo | currency }} | Precio: {{ part.precio | currency }}</span>
                          </div>
                          <button
                            type="button"
                            (click)="removeDiagnosticPart(part.id)"
                            class="text-red-600 hover:text-red-800 ml-2"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="removeDiagnosticItem(i)"
                  class="text-red-600 hover:text-red-800 ml-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            (click)="saveDiagnostic()"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Guardar Diagnóstico
          </button>
          <button
            type="button"
            (click)="cancelEditing()"
            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      <div *ngIf="!isExpanded && diagnostic.items.length > 0" class="mt-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-gray-900">Diagnóstico Registrado</h4>
            <button
              type="button"
              (click)="toggleExpand()"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver/Editar
            </button>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">{{ getItemCountBySeverity('urgent') }}</div>
              <div class="text-xs text-gray-600">Urgentes</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ getItemCountBySeverity('recommended') }}</div>
              <div class="text-xs text-gray-600">Recomendables</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ getItemCountBySeverity('good') }}</div>
              <div class="text-xs text-gray-600">En Buen Estado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VehicleDiagnosticComponent implements OnInit {
  @Input() diagnostic: VehicleDiagnostic = {
    vehicleInfo: {
      plate: '',
      brand: '',
      model: '',
      year: '',
      mileage: '',
    },
    items: [],
    technicianName: '',
  };

  @Input() initialDiagnostic?: VehicleDiagnostic;
  @Input() customerId: string = '';
  @Input() hideVehicleSelection: boolean = false;
  @Input() currentUserName?: string;
  @Input() selectedMarginPercentage: number = 30;
  @Output() diagnosticChange = new EventEmitter<VehicleDiagnostic>();
  @Output() diagnosticCompleted = new EventEmitter<VehicleDiagnostic>();
  @Output() vehicleSelected = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  isExpanded = false;
  categories = DIAGNOSTIC_CATEGORIES;
  availableItems: string[] = [];
  customItemName = '';

  customerVehicles: any[] = [];
  selectedVehicleId: string = '';
  showNewVehicleForm = false;

  // Catálogo de servicios
  serviceCategories: string[] = SERVICE_CATEGORIES;
  availableServices: ServiceDefinition[] = [];
  selectedServiceSku: string = '';
  selectedServiceData: ServiceDefinition | null = null;

  newItem = {
    category: '',
    item: '',
    description: '',
    severity: '' as DiagnosticSeverity | '',
  };

  severities = [
    { value: 'urgent' as DiagnosticSeverity, label: 'Urgente', icon: '⚠️' },
    { value: 'recommended' as DiagnosticSeverity, label: 'Recomendable', icon: '⚡' },
    { value: 'good' as DiagnosticSeverity, label: 'Bien', icon: '✓' },
  ];

  // Refacciones del diagnóstico
  selectedServiceForParts: DiagnosticItem | null = null;
  newPart: Partial<DiagnosticPart> = {
    sku: '',
    descripcion: '',
    cantidad: 1,
    costo: 0,
    precio: 0,
    margen: 0,
    porcentaje: 0,
  };

  constructor(private customerService: CustomerService) {}

  async ngOnInit() {
    if (this.initialDiagnostic) {
      this.diagnostic = JSON.parse(JSON.stringify(this.initialDiagnostic));
      this.isExpanded = true;
    }

    // Inicializar array de parts si no existe
    if (!this.diagnostic.parts) {
      this.diagnostic.parts = [];
    }

    // Establecer nombre del técnico automáticamente si está disponible
    if (this.currentUserName && !this.diagnostic.technicianName) {
      this.diagnostic.technicianName = this.currentUserName;
    }

    if (this.hideVehicleSelection) {
      this.isExpanded = true;
    }

    if (this.customerId) {
      await this.loadCustomerVehicles();
    }
  }

  async loadCustomerVehicles() {
    try {
      this.customerVehicles = await this.customerService.getCustomerVehicles(this.customerId);
    } catch (error) {
      console.error('Error cargando vehículos del cliente:', error);
    }
  }

  selectVehicle(vehicle: any) {
    this.selectedVehicleId = vehicle.id;
    this.showNewVehicleForm = false;

    this.diagnostic.vehicleInfo = {
      plate: vehicle.placas || '',
      brand: vehicle.marca || '',
      model: vehicle.modelo || '',
      year: vehicle.anio || '',
      mileage: vehicle.kilometraje_inicial?.toString() || '',
      color: vehicle.color || ''
    };

    this.vehicleSelected.emit(vehicle);
    this.diagnosticChange.emit(this.diagnostic);
  }

  toggleExpand() {
    if (this.initialDiagnostic) {
      this.cancelled.emit();
    } else {
      this.isExpanded = !this.isExpanded;
    }
  }

  cancelEditing() {
    if (this.initialDiagnostic) {
      this.cancelled.emit();
    } else {
      this.isExpanded = false;
    }
  }

  onCategoryChange() {
    this.newItem.item = '';
    this.availableItems = DIAGNOSTIC_ITEMS_BY_CATEGORY[this.newItem.category] || [];
  }

  onServiceCategoryChange() {
    this.selectedServiceSku = '';
    this.selectedServiceData = null;
    this.availableServices = getServicesByCategory(this.newItem.category);
  }

  onServiceSelected() {
    this.selectedServiceData = PREDEFINED_SERVICES.find(s => s.sku === this.selectedServiceSku) || null;
    if (this.selectedServiceData) {
      this.newItem.item = this.selectedServiceData.nombre;
      this.newItem.description = this.selectedServiceData.descripcion;
    }
  }

  canAddItem(): boolean {
    if (!this.newItem.category || !this.newItem.severity || !this.newItem.description) {
      return false;
    }
    if (this.newItem.item === 'custom') {
      return this.customItemName.trim().length > 0;
    }
    return this.newItem.item.length > 0;
  }

  addDiagnosticItem() {
    if (!this.canAddItem()) return;

    const itemName = this.newItem.item === 'custom' ? this.customItemName : this.newItem.item;

    // PREVENIR DUPLICADOS: Verificar si ya existe un item con el mismo nombre y categoría
    const isDuplicate = this.diagnostic.items.some(
      item => item.item.toLowerCase() === itemName.toLowerCase() &&
              item.category === this.newItem.category
    );

    if (isDuplicate) {
      alert(`⚠️ Ya existe un item con el nombre "${itemName}" en la categoría "${this.newItem.category}". No se pueden agregar items duplicados.`);
      return;
    }

    const diagnosticItem: DiagnosticItem = {
      id: Date.now().toString(),
      category: this.newItem.category,
      item: itemName,
      description: this.newItem.description,
      severity: this.newItem.severity as DiagnosticSeverity,
      estimatedCost: this.selectedServiceData?.precioConIva || 0,
      serviceSku: this.selectedServiceData?.sku,
      serviceName: this.selectedServiceData?.nombre,
      servicePrice: this.selectedServiceData?.precioConIva,
    };

    this.diagnostic.items.push(diagnosticItem);

    this.newItem = {
      category: '',
      item: '',
      description: '',
      severity: '',
    };
    this.customItemName = '';
    this.availableItems = [];
    this.selectedServiceSku = '';
    this.selectedServiceData = null;
    this.availableServices = [];
  }

  removeDiagnosticItem(index: number) {
    this.diagnostic.items.splice(index, 1);
  }

  calculatePartPricing() {
    const costo = this.newPart.costo || 0;

    if (costo > 0) {
      // Costo con IVA
      const costoConIva = costo * 1.16;

      // Precio de venta público (usar margen seleccionado del dashboard)
      const marginMultiplier = 1 + (this.selectedMarginPercentage / 100);
      const precio = costoConIva * marginMultiplier;

      // Margen
      const margen = precio - costoConIva;

      // Porcentaje de margen
      const porcentaje = ((margen / costoConIva) * 100);

      this.newPart.precio = parseFloat(precio.toFixed(2));
      this.newPart.margen = parseFloat(margen.toFixed(2));
      this.newPart.porcentaje = parseFloat(porcentaje.toFixed(2));
    } else {
      this.newPart.precio = 0;
      this.newPart.margen = 0;
      this.newPart.porcentaje = 0;
    }
  }

  canAddPart(): boolean {
    return !!(
      this.newPart.descripcion &&
      this.newPart.cantidad &&
      this.newPart.costo &&
      this.newPart.costo > 0 &&
      this.diagnostic.items.length > 0
    );
  }

  selectServiceForParts(item: DiagnosticItem) {
    this.selectedServiceForParts = item;
    this.newPart = {
      sku: '',
      descripcion: '',
      cantidad: 1,
      costo: 0,
      precio: 0,
      margen: 0,
      porcentaje: 0,
    };
  }

  getServiceParts(serviceId: string): DiagnosticPart[] {
    if (!this.diagnostic.parts) return [];
    return this.diagnostic.parts.filter(part => part.relatedServiceId === serviceId);
  }

  addDiagnosticPart() {
    if (!this.canAddPart() || !this.selectedServiceForParts) return;

    // Generar SKU automático si no se proporcionó
    const sku = this.newPart.sku || `DIAG-${Date.now()}`;

    const part: DiagnosticPart = {
      id: Date.now().toString(),
      sku: sku,
      descripcion: this.newPart.descripcion!,
      cantidad: this.newPart.cantidad!,
      costo: this.newPart.costo!,
      precio: this.newPart.precio!,
      margen: this.newPart.margen!,
      porcentaje: this.newPart.porcentaje!,
      severity: this.selectedServiceForParts.severity,
      relatedServiceId: this.selectedServiceForParts.id,
    };

    if (!this.diagnostic.parts) {
      this.diagnostic.parts = [];
    }

    this.diagnostic.parts.push(part);

    // Resetear el formulario
    this.newPart = {
      sku: '',
      descripcion: '',
      cantidad: 1,
      costo: 0,
      precio: 0,
      margen: 0,
      porcentaje: 0,
    };

    this.diagnosticChange.emit(this.diagnostic);
  }

  removeDiagnosticPart(partId: string) {
    if (this.diagnostic.parts) {
      const index = this.diagnostic.parts.findIndex(p => p.id === partId);
      if (index !== -1) {
        this.diagnostic.parts.splice(index, 1);
        this.diagnosticChange.emit(this.diagnostic);
      }
    }
  }

  saveDiagnostic() {
    this.diagnostic.completedAt = new Date();

    if (this.initialDiagnostic) {
      this.diagnosticCompleted.emit(this.diagnostic);
    } else {
      this.diagnosticChange.emit(this.diagnostic);
      this.isExpanded = false;
    }
  }

  getItemCountBySeverity(severity: DiagnosticSeverity): number {
    return this.diagnostic.items.filter(item => item.severity === severity).length;
  }

  getSeverityColor(severity: DiagnosticSeverity): string {
    return getSeverityColor(severity);
  }

  getSeverityBadgeColor(severity: DiagnosticSeverity): string {
    return getSeverityBadgeColor(severity);
  }

  getSeverityLabel(severity: DiagnosticSeverity): string {
    return getSeverityLabel(severity);
  }

  getSeverityIcon(severity: DiagnosticSeverity): string {
    return getSeverityIcon(severity);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  getSeverityButtonClass(severity: DiagnosticSeverity): string {
    const isSelected = this.newItem.severity === severity;
    const baseClasses = isSelected ? 'border-current shadow-lg scale-105' : 'border-gray-300 opacity-70 hover:opacity-100';

    let colorClasses = '';
    switch (severity) {
      case 'urgent':
        colorClasses = isSelected ? 'bg-red-100 border-red-500 text-red-800' : 'text-red-600';
        break;
      case 'recommended':
        colorClasses = isSelected ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'text-yellow-600';
        break;
      case 'good':
        colorClasses = isSelected ? 'bg-green-100 border-green-500 text-green-800' : 'text-green-600';
        break;
    }

    return `${baseClasses} ${colorClasses}`;
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || '📋';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  }
}
