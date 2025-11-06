import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Customer, Vehicle, CustomerSearchResult } from '../models/customer.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  get client() {
    return this.supabase.client;
  }

  async searchCustomerByPhone(telefono: string): Promise<CustomerSearchResult | null> {
    const { data: customer, error: customerError } = await this.supabase.client
      .from('customers')
      .select('*')
      .eq('telefono', telefono)
      .maybeSingle();

    if (customerError) {
      console.error('Error buscando cliente:', customerError);
      throw customerError;
    }

    if (!customer) {
      return null;
    }

    const { data: vehicles, error: vehiclesError } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .eq('customer_id', customer.id);

    if (vehiclesError) {
      console.error('Error obteniendo vehículos:', vehiclesError);
    }

    const { count: ordersCount, error: ordersError } = await this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    const { data: lastOrder } = await this.supabase.client
      .from('orders')
      .select('created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      customer,
      vehicles: vehicles || [],
      ordersCount: ordersCount || 0,
      lastOrderDate: lastOrder?.created_at ? new Date(lastOrder.created_at) : undefined
    };
  }

  async searchCustomerByName(nombre: string): Promise<Customer[]> {
    const { data, error } = await this.supabase.client
      .from('customers')
      .select('*')
      .ilike('nombre_completo', `%${nombre}%`)
      .limit(10);

    if (error) {
      console.error('Error buscando clientes por nombre:', error);
      throw error;
    }

    return data || [];
  }

  async searchCustomers(searchTerm: string): Promise<CustomerSearchResult[]> {
    const { data: customers, error } = await this.supabase.client
      .from('customers')
      .select('*')
      .or(`nombre_completo.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido_paterno.ilike.%${searchTerm}%,apellido_materno.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,rfc.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) {
      console.error('Error buscando clientes:', error);
      throw error;
    }

    if (!customers || customers.length === 0) {
      return [];
    }

    const results: CustomerSearchResult[] = [];

    for (const customer of customers) {
      const { data: vehicles } = await this.supabase.client
        .from('vehicles')
        .select('*')
        .eq('customer_id', customer.id);

      const { count: ordersCount } = await this.supabase.client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id);

      const { data: lastOrder } = await this.supabase.client
        .from('orders')
        .select('created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      results.push({
        customer,
        vehicles: vehicles || [],
        ordersCount: ordersCount || 0,
        lastOrderDate: lastOrder?.created_at ? new Date(lastOrder.created_at) : undefined
      });
    }

    return results;
  }

  async createCustomer(customer: Customer): Promise<Customer> {
    const { data, error } = await this.supabase.client
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }

    return data;
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data, error } = await this.supabase.client
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }

    return data;
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .insert([vehicle])
      .select()
      .single();

    if (error) {
      console.error('Error creando vehículo:', error);
      throw error;
    }

    return data;
  }

  async updateVehicle(vehicleId: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .update(vehicle)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando vehículo:', error);
      throw error;
    }

    return data;
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }

    return data || [];
  }

  async createOrder(order: any): Promise<any> {
    console.log('Datos del pedido a insertar:', order);

    const { data, error } = await this.supabase.client
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (error) {
      console.error('Error creando pedido:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Pedido creado exitosamente:', data);
    return data;
  }

  async getAllOrders(): Promise<Order[]> {
    const user = this.auth.getCurrentUser();

    // Construir query base
    let query = this.supabase.client
      .from('orders')
      .select(`
        *,
        customer:customers(nombre_completo, telefono),
        vehicle:vehicles(placas, marca, modelo, anio),
        diagnostic_authorizations:diagnostic_items_authorization(*)
      `);

    // Filtrar por centro automotriz según el rol
    // Super Admin y Admin Corporativo pueden ver todas las órdenes
    // Gerente, Técnico y Asesor Técnico solo ven órdenes de su centro automotriz
    if (user && user.autocenter) {
      const allowedRoles = ['super_admin', 'admin_corporativo'];
      if (!allowedRoles.includes(user.role)) {
        // Filtrar por centro automotriz del usuario
        query = query.eq('tienda', user.autocenter);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo todos los pedidos:', error);
      throw error;
    }

    return data || [];
  }

  async checkFolioUnique(folio: string): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('folio')
      .eq('folio', folio)
      .maybeSingle();

    if (error) {
      console.error('Error verificando folio:', error);
      return false;
    }

    return data === null;
  }

  async saveAuthorizationItems(orderId: string, items: any[]): Promise<void> {
    // SOLO guardar items de diagnóstico (type='diagnostic')
    // Los productos y servicios ya se guardan directamente con isAuthorized/isRejected
    const diagnosticItems = items.filter(item => item.type === 'diagnostic');

    if (diagnosticItems.length === 0) {
      console.log('No hay items de diagnóstico para guardar en diagnostic_items_authorization');
      return;
    }

    const authItems = diagnosticItems.map(item => {
      // Determinar el valor de is_authorized:
      // - true si isAuthorized === true
      // - false si isRejected === true (explícitamente rechazado)
      // - null si ninguno (pendiente)
      let isAuthorizedValue: boolean | null = null;
      if (item.isAuthorized) {
        isAuthorizedValue = true;
      } else if (item.isRejected) {
        isAuthorizedValue = false;
      }

      return {
        order_id: orderId,
        diagnostic_item_id: item.id,
        item_name: item.item,
        category: item.category,
        description: item.description,
        severity: item.severity,
        estimated_cost: item.estimatedCost || 0,
        is_authorized: isAuthorizedValue,
        authorization_date: item.authorizationDate || new Date(),
        rejection_reason: item.rejectionReason || null,
        notes: item.notes || null
      };
    });

    const { error } = await this.supabase.client
      .from('diagnostic_items_authorization')
      .insert(authItems);

    if (error) {
      console.error('Error guardando autorizaciones:', error);
      throw error;
    }

    const totalAuthorized = items
      .filter(item => item.isAuthorized)
      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

    const totalRejected = items
      .filter(item => !item.isAuthorized && item.authorizationDate)
      .reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

    await this.supabase.client
      .from('orders')
      .update({
        authorization_status: 'completed',
        authorization_completed_at: new Date().toISOString(),
        total_authorized_amount: totalAuthorized,
        total_rejected_amount: totalRejected,
        estado: 'Autorizado'  // Cambiar el estado a Autorizado para que el PDF muestre badges correctos
      })
      .eq('id', orderId);
  }

  async getAuthorizationsByOrderId(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('diagnostic_items_authorization')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      console.error('Error obteniendo autorizaciones:', error);
      throw error;
    }

    return data || [];
  }

  async saveInvoice(orderId: string, invoice: any): Promise<void> {
    const invoiceData = {
      order_id: orderId,
      invoice_folio: invoice.invoice_folio,
      xml_content: invoice.xml_content || null,
      xml_data: invoice.xml_data || {},
      total_amount: invoice.total_amount,
      items: invoice.items || []
    };

    const { error } = await this.supabase.client
      .from('order_invoices')
      .insert([invoiceData]);

    if (error) {
      console.error('Error guardando factura:', error);
      throw error;
    }
  }

  async getOrderAuthorizations(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('diagnostic_items_authorization')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo autorizaciones:', error);
      throw error;
    }

    return data || [];
  }

  async getOrderInvoices(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('order_invoices')
      .select('*')
      .eq('order_id', orderId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error obteniendo facturas:', error);
      throw error;
    }

    return data || [];
  }

  async getLostSalesReport(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('lost_sales_report')
      .select('*');

    if (error) {
      console.error('Error obteniendo reporte de ventas perdidas:', error);
      throw error;
    }

    return data || [];
  }

  async getCustomer(customerId: string): Promise<Customer> {
    const { data, error } = await this.supabase.client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      console.error('Error obteniendo cliente:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Cliente no encontrado');
    }

    return data;
  }

  async getVehicle(vehicleId: string): Promise<Vehicle> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle();

    if (error) {
      console.error('Error obteniendo vehículo:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Vehículo no encontrado');
    }

    return data;
  }

  async getCustomerVehicles(customerId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo vehículos del cliente:', error);
      throw error;
    }

    return data || [];
  }

  async getServiceHistory(customerId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('service_history')
      .select(`
        *,
        vehicle:vehicles(placas, marca, modelo, anio),
        order:orders(folio)
      `)
      .eq('customer_id', customerId)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('Error obteniendo historial de servicios:', error);
      throw error;
    }

    return data || [];
  }

  async updateOrderAfterAuthorization(
    orderId: string,
    newProductos: any[],
    totalAutorizado: number,
    totalRechazado: number
  ): Promise<void> {
    const { data: currentOrder, error: fetchError } = await this.supabase.client
      .from('orders')
      .select('productos, presupuesto')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error obteniendo pedido:', fetchError);
      throw fetchError;
    }

    const existingProductos = currentOrder?.productos || [];
    const allProductos = [...existingProductos, ...newProductos];
    const currentPresupuesto = currentOrder?.presupuesto || 0;
    const newPresupuesto = Number(currentPresupuesto) + Number(totalAutorizado);

    const { error: updateError } = await this.supabase.client
      .from('orders')
      .update({
        productos: allProductos,
        presupuesto: newPresupuesto,
        status: 'Autorizado',
        authorization_status: 'completed',
        authorization_completed_at: new Date().toISOString(),
        total_authorized_amount: totalAutorizado,
        total_rejected_amount: totalRechazado
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error actualizando pedido:', updateError);
      throw updateError;
    }
  }

  async updateOrder(order: Order): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({
        productos: order.productos,
        servicios: order.servicios,
        diagnostic: order.diagnostic,
        technician_name: order.technician_name,
        presupuesto: order.presupuesto,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (error) {
      console.error('Error actualizando pedido:', error);
      throw error;
    }
  }

  async saveLostSales(order: any, rejectedItems: any[]): Promise<void> {
    console.log('saveLostSales - Order:', order);
    console.log('saveLostSales - RejectedItems:', rejectedItems);

    const lostSalesRecords = rejectedItems.map(item => {
      // Determinar severity basado en el tipo de item
      // Valores permitidos: 'urgent', 'recommended', 'good'
      let severity = 'good'; // Valor por defecto

      if (item.type === 'diagnostic' && item.severity) {
        // Items de diagnóstico ya tienen severity en el formato correcto
        severity = item.severity;
      } else if (item.type === 'product') {
        // Refacciones rechazadas son recomendadas
        severity = 'recommended';
      } else if (item.type === 'service') {
        // Mano de obra rechazada depende del costo
        const cost = item.estimatedCost || 0;
        if (cost > 1000) {
          severity = 'urgent';
        } else if (cost > 500) {
          severity = 'recommended';
        } else {
          severity = 'good';
        }
      }

      const record = {
        order_id: order.id,
        order_folio: order.folio,
        customer_id: order.customer_id,
        vehicle_id: order.vehicle_id,
        item_name: item.item || item.name || 'Servicio no especificado',
        category: item.category || 'general',
        service_category: item.category,
        service_name: item.item || item.name,
        service_description: item.description,
        estimated_cost: item.estimatedCost || 0,
        rejection_reason: item.rejectionReason || 'sin comentarios',
        rejection_date: new Date().toISOString(),
        severity: severity,
        technician_name: order.technician_name || order.diagnostic?.technicianName || 'No especificado'
      };
      console.log('Lost sales record:', record);
      return record;
    });

    console.log('Insertando registros en lost_sales:', lostSalesRecords);

    const { data, error } = await this.supabase.client
      .from('lost_sales')
      .insert(lostSalesRecords)
      .select();

    if (error) {
      console.error('Error guardando ventas perdidas:', error);
      console.error('Error details:', JSON.stringify(error));
      throw error;
    }

    console.log('Lost sales guardadas exitosamente:', data);
  }
}
