import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { XmlProduct } from '../models/order.model';

interface ClassificationData {
  division: string;
  linea: string;
  clase: string;
  subclase: string;
  margen: number;
  precioVenta: number;
}

@Component({
  selector: 'app-product-classification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b p-6 z-10">
          <h2 class="text-2xl font-bold text-gray-800">Clasificar Producto Nuevo</h2>
          <p class="text-sm text-gray-600 mt-2">
            Producto {{ currentIndex + 1 }} de {{ totalProducts }}
          </p>
          <div class="mt-2 bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all"
              [style.width.%]="(currentIndex / totalProducts) * 100"
            ></div>
          </div>
        </div>

        <div *ngIf="product" class="p-6 space-y-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">Información de la Refacción</h3>
            <p class="text-sm text-gray-700"><strong>Descripción:</strong> {{ product.descripcion }}</p>
            <p class="text-sm text-gray-700"><strong>Proveedor:</strong> {{ product.proveedor }}</p>
            <p class="text-sm text-gray-700"><strong>Costo:</strong> \${{ product.precio.toFixed(2) }}</p>
            <p class="text-sm text-gray-700"><strong>Cantidad:</strong> {{ product.cantidad }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                División *
              </label>
              <input
                type="text"
                [(ngModel)]="classificationData.division"
                placeholder="Ej: 0094"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Línea *
              </label>
              <input
                type="text"
                [(ngModel)]="classificationData.linea"
                placeholder="Ej: 264"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Clase *
              </label>
              <input
                type="text"
                [(ngModel)]="classificationData.clase"
                placeholder="Ej: Filtro"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Subclase *
              </label>
              <input
                type="text"
                [(ngModel)]="classificationData.subclase"
                placeholder="Ej: Premium"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Margen de Ganancia (%) *
            </label>
            <input
              type="number"
              [(ngModel)]="classificationData.margen"
              (ngModelChange)="calculatePrecioVenta()"
              min="0"
              max="100"
              step="0.1"
              placeholder="Ej: 25"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-1">Ingresa el porcentaje de ganancia deseado</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta (Calculado)
            </label>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-2xl font-bold text-green-700">
                \${{ classificationData.precioVenta.toFixed(2) }}
              </p>
              <p class="text-xs text-gray-600 mt-1">
                Costo: \${{ product.precio.toFixed(2) }} + {{ classificationData.margen }}% = \${{ classificationData.precioVenta.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 bg-white border-t p-6 space-y-3">
          <!-- Botón de producto no encontrado -->
          <button
            (click)="onMarkAsNotFound()"
            class="w-full px-6 py-3 bg-yellow-100 border-2 border-yellow-400 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            ⚠️ Producto No Encontrado - Clasificar Automáticamente
          </button>
          <p class="text-xs text-gray-600 text-center">
            Se clasificará automáticamente como: División 0134, Línea 260, Clase 271
          </p>

          <div class="flex gap-3">
            <button
              (click)="onCancel()"
              class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar Todo
            </button>
            <button
              (click)="onSaveAndContinue()"
              [disabled]="!isValid()"
              [class.opacity-50]="!isValid()"
              [class.cursor-not-allowed]="!isValid()"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {{ isLast ? 'Guardar y Finalizar' : 'Guardar y Continuar →' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProductClassificationComponent {
  @Input() product: XmlProduct | null = null;
  @Input() currentIndex: number = 0;
  @Input() totalProducts: number = 0;
  @Output() productClassified = new EventEmitter<{ product: XmlProduct; classification: ClassificationData }>();
  @Output() productNotFound = new EventEmitter<XmlProduct>();
  @Output() cancelled = new EventEmitter<void>();

  classificationData: ClassificationData = {
    division: '',
    linea: '',
    clase: '',
    subclase: '',
    margen: 0,
    precioVenta: 0
  };

  get isLast(): boolean {
    return this.currentIndex === this.totalProducts - 1;
  }

  calculatePrecioVenta() {
    if (!this.product) return;
    const costo = this.product.precio;
    const margenDecimal = this.classificationData.margen / 100;
    this.classificationData.precioVenta = costo * (1 + margenDecimal);
  }

  isValid(): boolean {
    return (
      this.classificationData.division.trim() !== '' &&
      this.classificationData.linea.trim() !== '' &&
      this.classificationData.clase.trim() !== '' &&
      this.classificationData.subclase.trim() !== '' &&
      this.classificationData.margen > 0
    );
  }

  onSaveAndContinue() {
    if (!this.isValid() || !this.product) return;

    this.productClassified.emit({
      product: this.product,
      classification: { ...this.classificationData }
    });

    this.classificationData = {
      division: '',
      linea: '',
      clase: '',
      subclase: '',
      margen: 0,
      precioVenta: 0
    };
  }

  onMarkAsNotFound() {
    if (!this.product) return;

    if (confirm('¿Confirmas que este producto no fue encontrado? Se clasificará automáticamente como División 0134, Línea 260, Clase 271.')) {
      this.productNotFound.emit(this.product);
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
