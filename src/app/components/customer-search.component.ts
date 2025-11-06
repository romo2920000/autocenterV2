import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { Customer, Vehicle, CustomerSearchResult } from '../models/customer.model';
import { CustomerProfileComponent } from './customer-profile.component';

@Component({
  selector: 'app-customer-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerProfileComponent],
  template: `
    <div *ngIf="showCustomerProfile && selectedCustomerForProfile" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div class="w-full max-w-7xl">
        <app-customer-profile
          [customer]="selectedCustomerForProfile"
          (closed)="closeCustomerProfile()"
        ></app-customer-profile>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Búsqueda Avanzada de Cliente</h3>
          <p class="text-sm text-gray-600">Buscar por nombre, teléfono, email, RFC o registrar nuevo</p>
        </div>
      </div>

      <div *ngIf="!customerSelected && !showRegisterForm" class="space-y-4">
        <div>
          <label for="searchTerm" class="block text-sm font-medium text-gray-700 mb-2">
            Buscar Cliente
          </label>
          <div class="flex gap-3">
            <input
              type="text"
              id="searchTerm"
              [(ngModel)]="searchTerm"
              (keyup)="onSearchChange()"
              (keyup.enter)="searchCustomers()"
              class="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Nombre, apellido, teléfono, email o RFC..."
            />
            <button
              type="button"
              (click)="searchCustomers()"
              [disabled]="isSearching || !searchTerm"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {{ isSearching ? 'Buscando...' : 'Buscar' }}
            </button>
            <button
              type="button"
              (click)="showRegisterForm = true"
              class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Nuevo Cliente
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Puede buscar por nombre, apellido paterno, apellido materno, teléfono, email o RFC
          </p>
        </div>

        <div *ngIf="searchError" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">{{ searchError }}</p>
        </div>

        <div *ngIf="searchResults.length > 0" class="space-y-3">
          <h4 class="text-sm font-semibold text-gray-900">
            Resultados de búsqueda ({{ searchResults.length }})
          </h4>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              *ngFor="let result of searchResults"
              class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all hover:shadow-md"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h5 class="text-base font-semibold text-gray-900 mb-2">
                    {{ result.customer.nombre_completo }}
                  </h5>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span class="text-xs text-gray-500">Teléfono:</span>
                      <p class="font-medium text-gray-700">{{ result.customer.telefono }}</p>
                    </div>
                    <div *ngIf="result.customer.email">
                      <span class="text-xs text-gray-500">Email:</span>
                      <p class="font-medium text-gray-700">{{ result.customer.email }}</p>
                    </div>
                    <div *ngIf="result.customer.rfc">
                      <span class="text-xs text-gray-500">RFC:</span>
                      <p class="font-medium text-gray-700">{{ result.customer.rfc }}</p>
                    </div>
                    <div>
                      <span class="text-xs text-gray-500">Vehículos:</span>
                      <p class="font-medium text-gray-700">{{ result.vehicles.length }}</p>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center gap-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ result.ordersCount }} pedidos
                    </span>
                    <span *ngIf="result.lastOrderDate" class="text-xs text-gray-500">
                      Último pedido: {{ result.lastOrderDate | date:'short' }}
                    </span>
                  </div>
                  <div class="mt-3 flex gap-2">
                    <button
                      (click)="viewCustomerProfile(result); $event.stopPropagation()"
                      class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Ver Expediente Completo
                    </button>
                    <button
                      (click)="selectCustomerFromResults(result); $event.stopPropagation()"
                      class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="showNoResults && !isSearching" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <div>
              <h4 class="text-sm font-medium text-yellow-800 mb-1">No se encontraron resultados</h4>
              <p class="text-sm text-yellow-700 mb-3">No existe un cliente con los datos proporcionados.</p>
              <button
                type="button"
                (click)="showRegisterForm = true"
                class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Registrar Nuevo Cliente
              </button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="customerSelected && selectedCustomerResult" class="space-y-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-green-800 mb-1">Cliente Seleccionado</h4>
              <p class="text-sm text-green-700">Expediente completo del cliente</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Información del Cliente</h4>
            <div class="space-y-2">
              <div>
                <span class="text-xs text-gray-600">Nombre Completo:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.nombre_completo }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-600">Teléfono:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.telefono }}</p>
              </div>
              <div *ngIf="selectedCustomerResult.customer.email">
                <span class="text-xs text-gray-600">Email:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.email }}</p>
              </div>
              <div *ngIf="selectedCustomerResult.customer.rfc">
                <span class="text-xs text-gray-600">RFC:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.rfc }}</p>
              </div>
              <div *ngIf="selectedCustomerResult.customer.direccion">
                <span class="text-xs text-gray-600">Dirección:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.direccion }}</p>
              </div>
              <div *ngIf="selectedCustomerResult.customer.ciudad">
                <span class="text-xs text-gray-600">Ciudad:</span>
                <p class="text-sm font-medium text-gray-900">{{ selectedCustomerResult.customer.ciudad }}</p>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-blue-900 mb-3">Historial</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-blue-800">Pedidos Totales:</span>
                <span class="text-2xl font-bold text-blue-900">{{ selectedCustomerResult.ordersCount }}</span>
              </div>
              <div *ngIf="selectedCustomerResult.lastOrderDate">
                <span class="text-xs text-blue-700">Último pedido:</span>
                <p class="text-sm font-medium text-blue-900">{{ selectedCustomerResult.lastOrderDate | date:'medium' }}</p>
              </div>
              <div>
                <span class="text-xs text-blue-700">Vehículos registrados:</span>
                <p class="text-sm font-medium text-blue-900">{{ selectedCustomerResult.vehicles.length }}</p>
              </div>
              <div *ngIf="selectedCustomerResult.customer.created_at">
                <span class="text-xs text-blue-700">Cliente desde:</span>
                <p class="text-sm font-medium text-blue-900">{{ selectedCustomerResult.customer.created_at | date:'mediumDate' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="selectedCustomerResult.vehicles.length > 0" class="border-t border-gray-200 pt-4">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Vehículos Registrados ({{ selectedCustomerResult.vehicles.length }})</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              *ngFor="let vehicle of selectedCustomerResult.vehicles"
              class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 cursor-pointer transition-all"
              [class.border-blue-500]="selectedVehicle?.id === vehicle.id"
              [class.bg-blue-50]="selectedVehicle?.id === vehicle.id"
              (click)="selectVehicle(vehicle)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-900 mb-1">
                    {{ vehicle.marca }} {{ vehicle.modelo }}
                  </p>
                  <div class="space-y-1 text-xs text-gray-600">
                    <p><span class="font-medium">Placas:</span> {{ vehicle.placas }}</p>
                    <p><span class="font-medium">Año:</span> {{ vehicle.anio }}</p>
                    <p *ngIf="vehicle.color"><span class="font-medium">Color:</span> {{ vehicle.color }}</p>
                    <p *ngIf="vehicle.numero_serie"><span class="font-medium">N° Serie:</span> {{ vehicle.numero_serie }}</p>
                    <p *ngIf="vehicle.vin"><span class="font-medium">VIN:</span> {{ vehicle.vin }}</p>
                  </div>
                </div>
                <div *ngIf="selectedVehicle?.id === vehicle.id" class="ml-3">
                  <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            (click)="proceedWithCustomer()"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
          >
            Continuar con este Cliente
          </button>
          <button
            type="button"
            (click)="resetSearch()"
            class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md text-sm font-medium transition-colors"
          >
            Nueva Búsqueda
          </button>
        </div>
      </div>

      <div *ngIf="showRegisterForm" class="space-y-6">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 class="text-sm font-medium text-blue-800 mb-1">Registro de Nuevo Cliente</h4>
          <p class="text-sm text-blue-700">Complete la información del cliente para crear su expediente</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre(s) *</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.nombre"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Juan Carlos"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.apellido_paterno"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Pérez"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.apellido_materno"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="García"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
            <input
              type="tel"
              [(ngModel)]="newCustomer.telefono"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="3331234567"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              [(ngModel)]="newCustomer.email"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">RFC</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.rfc"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="XAXX010101000"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.ciudad"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Guadalajara"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              [(ngModel)]="newCustomer.direccion"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Calle, número, colonia"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              [(ngModel)]="newCustomer.notas"
              rows="2"
              class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm px-3 py-2 border"
              placeholder="Información adicional del cliente..."
            ></textarea>
          </div>
        </div>

        <div *ngIf="registerError" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">{{ registerError }}</p>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            (click)="registerCustomer()"
            [disabled]="isRegistering || !canRegister()"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
          >
            {{ isRegistering ? 'Registrando...' : 'Registrar Cliente' }}
          </button>
          <button
            type="button"
            (click)="cancelRegister()"
            class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CustomerSearchComponent {
  @Output() customerSelectedEvent = new EventEmitter<{ customer: Customer; vehicle?: Vehicle }>();

  searchTerm = '';
  isSearching = false;
  searchError = '';
  showNoResults = false;
  searchResults: CustomerSearchResult[] = [];

  customerSelected = false;
  selectedCustomerResult: CustomerSearchResult | null = null;
  selectedVehicle: Vehicle | null = null;

  showCustomerProfile = false;
  selectedCustomerForProfile: Customer | null = null;

  showRegisterForm = false;
  isRegistering = false;
  registerError = '';

  newCustomer: Customer = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    nombre_completo: '',
    telefono: '',
    email: '',
    rfc: '',
    direccion: '',
    ciudad: '',
    notas: ''
  };

  private searchTimeout: any;

  constructor(private customerService: CustomerService) {}

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (this.searchTerm.length >= 3) {
      this.searchTimeout = setTimeout(() => {
        this.searchCustomers();
      }, 500);
    }
  }

  async searchCustomers() {
    if (!this.searchTerm.trim() || this.searchTerm.trim().length < 3) {
      this.searchError = 'Por favor ingrese al menos 3 caracteres';
      return;
    }

    this.isSearching = true;
    this.searchError = '';
    this.showNoResults = false;
    this.searchResults = [];

    try {
      const results = await this.customerService.searchCustomers(this.searchTerm.trim());

      if (results.length > 0) {
        this.searchResults = results;
        this.showNoResults = false;
      } else {
        this.showNoResults = true;
        this.searchResults = [];
      }
    } catch (error: any) {
      this.searchError = error.message || 'Error al buscar clientes';
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectCustomerFromResults(result: CustomerSearchResult) {
    this.selectedCustomerResult = result;
    this.customerSelected = true;
    this.searchResults = [];
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    if (this.selectedCustomerResult) {
      this.customerSelectedEvent.emit({
        customer: this.selectedCustomerResult.customer,
        vehicle: vehicle
      });
    }
  }

  proceedWithCustomer() {
    if (!this.selectedCustomerResult) return;

    this.customerSelectedEvent.emit({
      customer: this.selectedCustomerResult.customer,
      vehicle: this.selectedVehicle || undefined
    });
  }

  canRegister(): boolean {
    return !!(this.newCustomer.nombre?.trim() &&
              this.newCustomer.apellido_paterno?.trim() &&
              this.newCustomer.telefono?.trim());
  }

  async registerCustomer() {
    if (!this.canRegister()) {
      this.registerError = 'Por favor complete nombre, apellido paterno y teléfono';
      return;
    }

    this.isRegistering = true;
    this.registerError = '';

    try {
      const createdCustomer = await this.customerService.createCustomer(this.newCustomer);

      this.selectedCustomerResult = {
        customer: createdCustomer,
        vehicles: [],
        ordersCount: 0
      };

      this.customerSelected = true;
      this.showRegisterForm = false;
      this.showNoResults = false;
    } catch (error: any) {
      this.registerError = error.message || 'Error al registrar el cliente';
    } finally {
      this.isRegistering = false;
    }
  }

  cancelRegister() {
    this.showRegisterForm = false;
    this.registerError = '';
    this.newCustomer = {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombre_completo: '',
      telefono: '',
      email: '',
      rfc: '',
      direccion: '',
      ciudad: '',
      notas: ''
    };
  }

  resetSearch() {
    this.searchTerm = '';
    this.customerSelected = false;
    this.selectedCustomerResult = null;
    this.selectedVehicle = null;
    this.showNoResults = false;
    this.searchError = '';
    this.showRegisterForm = false;
    this.searchResults = [];
  }

  viewCustomerProfile(result: CustomerSearchResult) {
    this.selectedCustomerForProfile = result.customer;
    this.showCustomerProfile = true;
  }

  closeCustomerProfile() {
    this.showCustomerProfile = false;
    this.selectedCustomerForProfile = null;
  }
}
