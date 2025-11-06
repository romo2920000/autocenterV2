import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderInvoice } from '../models/order.model';

@Component({
  selector: 'app-invoice-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="border-b pb-4 mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Cargar Factura</h2>
        <p class="text-gray-600 mt-2">Pedido: {{ orderFolio }}</p>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Folio de Factura *
          </label>
          <input
            type="text"
            [(ngModel)]="invoiceFolio"
            placeholder="Ej: FACT-2024-001"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Monto Total *
          </label>
          <input
            type="number"
            [(ngModel)]="totalAmount"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Archivo XML de Factura
          </label>
          <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <div class="space-y-1 text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="flex text-sm text-gray-600">
                <label
                  class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Subir archivo</span>
                  <input
                    type="file"
                    accept=".xml"
                    (change)="onFileSelected($event)"
                    class="sr-only"
                  />
                </label>
                <p class="pl-1">o arrastrar y soltar</p>
              </div>
              <p class="text-xs text-gray-500">XML hasta 10MB</p>
            </div>
          </div>
          <p *ngIf="selectedFileName" class="mt-2 text-sm text-gray-600">
            Archivo seleccionado: <strong>{{ selectedFileName }}</strong>
          </p>
        </div>

        <div *ngIf="xmlContent">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Vista previa del XML
          </label>
          <div class="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <pre class="text-xs text-gray-700">{{ xmlPreview }}</pre>
          </div>
        </div>

        <div *ngIf="parsedItems.length > 0">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Items de la Factura</h3>
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600">Descripción</th>
                  <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600">Cantidad</th>
                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Precio</th>
                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let item of parsedItems">
                  <td class="px-4 py-2 text-sm text-gray-900">{{ item.description }}</td>
                  <td class="px-4 py-2 text-sm text-center text-gray-700">{{ item.quantity }}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-700">\${{ item.price }}</td>
                  <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900">\${{ item.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t flex gap-3">
        <button
          (click)="onCancel()"
          class="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          (click)="onSubmit()"
          [disabled]="!isValid()"
          [class.opacity-50]="!isValid()"
          [class.cursor-not-allowed]="!isValid()"
          class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Guardar Factura
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class InvoiceUploadComponent {
  @Input() orderFolio: string = '';
  @Output() invoiceUploaded = new EventEmitter<OrderInvoice>();
  @Output() cancelled = new EventEmitter<void>();

  invoiceFolio: string = '';
  totalAmount: number = 0;
  xmlContent: string = '';
  selectedFileName: string = '';
  parsedItems: any[] = [];

  get xmlPreview(): string {
    return this.xmlContent.substring(0, 500) + (this.xmlContent.length > 500 ? '...' : '');
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.xmlContent = e.target.result;
        this.parseXML(this.xmlContent);
      };
      reader.readAsText(file);
    }
  }

  parseXML(xmlContent: string) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

      const items: any[] = [];
      const conceptos = xmlDoc.getElementsByTagName('Concepto');

      for (let i = 0; i < conceptos.length; i++) {
        const concepto = conceptos[i];
        items.push({
          description: concepto.getAttribute('Descripcion') || '',
          quantity: parseFloat(concepto.getAttribute('Cantidad') || '0'),
          price: parseFloat(concepto.getAttribute('ValorUnitario') || '0'),
          total: parseFloat(concepto.getAttribute('Importe') || '0')
        });
      }

      this.parsedItems = items;

      const total = xmlDoc.getElementsByTagName('Total')[0];
      if (total && total.textContent) {
        this.totalAmount = parseFloat(total.textContent);
      }
    } catch (error) {
      console.error('Error parseando XML:', error);
    }
  }

  isValid(): boolean {
    return this.invoiceFolio.trim() !== '' && this.totalAmount > 0;
  }

  onSubmit() {
    if (!this.isValid()) return;

    const invoice: OrderInvoice = {
      invoice_folio: this.invoiceFolio,
      xml_content: this.xmlContent,
      xml_data: this.parsedItems.length > 0 ? { items: this.parsedItems } : undefined,
      total_amount: this.totalAmount,
      items: this.parsedItems,
      proveedor: 'Proveedor Desconocido',
      rfc_proveedor: '',
      validados: 0,
      nuevos: this.parsedItems.length
    };

    this.invoiceUploaded.emit(invoice);
  }

  onCancel() {
    this.cancelled.emit();
  }
}
