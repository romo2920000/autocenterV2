import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';
import { Order, OrderInvoice } from '../models/order.model';

interface PendingSupplierValidation {
  order: Order;
  invoice: OrderInvoice;
  customer_name?: string;
  vehicle_info?: string;
}

@Component({
  selector: 'app-supplier-validation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-gray-900">Validación de Proveedores Genéricos</h2>
        <p class="text-gray-600 mt-2">Revisa y aprueba las facturas con proveedores no registrados</p>
      </div>

      <div *ngIf="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-700">Cargando validaciones pendientes...</span>
      </div>

      <div *ngIf="!isLoading && pendingValidations.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">No hay validaciones pendientes</h3>
        <p class="mt-2 text-gray-500">Todas las facturas con proveedores genéricos han sido validadas</p>
      </div>

      <div *ngIf="!isLoading && pendingValidations.length > 0" class="space-y-4">
        <div *ngFor="let validation of pendingValidations" class="bg-white rounded-lg shadow-lg overflow-hidden border-l-4 border-yellow-500">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-gray-900">Pedido: {{ validation.order.folio }}</h3>
                <p class="text-sm text-gray-600 mt-1">Cliente: {{ validation.customer_name || validation.order.cliente }}</p>
                <p class="text-sm text-gray-600" *ngIf="validation.vehicle_info">Vehículo: {{ validation.vehicle_info }}</p>
              </div>
              <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                PENDIENTE
              </span>
            </div>

            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <div class="flex-1">
                  <h4 class="font-bold text-yellow-900">Factura con Proveedor Genérico</h4>
                  <div class="mt-2 space-y-1 text-sm">
                    <p><span class="font-semibold">Factura:</span> {{ validation.invoice.invoice_folio }}</p>
                    <p><span class="font-semibold">Proveedor Original:</span> {{ validation.invoice.rfc_proveedor ? (validation.invoice.proveedor + ' (RFC: ' + validation.invoice.rfc_proveedor + ')') : validation.invoice.proveedor }}</p>
                    <p><span class="font-semibold">Total:</span> \${{ validation.invoice.total_amount.toFixed(2) }}</p>
                    <p><span class="font-semibold">Productos:</span> {{ validation.invoice.nuevos || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h5 class="font-semibold text-blue-900 mb-2">Información Importante</h5>
              <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Este proveedor no está registrado en el catálogo</li>
                <li>La factura fue cargada como "PROVEEDOR GENÉRICO"</li>
                <li>Al aprobar, el presupuesto podrá continuar al proceso de validación de productos</li>
                <li>Si rechazas, se deberá eliminar la factura y cargar una de un proveedor registrado</li>
              </ul>
            </div>

            <div class="flex gap-3 mt-4">
              <button
                (click)="approveSupplier(validation)"
                [disabled]="isProcessing"
                class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Aprobar Proveedor Genérico
                </span>
              </button>
              <button
                (click)="rejectSupplier(validation)"
                [disabled]="isProcessing"
                class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Rechazar (Requiere nueva factura)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SupplierValidationComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  pendingValidations: PendingSupplierValidation[] = [];
  isLoading = false;
  isProcessing = false;

  async ngOnInit() {
    await this.loadPendingValidations();
  }

  async loadPendingValidations() {
    this.isLoading = true;
    try {
      const { data: invoices, error } = await this.supabaseService.client
        .from('order_invoices')
        .select('*, orders!inner(*)')
        .eq('pending_supplier_validation', true)
        .eq('generic_supplier_approved', false);

      if (error) throw error;

      this.pendingValidations = [];

      for (const invoice of invoices || []) {
        const order = invoice.orders;

        const { data: customer } = await this.supabaseService.client
          .from('customers')
          .select('nombre_completo')
          .eq('id', order.customer_id)
          .maybeSingle();

        let vehicleInfo = '';
        if (order.vehicle_id) {
          const { data: vehicle } = await this.supabaseService.client
            .from('vehicles')
            .select('marca, modelo, anio, placas')
            .eq('id', order.vehicle_id)
            .maybeSingle();

          if (vehicle) {
            vehicleInfo = `${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} - ${vehicle.placas}`;
          }
        }

        this.pendingValidations.push({
          order: order,
          invoice: invoice,
          customer_name: customer?.nombre_completo,
          vehicle_info: vehicleInfo
        });
      }
    } catch (error: any) {
      console.error('Error cargando validaciones pendientes:', error);
      alert('Error al cargar las validaciones pendientes');
    } finally {
      this.isLoading = false;
    }
  }

  async approveSupplier(validation: PendingSupplierValidation) {
    if (!confirm(`¿Estás seguro de aprobar el proveedor genérico para la factura ${validation.invoice.invoice_folio}?\n\nEsto permitirá que el presupuesto continúe al siguiente paso.`)) {
      return;
    }

    this.isProcessing = true;
    try {
      const currentUser = this.authService.getCurrentUser();

      await this.supabaseService.client
        .from('order_invoices')
        .update({
          generic_supplier_approved: true,
          generic_supplier_approved_by: currentUser?.id,
          generic_supplier_approved_at: new Date().toISOString(),
          pending_supplier_validation: false
        })
        .eq('id', validation.invoice.id);

      const { data: remainingInvoices } = await this.supabaseService.client
        .from('order_invoices')
        .select('id')
        .eq('order_id', validation.order.id)
        .eq('pending_supplier_validation', true);

      if (!remainingInvoices || remainingInvoices.length === 0) {
        await this.supabaseService.client
          .from('orders')
          .update({ has_pending_supplier_validation: false })
          .eq('id', validation.order.id);
      }

      alert('Proveedor genérico aprobado correctamente');
      await this.loadPendingValidations();
    } catch (error: any) {
      console.error('Error aprobando proveedor:', error);
      alert('Error al aprobar el proveedor genérico');
    } finally {
      this.isProcessing = false;
    }
  }

  async rejectSupplier(validation: PendingSupplierValidation) {
    const reason = prompt(`Rechazar proveedor genérico de la factura ${validation.invoice.invoice_folio}\n\nPor favor indica el motivo del rechazo:`);

    if (!reason) return;

    this.isProcessing = true;
    try {
      await this.supabaseService.client
        .from('xml_products')
        .delete()
        .eq('invoice_id', validation.invoice.id);

      await this.supabaseService.client
        .from('order_invoices')
        .delete()
        .eq('id', validation.invoice.id);

      const { data: remainingInvoices } = await this.supabaseService.client
        .from('order_invoices')
        .select('id')
        .eq('order_id', validation.order.id)
        .eq('pending_supplier_validation', true);

      if (!remainingInvoices || remainingInvoices.length === 0) {
        await this.supabaseService.client
          .from('orders')
          .update({ has_pending_supplier_validation: false })
          .eq('id', validation.order.id);
      }

      alert('Factura rechazada y eliminada correctamente. Se debe cargar una nueva factura de un proveedor registrado.');
      await this.loadPendingValidations();
    } catch (error: any) {
      console.error('Error rechazando proveedor:', error);
      alert('Error al rechazar el proveedor genérico');
    } finally {
      this.isProcessing = false;
    }
  }
}
