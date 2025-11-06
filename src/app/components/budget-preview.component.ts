import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../models/order.model';
import { Customer } from '../models/customer.model';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-budget-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-lg shadow-2xl max-w-5xl w-full my-8">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold">Vista Previa del Presupuesto</h2>
            <p class="text-blue-100 mt-1">Pedido: {{ order.folio }}</p>
          </div>
          <button
            (click)="onClose()"
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <!-- Preview del presupuesto -->
          <div class="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <div [innerHTML]="previewHTML" style="transform: scale(0.85); transform-origin: top left; width: 118%;"></div>
          </div>

          <!-- Opciones de envío colapsadas -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <details class="cursor-pointer">
              <summary class="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                Opciones de Envío (Opcional)
              </summary>
              <div class="mt-3 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Email del Cliente</label>
                    <input
                      type="email"
                      [(ngModel)]="customerEmail"
                      placeholder="cliente@ejemplo.com"
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                    <input
                      type="tel"
                      [(ngModel)]="customerPhone"
                      placeholder="55-1234-5678"
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        <!-- Footer con botones -->
        <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
          <div class="grid grid-cols-5 gap-2">
            <button
              (click)="onDownloadPDF()"
              [disabled]="isGeneratingPDF"
              [class.opacity-50]="isGeneratingPDF"
              class="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg *ngIf="!isGeneratingPDF" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span *ngIf="isGeneratingPDF" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {{ isGeneratingPDF ? 'Generando...' : 'Descargar PDF' }}
            </button>

            <button
              (click)="onPrint()"
              class="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              Imprimir
            </button>

            <button
              (click)="onSendEmail()"
              [disabled]="!customerEmail"
              [class.opacity-50]="!customerEmail"
              class="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Email
            </button>

            <button
              (click)="onSendWhatsApp()"
              [disabled]="!customerPhone"
              [class.opacity-50]="!customerPhone"
              class="px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
              </svg>
              WhatsApp
            </button>

            <button
              (click)="onClose()"
              class="px-4 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BudgetPreviewComponent implements OnInit {
  @Input() order!: Order;
  @Input() customer!: Customer;
  @Output() closed = new EventEmitter<void>();
  @Output() sent = new EventEmitter<{ method: string; destination: string }>();

  previewHTML: SafeHtml = '';
  customerEmail: string = '';
  customerPhone: string = '';
  isGeneratingPDF: boolean = false;

  constructor(
    private pdfGenerator: PdfGeneratorService,
    private sanitizer: DomSanitizer,
    private customerService: CustomerService
  ) {}

  async ngOnInit() {
    this.customerEmail = this.customer.email || '';
    this.customerPhone = this.customer.telefono || '';

    // Cargar autorizaciones si el pedido tiene diagnóstico
    if (this.order.id && this.order.diagnostic) {
      try {
        const authorizations = await this.customerService.getAuthorizationsByOrderId(this.order.id);
        this.order.diagnostic_authorizations = authorizations;
      } catch (error) {
        console.error('Error cargando autorizaciones:', error);
      }
    }

    // Esperar a que los logos se carguen
    await this.pdfGenerator.ensureLogosLoaded();

    const html = this.pdfGenerator.generateDiagnosticBudgetHTML(this.order, this.customer);
    this.previewHTML = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  async onDownloadPDF() {
    this.isGeneratingPDF = true;
    try {
      await this.pdfGenerator.downloadDiagnosticBudgetPDF(this.order, this.customer);
    } catch (error) {
      console.error('Error descargando PDF:', error);
    } finally {
      this.isGeneratingPDF = false;
    }
  }

  async onPrint() {
    await this.pdfGenerator.printDiagnosticBudget(this.order, this.customer);
  }

  onSendEmail() {
    if (!this.customerEmail) {
      alert('Por favor ingrese un email válido');
      return;
    }

    alert('Funcionalidad de envío por email en desarrollo.\n\nSe requiere configurar un servicio de email en el backend.');
    this.sent.emit({ method: 'email', destination: this.customerEmail });
  }

  onSendWhatsApp() {
    if (!this.customerPhone) {
      alert('Por favor ingrese un teléfono válido');
      return;
    }

    const phone = this.customerPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola! Te enviamos el presupuesto de tu servicio automotriz.\n\n` +
      `Folio: ${this.order.folio}\n` +
      `Total: $${this.order.presupuesto.toFixed(2)}\n\n` +
      `Por favor revisa el presupuesto y confirma tu autorización.`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

    alert('Se ha abierto WhatsApp. Por favor comparte el presupuesto impreso o como PDF con el cliente.');
  }

  onClose() {
    this.closed.emit();
  }
}
