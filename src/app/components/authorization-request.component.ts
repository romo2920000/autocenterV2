import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagnosticItem } from '../models/diagnostic.model';
import { DiagnosticItemAuthorization, Product, Service } from '../models/order.model';
import { getSeverityLabel, getSeverityBadgeColor } from '../models/diagnostic.model';

// Interface unificada para mostrar items de autorización
interface AuthorizationItem {
  id: string;
  type: 'product' | 'service' | 'diagnostic';
  item: string;
  description: string;
  category: string;
  estimatedCost: number;
  severity?: string;
  isPreAuthorized: boolean;
  isAuthorized?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  authorizationDate?: Date;
  originalItem: any; // Referencia al item original
}

@Component({
  selector: 'app-authorization-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 max-h-[90vh] flex flex-col">
      <div class="border-b pb-4 mb-6 flex-shrink-0">
        <h2 class="text-2xl font-bold text-gray-800">Solicitud de Autorización</h2>
        <p class="text-gray-600 mt-2">Pedido: {{ orderFolio }}</p>
        <p class="text-gray-600">Cliente: {{ customerName }}</p>
      </div>

      <div class="space-y-4 overflow-y-auto flex-1 pr-2" style="max-height: calc(90vh - 300px);">
        <div
          *ngFor="let item of allItems; let i = index"
          class="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <!-- Badge de Pre-autorizada o Severidad -->
                <span
                  *ngIf="item.isPreAuthorized"
                  class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"
                >
                  🔵 PRE-AUTORIZADA
                </span>
                <span
                  *ngIf="!item.isPreAuthorized && item.severity"
                  [class]="getSeverityClass(item.severity)"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {{ getSeverityEmoji(item.severity) }} {{ getSeverityText(item.severity) }}
                </span>
                <span class="text-sm text-gray-500 font-medium">{{ item.category }}</span>
              </div>

              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                <span *ngIf="item.type === 'product'" class="text-blue-600">[REFACCIÓN]</span>
                <span *ngIf="item.type === 'service'" class="text-green-600">[MANO DE OBRA]</span>
                <span *ngIf="item.type === 'diagnostic'" class="text-purple-600">[HALLAZGO]</span>
                {{ item.item }}
              </h3>
              <p class="text-gray-600 mb-3">{{ item.description }}</p>

              <div class="flex items-center justify-between">
                <div class="text-xl font-bold text-gray-900">
                  $ {{ item.estimatedCost?.toFixed(2) || '0.00' }}
                </div>

                <div class="flex items-center gap-4">
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      [(ngModel)]="item.isAuthorized"
                      (change)="onAuthorizationChange(item, true)"
                      [disabled]="!!item.isRejected"
                      class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                    />
                    <span class="text-sm font-medium transition-colors"
                          [class.text-green-700]="item.isAuthorized"
                          [class.text-gray-700]="!item.isAuthorized && !item.isRejected"
                          [class.text-gray-400]="item.isRejected">
                      {{ item.isAuthorized ? '✓ Autorizado' : 'Autorizar' }}
                    </span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      [(ngModel)]="item.isRejected"
                      (change)="onAuthorizationChange(item, false)"
                      [disabled]="!!item.isAuthorized"
                      class="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
                    />
                    <span class="text-sm font-medium transition-colors"
                          [class.text-red-700]="item.isRejected"
                          [class.text-gray-700]="!item.isRejected && !item.isAuthorized"
                          [class.text-gray-400]="item.isAuthorized">
                      {{ item.isRejected ? '✗ No Autorizado' : 'No Autorizar' }}
                    </span>
                  </label>
                </div>
              </div>

              <div *ngIf="item.isRejected" class="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <label class="block text-sm font-medium text-red-900 mb-2">
                  Razón del rechazo *
                </label>
                <textarea
                  [(ngModel)]="item.rejectionReason"
                  placeholder="Explique por qué no se autorizó este servicio (Ej: Muy costoso, lo haré después, no es necesario, etc.)"
                  rows="2"
                  class="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                ></textarea>
                <p class="text-xs text-red-600 mt-1">
                  ⚠️ Este servicio se registrará como venta perdida para análisis estadístico
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t flex-shrink-0">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700">Total de servicios ofrecidos:</span>
            <span class="font-semibold">$ {{ getTotalEstimated().toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-green-700">Total autorizado:</span>
            <span class="font-bold text-green-700">$ {{ getTotalAuthorized().toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-red-700">Total rechazado:</span>
            <span class="font-bold text-red-700">$ {{ getTotalRejected().toFixed(2) }}</span>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            (click)="onCancel()"
            class="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            (click)="onSubmit()"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Confirmar Autorización
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AuthorizationRequestComponent implements OnInit {
  @Input() orderFolio: string = '';
  @Input() customerName: string = '';
  @Input() diagnosticItems: DiagnosticItem[] = [];
  @Input() products: Product[] = [];
  @Input() services: Service[] = [];
  @Output() authorizationSubmitted = new EventEmitter<DiagnosticItem[]>();
  @Output() cancelled = new EventEmitter<void>();

  allItems: AuthorizationItem[] = [];

  ngOnInit() {
    this.buildUnifiedItemsList();
  }

  buildUnifiedItemsList() {
    this.allItems = [];

    // Agregar productos (refacciones)
    this.products?.forEach((product, idx) => {
      const isPreAuthorized = !product.fromDiagnostic;
      this.allItems.push({
        id: `product-${idx}`,
        type: 'product',
        item: product.descripcion,
        description: `Cantidad: ${product.cantidad}`,
        category: 'REFACCIÓN',
        estimatedCost: product.precio * product.cantidad,
        severity: product.diagnosticSeverity,
        isPreAuthorized: isPreAuthorized,
        isAuthorized: isPreAuthorized, // Pre-autorizadas están autorizadas por defecto
        originalItem: product
      });
    });

    // Agregar servicios (mano de obra)
    this.services?.forEach((service, idx) => {
      const isPreAuthorized = !service.fromDiagnostic;
      this.allItems.push({
        id: `service-${idx}`,
        type: 'service',
        item: service.nombre,
        description: service.descripcion,
        category: service.categoria,
        estimatedCost: service.precio,
        severity: service.diagnosticSeverity,
        isPreAuthorized: isPreAuthorized,
        isAuthorized: isPreAuthorized, // Pre-autorizadas están autorizadas por defecto
        originalItem: service
      });
    });

    // Agregar items del diagnóstico (hallazgos)
    this.diagnosticItems?.forEach((item, idx) => {
      this.allItems.push({
        id: `diagnostic-${idx}`,
        type: 'diagnostic',
        item: item.item,
        description: item.description,
        category: item.category,
        estimatedCost: item.estimatedCost || 0,
        severity: item.severity,
        isPreAuthorized: false,
        isAuthorized: item.isAuthorized,
        isRejected: item.isRejected,
        rejectionReason: item.rejectionReason,
        authorizationDate: item.authorizationDate,
        originalItem: item
      });
    });
  }

  getSeverityText(severity: string): string {
    return getSeverityLabel(severity as any);
  }

  getSeverityClass(severity: string): string {
    return getSeverityBadgeColor(severity as any);
  }

  getSeverityEmoji(severity: string): string {
    if (severity === 'urgent') return '🔴';
    if (severity === 'recommended') return '🟡';
    if (severity === 'good') return '🟢';
    return '';
  }

  onAuthorizationChange(item: AuthorizationItem, isAuthorized: boolean) {
    if (isAuthorized) {
      if (item.isAuthorized) {
        item.isRejected = false;
        item.rejectionReason = undefined;
        item.authorizationDate = new Date();
      }
    } else {
      if (item.isRejected) {
        item.isAuthorized = false;
        item.authorizationDate = new Date();
      }
    }
  }

  getTotalEstimated(): number {
    return this.allItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  }

  getTotalAuthorized(): number {
    return this.allItems
      .filter(item => item.isAuthorized)
      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  }

  getTotalRejected(): number {
    return this.allItems
      .filter(item => item.isRejected)
      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  }

  onSubmit() {
    const hasRejectedWithoutReason = this.allItems.some(
      item => item.isRejected && !item.rejectionReason?.trim()
    );

    if (hasRejectedWithoutReason) {
      alert('Por favor proporcione la razón para todos los servicios no autorizados');
      return;
    }

    // Sincronizar cambios desde allItems hacia los items originales
    this.allItems.forEach(item => {
      if (item.type === 'diagnostic') {
        const originalItem = item.originalItem as DiagnosticItem;
        originalItem.isAuthorized = item.isAuthorized;
        originalItem.isRejected = item.isRejected;
        originalItem.rejectionReason = item.rejectionReason;
        originalItem.authorizationDate = item.authorizationDate;
      } else if (item.type === 'product') {
        const originalItem = item.originalItem as Product;
        originalItem.isAuthorized = item.isAuthorized;
        originalItem.isRejected = item.isRejected;
      } else if (item.type === 'service') {
        const originalItem = item.originalItem as Service;
        originalItem.isAuthorized = item.isAuthorized;
        originalItem.isRejected = item.isRejected;
      }
    });

    // Emitir TODOS los items con su tipo
    this.authorizationSubmitted.emit(this.allItems as any);
  }

  onCancel() {
    this.cancelled.emit();
  }
}
