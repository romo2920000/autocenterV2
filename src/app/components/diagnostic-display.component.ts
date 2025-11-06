import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  VehicleDiagnostic,
  DiagnosticItem,
  DiagnosticSeverity,
  DIAGNOSTIC_CATEGORIES,
  getSeverityColor,
  getSeverityBadgeColor,
  getSeverityLabel,
} from '../models/diagnostic.model';

@Component({
  selector: 'app-diagnostic-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="diagnostic && diagnostic.items.length > 0" class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Diagnóstico del Vehículo</h3>
          <p class="text-sm text-gray-600">{{ diagnostic.items.length }} items inspeccionados</p>
        </div>
      </div>

      <div *ngIf="diagnostic.vehicleInfo" class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Información del Vehículo</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div *ngIf="diagnostic.vehicleInfo.plate">
            <span class="text-gray-600">Placas:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.vehicleInfo.plate }}</span>
          </div>
          <div *ngIf="diagnostic.vehicleInfo.brand">
            <span class="text-gray-600">Marca:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.vehicleInfo.brand }}</span>
          </div>
          <div *ngIf="diagnostic.vehicleInfo.model">
            <span class="text-gray-600">Modelo:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.vehicleInfo.model }}</span>
          </div>
          <div *ngIf="diagnostic.vehicleInfo.year">
            <span class="text-gray-600">Año:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.vehicleInfo.year }}</span>
          </div>
          <div *ngIf="diagnostic.vehicleInfo.mileage">
            <span class="text-gray-600">Kilometraje:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.vehicleInfo.mileage }}</span>
          </div>
          <div *ngIf="diagnostic.technicianName">
            <span class="text-gray-600">Técnico:</span>
            <span class="font-medium text-gray-900 ml-2">{{ diagnostic.technicianName }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-red-600">{{ getItemCountBySeverity('urgent') }}</div>
              <div class="text-sm text-red-800 font-medium">Urgentes</div>
            </div>
            <div class="text-3xl">⚠️</div>
          </div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-yellow-600">{{ getItemCountBySeverity('recommended') }}</div>
              <div class="text-sm text-yellow-800 font-medium">Recomendables</div>
            </div>
            <div class="text-3xl">⚡</div>
          </div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold text-green-600">{{ getItemCountBySeverity('good') }}</div>
              <div class="text-sm text-green-800 font-medium">En Buen Estado</div>
            </div>
            <div class="text-3xl">✓</div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Detalles del Diagnóstico</h4>

        <div *ngIf="getItemsBySeverity('urgent').length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
            <span class="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {{ getItemsBySeverity('urgent').length }}
            </span>
            Items Urgentes
          </h5>
          <div class="space-y-2">
            <div
              *ngFor="let item of getItemsBySeverity('urgent')"
              [class]="getSeverityColor(item.severity)"
              class="p-3 rounded-lg border-2"
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
                  <p class="text-xs text-gray-500 ml-7 mt-1">{{ getCategoryName(item.category) }}</p>
                </div>
                <div class="ml-4">
                  <div *ngIf="isItemSentToAuthorization(item)" class="flex flex-col gap-1">
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === true"
                          class="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Autorizado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === false"
                          class="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Rechazado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === null"
                          class="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      En Autorización
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="getItemsBySeverity('recommended').length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <span class="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {{ getItemsBySeverity('recommended').length }}
            </span>
            Items Recomendables
          </h5>
          <div class="space-y-2">
            <div
              *ngFor="let item of getItemsBySeverity('recommended')"
              [class]="getSeverityColor(item.severity)"
              class="p-3 rounded-lg border-2"
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
                  <p class="text-xs text-gray-500 ml-7 mt-1">{{ getCategoryName(item.category) }}</p>
                </div>
                <div class="ml-4">
                  <div *ngIf="isItemSentToAuthorization(item)" class="flex flex-col gap-1">
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === true"
                          class="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Autorizado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === false"
                          class="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Rechazado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === null"
                          class="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      En Autorización
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="getItemsBySeverity('good').length > 0" class="mb-4">
          <h5 class="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
            <span class="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {{ getItemsBySeverity('good').length }}
            </span>
            Items en Buen Estado
          </h5>
          <div class="space-y-2">
            <div
              *ngFor="let item of getItemsBySeverity('good')"
              [class]="getSeverityColor(item.severity)"
              class="p-3 rounded-lg border-2"
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
                  <p class="text-xs text-gray-500 ml-7 mt-1">{{ getCategoryName(item.category) }}</p>
                </div>
                <div class="ml-4">
                  <div *ngIf="isItemSentToAuthorization(item)" class="flex flex-col gap-1">
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === true"
                          class="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Autorizado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === false"
                          class="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      Rechazado
                    </span>
                    <span *ngIf="getAuthorizationStatus(item)?.is_authorized === null"
                          class="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      En Autorización
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="getProcessedItems().length > 0" class="mt-6 pt-6 border-t border-gray-300">
        <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Items Ya Procesados ({{ getProcessedItems().length }})
        </h4>
        <div class="space-y-2">
          <div
            *ngFor="let item of getProcessedItems()"
            class="p-3 rounded-lg border-2 bg-gray-50 border-gray-200 opacity-60"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">{{ getCategoryIcon(item.category) }}</span>
                  <span class="font-medium text-sm line-through text-gray-600">{{ item.item }}</span>
                  <span *ngIf="item.isAuthorized" class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Autorizado
                  </span>
                  <span *ngIf="item.isRejected" class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Rechazado
                  </span>
                </div>
                <p class="text-sm text-gray-600 ml-7">{{ item.description }}</p>
                <p *ngIf="item.isRejected && item.rejectionReason" class="text-xs text-red-600 ml-7 mt-1">
                  Razón: {{ item.rejectionReason }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="diagnostic.completedAt" class="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        Diagnóstico completado el {{ diagnostic.completedAt | date:'medium' }}
      </div>
    </div>
  `,
})
export class DiagnosticDisplayComponent {
  @Input() diagnostic: VehicleDiagnostic | undefined;
  @Input() diagnosticAuthorizations: any[] = []; // Items ya enviados a autorización

  categories = DIAGNOSTIC_CATEGORIES;

  getItemCountBySeverity(severity: DiagnosticSeverity): number {
    if (!this.diagnostic) return 0;
    // Contar solo items que NO hayan sido autorizados o rechazados
    return this.diagnostic.items.filter(item =>
      item.severity === severity &&
      !item.isAuthorized &&
      !item.isRejected
    ).length;
  }

  getItemsBySeverity(severity: DiagnosticSeverity): DiagnosticItem[] {
    if (!this.diagnostic) return [];
    // Filtrar solo items que NO hayan sido autorizados o rechazados
    return this.diagnostic.items.filter(item =>
      item.severity === severity &&
      !item.isAuthorized &&
      !item.isRejected
    );
  }

  getProcessedItems(): DiagnosticItem[] {
    if (!this.diagnostic) return [];
    // Retornar items que YA fueron autorizados o rechazados
    return this.diagnostic.items.filter(item =>
      item.isAuthorized || item.isRejected
    );
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

  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.icon || '📋';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  }

  // Verificar si un item ya fue enviado a autorización
  isItemSentToAuthorization(item: DiagnosticItem): boolean {
    return this.diagnosticAuthorizations.some(
      auth => auth.diagnostic_item_id === item.id
    );
  }

  // Obtener el estado de autorización de un item
  getAuthorizationStatus(item: DiagnosticItem): any {
    return this.diagnosticAuthorizations.find(
      auth => auth.diagnostic_item_id === item.id
    );
  }
}
