import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Order, OrderInvoice, XmlProduct, ProductosPorProveedor } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class XmlProductsService {
  constructor(private supabase: SupabaseService) {}

  async saveInvoices(orderId: string, invoices: OrderInvoice[]): Promise<void> {
    try {
      for (const invoice of invoices) {
        const { data: invoiceData, error: invoiceError } = await this.supabase.client
          .from('order_invoices')
          .insert({
            order_id: orderId,
            invoice_folio: invoice.invoice_folio,
            xml_content: invoice.xml_content,
            total_amount: invoice.total_amount,
            proveedor_nombre: invoice.proveedor,
            rfc_proveedor: invoice.rfc_proveedor,
            validados: invoice.validados || 0,
            nuevos: invoice.nuevos || 0
          })
          .select()
          .maybeSingle();

        if (invoiceError) {
          console.error('Error insertando factura:', invoiceError);
          throw new Error(`Error al guardar factura ${invoice.invoice_folio}: ${invoiceError.message}`);
        }

        if (!invoiceData) {
          throw new Error(`No se pudo crear la factura ${invoice.invoice_folio}`);
        }

        if (invoice.xml_products && invoice.xml_products.length > 0) {
          const productsToInsert = invoice.xml_products.map(product => ({
            invoice_id: invoiceData.id,
            order_id: orderId,
            descripcion: product.descripcion || 'Sin descripción',
            cantidad: product.cantidad || 0,
            precio: product.precio || 0,
            subtotal: product.subtotal || 0,
            iva: product.iva || 0,
            total: product.total || 0,
            clave_prod_serv: product.claveProdServ || null,
            sku_xml: product.claveProdServ || null,
            clave_unidad: product.claveUnidad || null,
            unidad: product.unidad || 'PZ',
            is_validated: false,
            is_new: true,
            product_status: 'pending',
            proveedor: product.proveedor || invoice.proveedor,
            invoice_number: invoice.invoice_folio,
            supplier_rfc: invoice.rfc_proveedor,
            supplier_name: invoice.proveedor,
            is_generic_supplier: invoice.isGenericSupplier || false
          }));

          const { error: productsError } = await this.supabase.client
            .from('xml_products')
            .insert(productsToInsert);

          if (productsError) {
            console.error('Error insertando productos:', productsError);
            throw new Error(`Error al guardar productos: ${productsError.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error en saveInvoices:', error);
      throw error;
    }
  }

  async getOrderInvoices(orderId: string): Promise<OrderInvoice[]> {
    const { data, error } = await this.supabase.client
      .from('order_invoices')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return data || [];
  }

  async getInvoiceProducts(invoiceId: string): Promise<XmlProduct[]> {
    const { data, error } = await this.supabase.client
      .from('xml_products')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (error) throw error;
    return data || [];
  }

  async getOrderXmlProducts(orderId: string): Promise<XmlProduct[]> {
    const { data, error } = await this.supabase.client
      .from('xml_products')
      .select('*')
      .eq('order_id', orderId);

    if (error) throw error;
    return data || [];
  }

  async classifyProduct(productId: string, classification: any): Promise<void> {
    const { error } = await this.supabase.client
      .from('xml_products')
      .update({
        division: classification.division,
        linea: classification.linea,
        clase: classification.clase,
        subclase: classification.subclase,
        margen: classification.margen,
        precio_venta: classification.precioVenta,
        is_validated: true,
        is_new: false,
        product_status: 'found'
      })
      .eq('id', productId);

    if (error) throw error;
  }

  async validateExistingProduct(productId: string, sku: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('xml_products')
      .update({
        sku: sku,
        is_validated: true,
        is_new: false,
        product_status: 'found'
      })
      .eq('id', productId);

    if (error) throw error;
  }

  async updateProductSku(productId: string, skuOriginal: string, skuFinal: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('xml_products')
      .update({
        sku_original: skuOriginal,
        sku_final: skuFinal,
        is_processed: true
      })
      .eq('id', productId);

    if (error) throw error;
  }

  async updateOrderStatus(orderId: string, status: string, additionalData?: any): Promise<void> {
    const updateData: any = { status };

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    const { error } = await this.supabase.client
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('order_invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;
  }

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('xml_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }

  groupProductsByProvider(products: XmlProduct[], invoices?: OrderInvoice[]): ProductosPorProveedor[] {
    // Filtrar productos procesados Y no encontrados (ambos deben mostrarse en Pre-OC)
    const processedProducts = products.filter(p =>
      p.isProcessed ||
      p.product_status === 'processed' ||
      p.product_status === 'not_found'
    );

    const grouped = processedProducts.reduce((acc, product) => {
      if (!acc[product.proveedor]) {
        const invoice = invoices?.find(inv => inv.proveedor === product.proveedor);
        acc[product.proveedor] = {
          proveedor: product.proveedor,
          rfc: invoice?.rfc_proveedor,
          productos: [],
          totalValidados: 0,
          totalNuevos: 0,
          montoTotal: 0
        };
      }

      acc[product.proveedor].productos.push(product);
      // Usar precio * cantidad en lugar de total
      acc[product.proveedor].montoTotal += (product.precio * product.cantidad);

      if (product.isValidated) {
        acc[product.proveedor].totalValidados++;
      }
      if (product.isNew) {
        acc[product.proveedor].totalNuevos++;
      }

      return acc;
    }, {} as { [key: string]: ProductosPorProveedor });

    return Object.values(grouped);
  }

  async simulateValidateProducts(orderId: string): Promise<{ validados: number; nuevos: number; noEncontrados: number }> {
    try {
      const products = await this.getOrderXmlProducts(orderId);

      if (products.length === 0) {
        return { validados: 0, nuevos: 0, noEncontrados: 0 };
      }

      let validados = 0;
      let noEncontrados = 0;

      for (const product of products) {
        if (!product.id) continue;

        const encontrado = await this.buscarProductoEnBaseDatos(product.descripcion);

        if (encontrado) {
          await this.validateExistingProduct(product.id, encontrado.sku);
          validados++;
        } else {
          await this.autoClassifyNotFoundProduct(product.id);
          noEncontrados++;
        }
      }

      const nuevos = products.length - validados - noEncontrados;

      return { validados, nuevos, noEncontrados };
    } catch (error: any) {
      console.error('Error en simulateValidateProducts:', error);
      throw error;
    }
  }

  private async buscarProductoEnBaseDatos(descripcion: string): Promise<{ sku: string } | null> {
    try {
      // TODO: La tabla 'products' aún no existe en la base de datos
      // Por ahora, retornamos null para indicar que el producto no fue encontrado
      // Una vez creada la tabla products, descomentar el código siguiente:

      /*
      const { data, error } = await this.supabase.client
        .from('products')
        .select('sku, descripcion')
        .ilike('descripcion', `%${descripcion}%`)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return { sku: data.sku };
      */

      return null;
    } catch (error) {
      console.error('Error buscando producto:', error);
      return null;
    }
  }

  generateSKU(clase: string, index: number): { original: string; final: string } {
    const year = new Date().getFullYear();
    const prefix = clase.substring(0, 3).toUpperCase();
    const sequential = String(index).padStart(3, '0');

    return {
      original: `${prefix}${sequential}`,
      final: `${prefix}-${sequential}-${year}`
    };
  }

  /**
   * Auto-clasifica productos no encontrados con valores por defecto
   * División: 0134, Línea: 260, Clase: 271
   */
  async autoClassifyNotFoundProduct(productId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('xml_products')
      .update({
        division: '0134',
        linea: '260',
        clase: '271',
        subclase: 'NO CLASIFICADO',
        margen: 0,
        precio_venta: 0,
        is_validated: true,
        is_new: false,
        is_auto_classified: true,
        not_found: true,
        product_status: 'not_found'
      })
      .eq('id', productId);

    if (error) throw error;
  }

  /**
   * Obtiene todos los productos no encontrados de una orden
   */
  async getNotFoundProducts(orderId: string): Promise<XmlProduct[]> {
    const { data, error } = await this.supabase.client
      .from('xml_products')
      .select('*')
      .eq('order_id', orderId)
      .eq('not_found', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Cuenta productos no encontrados en una orden
   */
  async countNotFoundProducts(orderId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('xml_products')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('not_found', true);

    if (error) throw error;
    return count || 0;
  }
}
