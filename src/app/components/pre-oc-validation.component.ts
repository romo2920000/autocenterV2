import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order, ProductosPorProveedor } from '../models/order.model';
import { AuthService } from '../services/auth.service';
import { OrderPermissionsService } from '../services/order-permissions.service';

@Component({
  selector: 'app-pre-oc-validation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6" *ngIf="order">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Validación Pre-OC</h2>
          <p class="text-sm text-gray-600 mt-1">
            Doble chequeo antes de generar la Orden de Compra
          </p>
        </div>
        <button
          (click)="onClose.emit()"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Información de la Orden -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm font-medium text-blue-900">Folio de Orden</p>
            <p class="text-lg font-bold text-blue-700">{{ order.folio }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Cliente</p>
            <p class="text-lg font-bold text-blue-700">{{ order.cliente }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Vehículo</p>
            <p class="text-lg font-bold text-blue-700 capitalize">{{ order.vehicle?.placas || order.vehiculo?.placas || 'N/A' }}</p>
            <p class="text-xs text-blue-600 capitalize">{{ order.vehicle?.marca || order.vehiculo?.marca }} {{ order.vehicle?.modelo || order.vehiculo?.modelo }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Fecha</p>
            <p class="text-lg font-bold text-blue-700">{{ (order.fecha | date:'dd/MM/yyyy') || 'N/A' }}</p>
            <p class="text-xs text-blue-600">{{ (order.fecha | date:'HH:mm') || '' }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Total</p>
            <p class="text-lg font-bold text-green-700">
              \${{ order.presupuesto?.toFixed(2) || '0.00' }}
            </p>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Productos Procesados</p>
            <p class="text-lg font-bold text-purple-700">{{ order.processedProductsCount || 0 }} productos</p>
          </div>
        </div>
      </div>

      <!-- Resumen de Refacciones por Proveedor -->
      <div class="mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-3">
          Refacciones a Ordenar
        </h3>
        <div class="space-y-4" *ngIf="order.productosPorProveedor && order.productosPorProveedor.length > 0">
          <div
            *ngFor="let proveedor of order.productosPorProveedor"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div>
                <h4 class="font-bold text-gray-900">{{ proveedor.proveedor }}</h4>
                <p class="text-sm text-gray-600" *ngIf="proveedor.rfc">
                  RFC: {{ proveedor.rfc }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold text-blue-600">
                  \${{ proveedor.montoTotal.toFixed(2) }}
                </p>
                <p class="text-xs text-gray-600">
                  {{ proveedor.productos.length }} productos
                </p>
              </div>
            </div>

            <!-- Lista de Refacciones -->
            <div class="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-300 sticky top-0">
                  <tr>
                    <th class="text-left p-2 font-bold">Descripción</th>
                    <th class="text-center p-2 font-bold">SKU XML</th>
                    <th class="text-center p-2 font-bold">SKU Oracle</th>
                    <th class="text-right p-2 font-bold">Costo</th>
                    <th class="text-center p-2 font-bold">División</th>
                    <th class="text-center p-2 font-bold">Línea</th>
                    <th class="text-center p-2 font-bold">Clase</th>
                    <th class="text-center p-2 font-bold">Cant.</th>
                    <th class="text-right p-2 font-bold">Costo Total</th>
                    <th class="text-center p-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let producto of proveedor.productos" class="border-b border-gray-200 hover:bg-white">
                    <td class="p-2 font-medium">{{ producto.descripcion }}</td>
                    <td class="text-center p-2 font-mono text-xs">{{ producto.sku_xml || 'N/A' }}</td>
                    <td class="text-center p-2 font-mono text-xs bg-yellow-50 font-semibold">{{ producto.sku_oracle || 'N/A' }}</td>
                    <td class="text-right p-2">\${{ producto.precio?.toFixed(2) || '0.00' }}</td>
                    <td class="text-center p-2 font-mono">{{ producto.division || '-' }}</td>
                    <td class="text-center p-2 font-mono">{{ producto.linea || '-' }}</td>
                    <td class="text-center p-2 font-mono">{{ producto.clase || '-' }}</td>
                    <td class="text-center p-2 font-semibold">{{ producto.cantidad }}</td>
                    <td class="text-right p-2 font-bold text-green-700">
                      \${{ ((producto.precio || 0) * producto.cantidad).toFixed(2) }}
                    </td>
                    <td class="text-center p-2">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Procesado
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          *ngIf="!order.productosPorProveedor || order.productosPorProveedor.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <p>No hay refacciones cargados</p>
        </div>
      </div>

      <!-- Notas de Validación -->
      <div class="mb-6">
        <label class="block text-sm font-bold text-gray-700 mb-2">
          Notas de Validación (Opcional)
        </label>
        <textarea
          [(ngModel)]="validationNotes"
          rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Agregue cualquier observación sobre esta orden antes de generar la OC..."
          [disabled]="processing"
        ></textarea>
      </div>

      <!-- Estado de Validación Actual -->
      <div
        *ngIf="order.pre_oc_validation_status && order.pre_oc_validation_status !== 'pending'"
        class="mb-6 p-4 rounded-lg"
        [ngClass]="{
          'bg-green-50 border-l-4 border-green-500': order.pre_oc_validation_status === 'approved',
          'bg-red-50 border-l-4 border-red-500': order.pre_oc_validation_status === 'rejected'
        }"
      >
        <div class="flex items-center gap-2 mb-2">
          <svg
            *ngIf="order.pre_oc_validation_status === 'approved'"
            class="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg
            *ngIf="order.pre_oc_validation_status === 'rejected'"
            class="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <p class="font-bold" [ngClass]="{
            'text-green-900': order.pre_oc_validation_status === 'approved',
            'text-red-900': order.pre_oc_validation_status === 'rejected'
          }">
            {{ order.pre_oc_validation_status === 'approved' ? 'Validación Aprobada' : 'Validación Rechazada' }}
          </p>
        </div>
        <p class="text-sm text-gray-700" *ngIf="order.pre_oc_validation_notes">
          {{ order.pre_oc_validation_notes }}
        </p>
        <p class="text-xs text-gray-600 mt-2" *ngIf="order.pre_oc_validated_at">
          {{ order.pre_oc_validated_at | date:'medium' }}
        </p>
      </div>

      <!-- Acciones -->
      <div *ngIf="canValidate()">
        <!-- Si está pendiente de validación, mostrar botones aprobar/rechazar -->
        <div class="flex gap-4" *ngIf="!order.pre_oc_validation_status || order.pre_oc_validation_status === 'pending'">
          <button
            (click)="approve()"
            [disabled]="processing"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{{ processing ? 'Aprobando...' : 'Aprobar y Continuar' }}</span>
          </button>

          <button
            (click)="reject()"
            [disabled]="processing"
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>{{ processing ? 'Rechazando...' : 'Rechazar' }}</span>
          </button>
        </div>

        <!-- Si ya está aprobado y no tiene OC, mostrar botón generar OC -->
        <div *ngIf="order.pre_oc_validation_status === 'approved' && !order.purchase_order_number">
          <button
            (click)="generatePurchaseOrder()"
            [disabled]="processing"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span>{{ processing ? 'Generando Orden de Compra...' : 'Generar Orden de Compra' }}</span>
          </button>
        </div>

        <!-- Si ya tiene OC generada, mostrar número -->
        <div *ngIf="order.purchase_order_number" class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-bold text-green-900 text-lg">Orden de Compra Generada</p>
              <p class="text-sm text-green-700 mt-1">Esta orden ya tiene una OC asignada</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-green-700 font-medium">Número de OC</p>
              <p class="text-2xl font-bold text-green-900">{{ order.purchase_order_number }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje si no tiene permisos -->
      <div
        *ngIf="!canValidate()"
        class="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-900"
      >
        <p class="font-medium">No tienes permisos para validar esta orden</p>
        <p class="text-sm mt-1">
          Solo Gerentes, Admin Corporativo y Super Admin pueden aprobar la validación pre-OC
        </p>
      </div>
    </div>
  `
})
export class PreOcValidationComponent {
  @Input() order!: Order;
  @Output() onApprove = new EventEmitter<{ notes: string }>();
  @Output() onReject = new EventEmitter<{ notes: string }>();
  @Output() onGeneratePO = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  validationNotes: string = '';
  processing: boolean = false;

  constructor(
    private authService: AuthService,
    private permissionsService: OrderPermissionsService
  ) {}

  canValidate(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    const allowedRoles = ['super_admin', 'admin_corporativo', 'gerente'];
    return allowedRoles.includes(user.role);
  }

  approve(): void {
    if (!this.canValidate() || this.processing) return;

    if (confirm('¿Está seguro de aprobar esta orden para generar la OC?')) {
      this.processing = true;
      this.onApprove.emit({ notes: this.validationNotes });
    }
  }

  reject(): void {
    if (!this.canValidate() || this.processing) return;

    if (!this.validationNotes.trim()) {
      alert('Por favor agregue una nota explicando el motivo del rechazo');
      return;
    }

    if (confirm('¿Está seguro de rechazar esta orden?')) {
      this.processing = true;
      this.onReject.emit({ notes: this.validationNotes });
    }
  }

  generatePurchaseOrder(): void {
    if (!this.canValidate() || this.processing) return;

    if (this.order.pre_oc_validation_status !== 'approved') {
      alert('La orden debe estar aprobada antes de generar la OC');
      return;
    }

    if (confirm('¿Está seguro de generar la Orden de Compra?\n\nEsta acción creará un número de OC único y cambiará el estado de la orden.')) {
      this.processing = true;
      this.onGeneratePO.emit();
    }
  }
}
