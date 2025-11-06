import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleDiagnosticComponent } from './vehicle-diagnostic.component';
import { DiagnosticDisplayComponent } from './diagnostic-display.component';
import { CustomerSearchComponent } from './customer-search.component';
import { AuthorizationRequestComponent } from './authorization-request.component';
import { InvoiceUploadComponent } from './invoice-upload.component';
import { XmlUploadComponent } from './xml-upload.component';
import { ProductClassificationComponent } from './product-classification.component';
import { LostSalesReportComponent } from './lost-sales-report.component';
import { BudgetPreviewComponent } from './budget-preview.component';
import { Order, Product, Service, VehicleDiagnostic, OrderInvoice, XmlProduct, ProductosPorProveedor, DiagnosticItemAuthorization } from '../models/order.model';
import { Customer, Vehicle } from '../models/customer.model';
import { DiagnosticSeverity } from '../models/diagnostic.model';
import { CustomerService } from '../services/customer.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';
import { XmlProductsService } from '../services/xml-products.service';
import { SupabaseService } from '../services/supabase.service';
import {
  SERVICE_CATEGORIES,
  ServiceDefinition,
  getServicesByCategory,
  getServiceBySku
} from '../models/service.model';
import { DIAGNOSTIC_CATEGORIES } from '../models/diagnostic.model';
import { AuthService, User } from '../services/auth.service';
import { OrderPermissionsService } from '../services/order-permissions.service';
import { PreOcValidationComponent } from './pre-oc-validation.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, VehicleDiagnosticComponent, DiagnosticDisplayComponent, CustomerSearchComponent, AuthorizationRequestComponent, InvoiceUploadComponent, XmlUploadComponent, ProductClassificationComponent, LostSalesReportComponent, BudgetPreviewComponent, PreOcValidationComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  parseInt = parseInt;

  activeView: 'dashboard' | 'new-order' | 'customer-search' | 'authorization' | 'invoice-upload' | 'lost-sales-report' | 'admin-validation' | 'pre-oc-validation' | 'not-found-products' = 'dashboard';
  pendingValidationOrders: Order[] = [];
  pendingValidationCount: number = 0;
  pendingPreOCOrders: Order[] = [];
  pendingPreOCCount: number = 0;
  notFoundProducts: XmlProduct[] = [];
  notFoundProductsCount: number = 0;
  showOrderDetail = false;
  showServicesSection = false;
  showAuthorizationModal = false;
  showInvoiceUploadModal = false;
  showXmlUploadModal = false;
  showProductClassificationModal = false;
  showBudgetPreview = false;
  showDiagnosticModal = false;
  showPreOCValidationModal = false;
  showPaymentModal = false;
  paymentAmount: number = 0;
  selectedOrder: Order | null = null;
  selectedOrderCustomer: Customer | null = null;
  selectedOrderVehicle: Vehicle | null = null;
  isEditingDiagnostic = false;
  editingDiagnosticData: VehicleDiagnostic | null = null;
  detailActiveTab: 'info' | 'products' | 'services' | 'summary' | 'diagnostic' | 'xml-products' | 'billing' = 'info';
  isEditingProducts = false;
  isEditingServices = false;
  isEditingProductsMarginOnly = false; // Nuevo: solo permite editar margen
  editingProducts: Product[] = [];
  editingServices: Service[] = [];
  newProductEdit: Product = { descripcion: '', cantidad: 1, costo: 0, precio: 0, margen: 0, porcentaje: 0 };
  selectedPaymentTypeEdit: string = '';
  newServiceEdit: Service = { sku: '', nombre: '', categoria: '', descripcion: '', precio: 0 };
  selectedServiceSKUEdit: string = '';
  availableServicesEdit: ServiceDefinition[] = [];

  searchQuery: string = '';
  filterStatus: string = '';
  sortBy: string = 'fecha-desc';
  filteredOrders: Order[] = [];

  selectedCustomer: Customer | null = null;
  selectedVehicle: Vehicle | null = null;
  customerVehicles: Vehicle[] = [];
  customerSelected = false;
  showVehicleSelector = false;
  showNewVehicleForm = false;
  isEditingVehicle = false;
  editingVehicleData: any = {};
  newVehicle: any = {
    placas: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    numero_serie: '',
    kilometraje_inicial: null
  };

  stats = [
    {
      title: 'Pedidos Pendientes',
      value: '12',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'En Proceso',
      value: '8',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Completados',
      value: '45',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Total del Mes',
      value: '$45,230',
      icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  orders: Order[] = [];

  tiendas = [
    'Insurgentes Taller Mecanico',
    'Universidad Taller Mecanico',
    'Satelite Taller Mecanico',
    'Lindavista Taller Mecanico',
    'Monterrey Anahuac Taller Mecanico',
    'Monterrey Centro Taller Mecanico',
    'Guadalajara Centro Taller Mecanico',
    'Puebla Centro Taller Mecanico',
    'Cuernavaca Taller Mecanico',
    'Gomez Palacio Taller Mecanico',
    'Leon Plaza Taller Mecanico',
    'Pachuca Outlet Taller Mecanico',
    'Celaya Taller Mecanico',
    'Queretaro Plaza Taller Mecanico',
    'Neza (CD Jardin) Taller Mecanico',
    'Cuautitlan Izcalli Taller Mecanico'
  ];
  divisiones = ['REFACCIONES PARA AUTO', 'SERVICIOS AUTOMOTRICES INTERNOS'];

  serviceCategories: string[] = SERVICE_CATEGORIES;
  availableServices: ServiceDefinition[] = [];
  orderSelectedCategory = '';
  selectedServiceData: ServiceDefinition | null = null;
  selectedPaymentType: string = '';

  newOrder: Order = {
    folio: '',
    cliente: '',
    tienda: '',
    division: '',
    productos: [],
    servicios: [],
    presupuesto: 0,
    fecha: new Date(),
    status: 'Pendiente de Autorización',
    diagnostic: {
      vehicleInfo: {
        plate: '',
        brand: '',
        model: '',
        year: '',
        mileage: '',
      },
      items: [],
      technicianName: '',
    }
  };

  newProduct = {
    descripcion: '',
    costo: 0,
    cantidad: 1
  };

  editingProductIndex: number | null = null;
  isEditingProduct = false;

  xmlProducts: XmlProduct[] = [];
  productosPorProveedor: ProductosPorProveedor[] = [];
  productsToClassify: XmlProduct[] = [];
  currentProductIndex: number = 0;
  currentProductToClassify: XmlProduct | null = null;
  uploadedInvoices: OrderInvoice[] = [];

  constructor(
    private customerService: CustomerService,
    private pdfGenerator: PdfGeneratorService,
    public auth: AuthService,
    private authService: AuthService,
    private xmlProductsService: XmlProductsService,
    private router: Router,
    private supabaseService: SupabaseService,
    public permissionsService: OrderPermissionsService,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  async ngOnInit() {
    await this.loadOrders();
    this.filterOrders();
    if (this.auth.isSuperAdmin()) {
      await this.loadPendingValidationOrders();
      await this.loadPendingPreOCOrders();
      await this.loadNotFoundProducts();
      await this.loadAdminStats();
    } else if (this.auth.isAdminCorporativo() || this.auth.isGerente()) {
      await this.loadPendingValidationOrders();
      await this.loadPendingPreOCOrders();
      await this.loadNotFoundProducts();
    }
  }

  adminStats = {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeUsers: 0,
    totalCustomers: 0
  };

  async loadAdminStats() {
    try {
      const { data: users } = await this.supabaseService.client
        .from('users')
        .select('*', { count: 'exact' });

      const { data: customers } = await this.supabaseService.client
        .from('customers')
        .select('*', { count: 'exact' });

      const totalRevenue = this.orders.reduce((sum, order) => sum + (order.presupuesto || 0), 0);
      const pendingOrders = this.orders.filter(o => o.status === 'Pendiente de Autorización').length;

      this.adminStats = {
        totalUsers: users?.length || 0,
        totalOrders: this.orders.length,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders,
        activeUsers: users?.filter((u: any) => u.is_active).length || 0,
        totalCustomers: customers?.length || 0
      };
    } catch (error) {
      console.error('Error cargando estadísticas admin:', error);
    }
  }

  async loadOrders() {
    try {
      const dbOrders = await this.customerService.getAllOrders();
      this.orders = dbOrders.map((order: any) => ({
        ...order,
        cliente: order.customer?.nombre_completo || 'Cliente desconocido',
        fecha: new Date(order.created_at),
        vehiculo: order.vehicle ? {
          placas: order.vehicle.placas,
          marca: order.vehicle.marca,
          modelo: order.vehicle.modelo,
          anio: order.vehicle.anio,
          color: order.vehicle.color,
          numero_serie: order.vehicle.numero_serie
        } : undefined
      }));
      this.filterOrders();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  setActiveView(view: 'dashboard' | 'new-order' | 'customer-search' | 'admin-validation' | 'pre-oc-validation' | 'not-found-products') {
    this.activeView = view;
  }

  startNewOrder() {
    this.customerSelected = false;
    this.selectedCustomer = null;
    this.selectedVehicle = null;
    this.activeView = 'customer-search';
  }

  async onCustomerSelected(data: { customer: Customer; vehicle?: Vehicle }) {
    this.selectedCustomer = data.customer;
    this.selectedVehicle = data.vehicle || null;
    this.customerSelected = true;
    console.log('Cliente y vehículo seleccionados:', this.selectedCustomer, this.selectedVehicle);

    if (this.selectedCustomer?.id) {
      const vehicles = await this.customerService.getCustomerVehicles(this.selectedCustomer.id);
      this.customerVehicles = vehicles || [];
    }

    if (this.user?.autocenter) {
      this.newOrder.tienda = this.user.autocenter;
    }

    if (this.selectedVehicle) {
      this.newOrder.diagnostic!.vehicleInfo = {
        plate: this.selectedVehicle.placas,
        brand: this.selectedVehicle.marca,
        model: this.selectedVehicle.modelo,
        year: this.selectedVehicle.anio,
        mileage: this.selectedVehicle.kilometraje_inicial?.toString() || ''
      };
    }

    this.activeView = 'new-order';
  }

  async logout() {
    await this.authService.logout();
  }

  goToAdminPanel() {
    this.router.navigate(['/admin']);
  }

  goToUserManagement() {
    this.router.navigate(['/users']);
  }

  goToAnalytics() {
    this.router.navigate(['/analytics']);
  }

  goToAudit() {
    this.router.navigate(['/audit']);
  }

  getRoleLabel(): string {
    if (this.auth.isSuperAdmin()) return 'Super Admin';
    if (this.auth.isAdminCorporativo()) return 'Admin Corporativo';
    if (this.auth.isGerente()) return 'Gerente';
    if (this.auth.isTecnico()) return 'Técnico';
    if (this.auth.isAsesorTecnico()) return 'Asesor Técnico';
    return 'Usuario';
  }

  canDeleteOrders(): boolean {
    return this.auth.canManageUsers();
  }

  canAuthorizeOrders(): boolean {
    return this.auth.canManageUsers();
  }

  isAdmin(): boolean {
    return this.auth.isSuperAdmin() || this.auth.isAdminCorporativo();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Pendiente de Autorización': 'bg-yellow-100 text-yellow-800',
      'Autorizado': 'bg-blue-100 text-blue-800',
      'En Proceso': 'bg-purple-100 text-purple-800',
      'Completado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  async viewOrderDetail(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetail = true;

    // Inicializar el tipo de pago si existe
    if (order.productos && order.productos.length > 0 && order.productos[0].porcentaje) {
      this.selectedPaymentTypeEdit = order.productos[0].porcentaje.toString();
    }

    if (order.customer_id) {
      try {
        const customer = await this.customerService.getCustomer(order.customer_id);
        this.selectedOrderCustomer = customer;
      } catch (error) {
        console.error('Error cargando datos del cliente:', error);
      }
    }

    if (order.vehicle_id) {
      try {
        const vehicle = await this.customerService.getVehicle(order.vehicle_id);
        this.selectedOrderVehicle = vehicle;
      } catch (error) {
        console.error('Error cargando datos del vehículo:', error);
      }
    }

    await this.loadOrderXmlProducts(order);
  }

  closeOrderDetail() {
    this.showOrderDetail = false;
    this.selectedOrder = null;
    this.selectedOrderCustomer = null;
    this.selectedOrderVehicle = null;
    this.detailActiveTab = 'info';
    this.isEditingProducts = false;
    this.isEditingServices = false;
    this.isEditingDiagnostic = false;
  }

  startEditingProducts() {
    if (!this.selectedOrder) return;
    this.editingProducts = JSON.parse(JSON.stringify(this.selectedOrder.productos || []));

    if (this.editingProducts.length > 0 && this.editingProducts[0].porcentaje) {
      this.selectedPaymentTypeEdit = this.editingProducts[0].porcentaje.toString();
    } else {
      this.selectedPaymentTypeEdit = '';
    }

    this.isEditingProducts = true;
    this.isEditingProductsMarginOnly = false;
  }

  startEditingProductsMarginOnly() {
    if (!this.selectedOrder) return;
    this.editingProducts = JSON.parse(JSON.stringify(this.selectedOrder.productos || []));

    if (this.editingProducts.length > 0 && this.editingProducts[0].porcentaje) {
      this.selectedPaymentTypeEdit = this.editingProducts[0].porcentaje.toString();
    } else {
      this.selectedPaymentTypeEdit = '';
    }

    this.isEditingProducts = true;
    this.isEditingProductsMarginOnly = true;
  }

  cancelEditingProducts() {
    this.isEditingProducts = false;
    this.isEditingProductsMarginOnly = false;
    this.editingProducts = [];
    this.selectedPaymentTypeEdit = '';
  }

  async saveEditedProducts() {
    if (!this.selectedOrder) return;
    this.selectedOrder.productos = JSON.parse(JSON.stringify(this.editingProducts));
    await this.updateOrderInDatabase(this.selectedOrder);
    this.isEditingProducts = false;
    this.isEditingProductsMarginOnly = false;
  }

  onPaymentTypeChangeEdit() {
    if (!this.selectedPaymentTypeEdit) return;

    const margenPorcentaje = parseInt(this.selectedPaymentTypeEdit);
    let divisor = 1;

    switch(margenPorcentaje) {
      case 39:
        divisor = 0.61;
        break;
      case 50:
        divisor = 0.50;
        break;
      case 48:
        divisor = 0.52;
        break;
      case 28:
        divisor = 0.72;
        break;
      case 17:
        divisor = 0.83;
        break;
    }

    this.editingProducts = this.editingProducts.map(producto => {
      const costo = producto.costo || 0;
      const costoConIva = costo * 1.16;
      const precioVentaPublico = costoConIva / divisor;
      const margen = precioVentaPublico - costoConIva;

      return {
        ...producto,
        precio: precioVentaPublico,
        margen: margen,
        porcentaje: margenPorcentaje
      };
    });
  }

  addProductToEdit() {
    const missingFields: string[] = [];

    if (!this.newProductEdit.descripcion) missingFields.push('Descripción del producto');
    if ((this.newProductEdit.costo || 0) <= 0) missingFields.push('Costo del producto');
    if (!this.selectedPaymentTypeEdit) missingFields.push('Tipo de pago');

    if (missingFields.length > 0) {
      alert(`Faltan los siguientes campos:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    const costo = this.newProductEdit.costo || 0;
    const cantidad = this.newProductEdit.cantidad;
    const costoConIva = costo * 1.16;
    const margenPorcentaje = parseInt(this.selectedPaymentTypeEdit);
    let divisor = 1;

    switch(margenPorcentaje) {
      case 39:
        divisor = 0.61;
        break;
      case 50:
        divisor = 0.50;
        break;
      case 48:
        divisor = 0.52;
        break;
      case 28:
        divisor = 0.72;
        break;
      case 17:
        divisor = 0.83;
        break;
    }

    const precioVentaPublico = costoConIva / divisor;
    const margen = precioVentaPublico - costoConIva;
    const porcentaje = margenPorcentaje;

    this.editingProducts.push({
      descripcion: this.newProductEdit.descripcion,
      costo: costo,
      precio: precioVentaPublico,
      margen: margen,
      porcentaje: porcentaje,
      cantidad: cantidad
    });

    this.newProductEdit = { descripcion: '', cantidad: 1, costo: 0, precio: 0, margen: 0, porcentaje: 0 };
  }

  removeProductFromEdit(index: number) {
    this.editingProducts.splice(index, 1);
  }

  recalculateProduct(producto: Product) {
    if (!this.selectedPaymentTypeEdit) return;

    const costo = producto.costo || 0;
    const costoConIva = costo * 1.16;
    const margenPorcentaje = parseInt(this.selectedPaymentTypeEdit);
    let divisor = 1;

    switch(margenPorcentaje) {
      case 39:
        divisor = 0.61;
        break;
      case 50:
        divisor = 0.50;
        break;
      case 48:
        divisor = 0.52;
        break;
      case 28:
        divisor = 0.72;
        break;
      case 17:
        divisor = 0.83;
        break;
    }

    const precioVentaPublico = costoConIva / divisor;
    const margen = precioVentaPublico - costoConIva;

    producto.precio = precioVentaPublico;
    producto.margen = margen;
    producto.porcentaje = margenPorcentaje;
  }

  getTotalEditingProducts(): number {
    return this.editingProducts.reduce((total, producto) => {
      return total + ((producto.precio || 0) * (producto.cantidad || 0));
    }, 0);
  }

  getPaymentTypeLabel(porcentaje: number | undefined): string {
    if (!porcentaje) return 'Sin definir';

    switch(porcentaje) {
      case 39:
        return '39% - Pago en 1 sola exhibición';
      case 50:
        return '50% - Pago arriba de 12 meses';
      case 48:
        return '48% - Pago entre 6 y 9 meses';
      case 28:
        return '28% - Contado';
      case 17:
        return '17% - Autos flotilla';
      default:
        return `${porcentaje}% - Personalizado`;
    }
  }

  startEditingServices() {
    if (!this.selectedOrder) return;
    this.editingServices = JSON.parse(JSON.stringify(this.selectedOrder.servicios || []));
    this.isEditingServices = true;
    this.newServiceEdit = { sku: '', nombre: '', categoria: '', descripcion: '', precio: 0 };
    this.selectedServiceSKUEdit = '';
    this.availableServicesEdit = [];
  }

  cancelEditingServices() {
    this.isEditingServices = false;
    this.editingServices = [];
    this.newServiceEdit = { sku: '', nombre: '', categoria: '', descripcion: '', precio: 0 };
    this.selectedServiceSKUEdit = '';
    this.availableServicesEdit = [];
  }

  async saveEditedServices() {
    if (!this.selectedOrder) return;
    this.selectedOrder.servicios = JSON.parse(JSON.stringify(this.editingServices));
    await this.updateOrderInDatabase(this.selectedOrder);
    this.isEditingServices = false;
    this.newServiceEdit = { sku: '', nombre: '', categoria: '', descripcion: '', precio: 0 };
    this.selectedServiceSKUEdit = '';
    this.availableServicesEdit = [];
  }

  removeServiceFromEdit(index: number) {
    this.editingServices.splice(index, 1);
  }

  onServiceCategoryChangeEdit() {
    this.selectedServiceSKUEdit = '';
    if (this.newServiceEdit.categoria) {
      this.availableServicesEdit = getServicesByCategory(this.newServiceEdit.categoria);
    } else {
      this.availableServicesEdit = [];
    }
  }

  onServiceSelectedEdit() {
    if (this.selectedServiceSKUEdit) {
      const serviceDefinition = getServiceBySku(this.selectedServiceSKUEdit);
      if (serviceDefinition) {
        this.newServiceEdit = {
          sku: serviceDefinition.sku,
          nombre: serviceDefinition.nombre,
          categoria: serviceDefinition.categoria,
          descripcion: serviceDefinition.descripcion,
          precio: serviceDefinition.precioConIva
        };
      }
    }
  }

  addServiceToEdit() {
    if (this.selectedServiceSKUEdit && this.newServiceEdit.nombre) {
      this.editingServices.push({...this.newServiceEdit});
      this.newServiceEdit = { sku: '', nombre: '', categoria: '', descripcion: '', precio: 0 };
      this.selectedServiceSKUEdit = '';
      this.availableServicesEdit = [];
    }
  }

  async updateOrderInDatabase(order: Order) {
    try {
      await this.customerService.updateOrder(order);
      const index = this.orders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        this.orders[index] = {...order};
      }
      this.filterOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido');
    }
  }

  canRequestAuthorization(order: Order | null): boolean {
    if (!order) return false;

    const hasProducts = order.productos && order.productos.length > 0;
    const hasServices = order.servicios && order.servicios.length > 0;
    const hasDiagnostic = !!order.diagnostic?.items && order.diagnostic.items.length > 0;

    const hasContent = hasProducts || hasServices || hasDiagnostic;

    const isAlreadyAuthorized = order.status === 'Autorizado' ||
                                 order.status === 'XML Cargado' ||
                                 order.status === 'Productos Clasificados' ||
                                 order.status === 'Pendiente de Validación de Productos' ||
                                 order.status === 'Cargando Facturas XML' ||
                                 order.status === 'Validando Productos' ||
                                 order.status === 'Productos Validados' ||
                                 order.status === 'Pendiente Validación Admin' ||
                                 order.status === 'Aprobado por Admin' ||
                                 order.status === 'Procesando Productos' ||
                                 order.status === 'Productos Procesados' ||
                                 order.status === 'Pre-OC Validado' ||
                                 order.status === 'Pendiente de Orden de Compra' ||
                                 order.status === 'Completado' ||
                                 order.status === 'Entregado';

    return hasContent && !isAlreadyAuthorized;
  }

  getCustomerData(order: Order): Customer | null {
    return this.selectedOrderCustomer;
  }

  getVehicleData(order: Order): Vehicle | null {
    return this.selectedOrderVehicle;
  }

  shouldShowBillingSection(order: Order | null): boolean {
    if (!order) return false;

    const billingStatuses = [
      'Productos Procesados',
      'Pre-OC Validado',
      'Pendiente de Orden de Compra',
      'Completado',
      'Entregado'
    ];

    return billingStatuses.includes(order.status);
  }

  getAuthorizedServicesForBilling(order: Order): Service[] {
    if (!order.servicios) return [];
    return order.servicios.filter(service => service.isAuthorized);
  }

  calculateServicesForBilling(order: Order): number {
    const authorizedServices = this.getAuthorizedServicesForBilling(order);
    return authorizedServices.reduce((total, service) => total + service.precio, 0);
  }

  calculateXmlProductsTotal(): number {
    return this.xmlProducts.reduce((total, product) => {
      return total + (product.precio * product.cantidad);
    }, 0);
  }

  calculateGrandTotal(): number {
    if (!this.selectedOrder) return 0;
    return this.calculateServicesForBilling(this.selectedOrder) + this.calculateXmlProductsTotal();
  }

  calculateEmployeeDiscount(): number {
    return this.calculateGrandTotal() * 0.10;
  }

  calculateFinalTotal(): number {
    const grandTotal = this.calculateGrandTotal();
    if (this.selectedOrder?.is_employee) {
      return grandTotal - this.calculateEmployeeDiscount();
    }
    return grandTotal;
  }

  onEmployeeCheckboxChange(): void {
    if (!this.selectedOrder?.is_employee) {
      this.selectedOrder!.employee_number = undefined;
    }
    this.saveEmployeeInfo();
  }

  async saveEmployeeInfo(): Promise<void> {
    if (!this.selectedOrder?.id) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          is_employee: this.selectedOrder.is_employee || false,
          employee_number: this.selectedOrder.employee_number || null,
          employee_discount_amount: this.selectedOrder.is_employee ? this.calculateEmployeeDiscount() : 0,
          final_total: this.calculateFinalTotal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', this.selectedOrder.id);

      if (error) throw error;

      await this.authService.logAction('update_employee_info', {
        order_id: this.selectedOrder.id,
        is_employee: this.selectedOrder.is_employee,
        employee_number: this.selectedOrder.employee_number
      });
    } catch (error) {
      console.error('Error guardando información de empleado:', error);
    }
  }

  addProduct() {
    const missingFields: string[] = [];

    if (!this.newProduct.descripcion) missingFields.push('Descripción del producto');
    if (this.newProduct.costo <= 0) missingFields.push('Costo del producto');
    if (this.newProduct.cantidad <= 0) missingFields.push('Cantidad');
    if (!this.selectedPaymentType) missingFields.push('Tipo de pago');

    if (missingFields.length > 0) {
      alert(`Faltan los siguientes campos:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    const costoConIva = this.newProduct.costo * 1.16;
    const margenPorcentaje = parseInt(this.selectedPaymentType);
    let divisor = 1;

    switch(margenPorcentaje) {
      case 39:
        divisor = 0.61;
        break;
      case 50:
        divisor = 0.50;
        break;
      case 48:
        divisor = 0.52;
        break;
      case 28:
        divisor = 0.72;
        break;
      case 17:
        divisor = 0.83;
        break;
    }

    const precioVentaPublico = costoConIva / divisor;
    const margen = precioVentaPublico - costoConIva;
    const porcentajeMargen = (margen / precioVentaPublico) * 100;

    const producto = {
      descripcion: this.newProduct.descripcion,
      costo: this.newProduct.costo,
      costoConIva: costoConIva,
      precioVentaPublico: precioVentaPublico,
      margen: margen,
      porcentajeMargen: porcentajeMargen,
      tipoMargen: margenPorcentaje,
      porcentaje: margenPorcentaje,
      cantidad: this.newProduct.cantidad,
      precio: precioVentaPublico
    };

    if (this.isEditingProduct && this.editingProductIndex !== null) {
      this.newOrder.productos[this.editingProductIndex] = producto;
      this.isEditingProduct = false;
      this.editingProductIndex = null;
    } else {
      this.newOrder.productos.push(producto);
    }

    this.newProduct = {
      descripcion: '',
      costo: 0,
      cantidad: 1
    };
  }

  editProduct(index: number) {
    const product = this.newOrder.productos[index];
    this.newProduct = {
      descripcion: product.descripcion,
      costo: product.costo || 0,
      cantidad: product.cantidad
    };
    this.editingProductIndex = index;
    this.isEditingProduct = true;
  }

  cancelEditProduct() {
    this.isEditingProduct = false;
    this.editingProductIndex = null;
    this.newProduct = {
      descripcion: '',
      costo: 0,
      cantidad: 1
    };
  }

  removeProduct(index: number) {
    this.newOrder.productos.splice(index, 1);
  }

  onPaymentTypeChange() {
    if (!this.selectedPaymentType || this.newOrder.productos.length === 0) {
      return;
    }

    const tipoMargen = parseInt(this.selectedPaymentType);
    let divisor = 1;

    switch(tipoMargen) {
      case 39:
        divisor = 0.61;
        break;
      case 50:
        divisor = 0.50;
        break;
      case 48:
        divisor = 0.52;
        break;
      case 28:
        divisor = 0.72;
        break;
      case 17:
        divisor = 0.83;
        break;
    }

    this.newOrder.productos = this.newOrder.productos.map(producto => {
      const costoConIva = (producto.costo || 0) * 1.16;
      const precioVentaPublico = costoConIva / divisor;
      const margen = precioVentaPublico - costoConIva;
      const porcentajeMargen = (margen / precioVentaPublico) * 100;

      return {
        ...producto,
        costoConIva: costoConIva,
        precioVentaPublico: precioVentaPublico,
        margen: margen,
        porcentajeMargen: porcentajeMargen,
        tipoMargen: tipoMargen,
        precio: precioVentaPublico
      };
    });
  }

  onServiceCategoryChange() {
    this.availableServices = getServicesByCategory(this.orderSelectedCategory);
    this.selectedServiceData = null;
  }

  onServiceSelectBySku(sku: string) {
    if (!sku) {
      this.selectedServiceData = null;
      return;
    }
    const service = getServiceBySku(sku);
    if (service) {
      this.selectedServiceData = service;
    }
  }

  addService() {
    if (!this.selectedServiceData) return;

    const newService: Service = {
      sku: this.selectedServiceData.sku,
      nombre: this.selectedServiceData.nombre,
      descripcion: this.selectedServiceData.descripcion,
      categoria: this.selectedServiceData.categoria,
      precio: this.selectedServiceData.precioConIva
    };

    if (!this.newOrder.servicios) {
      this.newOrder.servicios = [];
    }

    this.newOrder.servicios.push(newService);
    this.selectedServiceData = null;
    this.orderSelectedCategory = '';
    this.availableServices = [];
  }

  removeService(index: number) {
    if (this.newOrder.servicios) {
      this.newOrder.servicios.splice(index, 1);
    }
  }

  getProductsTotal(): number {
    return this.newOrder.productos.reduce((total, p) => {
      const precio = p.precioVentaPublico || p.precio || 0;
      return total + (precio * p.cantidad);
    }, 0);
  }

  getServicesTotal(): number {
    if (!this.newOrder.servicios) return 0;
    return this.newOrder.servicios.reduce((total, s) => total + s.precio, 0);
  }

  getOrderTotal(): number {
    return this.getProductsTotal() + this.getServicesTotal();
  }

  transferDiagnosticToOrder() {
    if (!this.newOrder.diagnostic) return;

    // Inicializar arrays si no existen
    if (!this.newOrder.servicios) {
      this.newOrder.servicios = [];
    }
    if (!this.newOrder.productos) {
      this.newOrder.productos = [];
    }

    // Transferir items de diagnóstico (servicios) a mano de obra
    if (this.newOrder.diagnostic.items && this.newOrder.diagnostic.items.length > 0) {
      this.newOrder.diagnostic.items.forEach(item => {
        // Solo agregar si el item tiene información de servicio
        if (item.serviceSku && item.serviceName) {
          const service: Service = {
            sku: item.serviceSku,
            nombre: item.serviceName,
            descripcion: item.description,
            categoria: item.category,
            precio: item.servicePrice || item.estimatedCost || 0,
            fromDiagnostic: true,
            diagnosticSeverity: item.severity
          };
          this.newOrder.servicios!.push(service);
        }
      });
    }

    // Transferir refacciones del diagnóstico a productos
    if (this.newOrder.diagnostic.parts && this.newOrder.diagnostic.parts.length > 0) {
      this.newOrder.diagnostic.parts.forEach(part => {
        const product: Product = {
          sku: part.sku,
          descripcion: part.descripcion,
          cantidad: part.cantidad,
          costo: part.costo,
          precio: part.precio,
          margen: part.margen,
          porcentaje: part.porcentaje,
          fromDiagnostic: true,
          diagnosticSeverity: part.severity
        };
        this.newOrder.productos.push(product);
      });
    }
  }

  transferDiagnosticToExistingOrder(order: Order) {
    if (!order.diagnostic) return;

    // Inicializar arrays si no existen
    if (!order.productos) {
      order.productos = [];
    }

    // Eliminar refacciones previas del diagnóstico para evitar duplicados
    order.productos = order.productos.filter(p => !p.fromDiagnostic);

    // SOLO transferir refacciones del diagnóstico a productos
    // Los servicios NO se transfieren automáticamente, se quedan en "Hallazgos y Recomendaciones"
    // hasta que el usuario los autorice manualmente
    if (order.diagnostic.parts && order.diagnostic.parts.length > 0) {
      order.diagnostic.parts.forEach(part => {
        const product: Product = {
          sku: part.sku,
          descripcion: part.descripcion,
          cantidad: part.cantidad,
          costo: part.costo,
          precio: part.precio,
          margen: part.margen,
          porcentaje: part.porcentaje,
          fromDiagnostic: true,
          diagnosticSeverity: part.severity
        };
        order.productos.push(product);
      });
    }

    // Recalcular presupuesto
    const totalProductos = order.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalServicios = order.servicios?.reduce((sum, s) => sum + s.precio, 0) || 0;
    order.presupuesto = totalProductos + totalServicios;
  }

  async onCreateOrder() {
    const missingFields: string[] = [];

    if (!this.selectedCustomer) missingFields.push('Cliente');
    if (!this.newOrder.tienda) missingFields.push('Tienda');
    if (this.newOrder.productos.length === 0 && (!this.newOrder.servicios || this.newOrder.servicios.length === 0)) {
      missingFields.push('Productos o Servicios');
    }

    if (missingFields.length > 0) {
      alert(`Por favor complete los siguientes campos requeridos:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    try {
      // Usar el folio ingresado por el usuario o generar uno automáticamente
      let folio: string;
      if (this.newOrder.folio && this.newOrder.folio.trim()) {
        // Verificar que el folio ingresado sea único
        const isUnique = await this.customerService.checkFolioUnique(this.newOrder.folio.trim());
        if (!isUnique) {
          alert(`El folio "${this.newOrder.folio}" ya existe. Por favor use un folio diferente o deje el campo vacío para generar uno automáticamente.`);
          return;
        }
        folio = this.newOrder.folio.trim();
      } else {
        // Generar folio automáticamente si no se proporcionó uno
        folio = await this.generateUniqueFolio();
      }

      let vehicleId = this.selectedVehicle?.id || null;

      if (!vehicleId && this.newOrder.diagnostic?.vehicleInfo?.plate && this.selectedCustomer?.id) {
        const newVehicle = await this.customerService.createVehicle({
          customer_id: this.selectedCustomer.id,
          placas: this.newOrder.diagnostic.vehicleInfo.plate,
          marca: this.newOrder.diagnostic.vehicleInfo.brand || '',
          modelo: this.newOrder.diagnostic.vehicleInfo.model || '',
          anio: this.newOrder.diagnostic.vehicleInfo.year || '',
          color: this.newOrder.diagnostic.vehicleInfo.color || '',
          kilometraje_inicial: parseInt(this.newOrder.diagnostic.vehicleInfo.mileage || '0')
        });
        vehicleId = newVehicle?.id || null;
        this.selectedVehicle = newVehicle;
      }

      // Transferir items del diagnóstico a servicios y refacciones
      this.transferDiagnosticToOrder();

      const orderData = {
        folio: folio,
        customer_id: this.selectedCustomer!.id,
        vehicle_id: vehicleId,
        tienda: this.newOrder.tienda,
        division: this.newOrder.division,
        productos: this.newOrder.productos,
        servicios: this.newOrder.servicios || [],
        diagnostic: this.newOrder.diagnostic,
        promotion: this.newOrder.promotion || null,
        presupuesto: this.getOrderTotal(),
        status: 'Pendiente de Autorización',
        technician_name: this.user?.full_name || 'Técnico'
      };

      await this.customerService.createOrder(orderData);

      await this.loadOrders();

      this.resetNewOrder();
      this.customerSelected = false;
      this.selectedCustomer = null;
      this.selectedVehicle = null;
      this.activeView = 'dashboard';

      await this.authService.logAction('create_order', { order_id: folio });

      alert('Pedido creado exitosamente!');
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('Error al crear el pedido. Por favor intente de nuevo.');
    }
  }

  cancelOrder() {
    this.resetNewOrder();
    this.activeView = 'dashboard';
  }

  private resetNewOrder() {
    this.newOrder = {
      folio: '',
      cliente: '',
      tienda: '',
      division: '',
      productos: [],
      servicios: [],
      presupuesto: 0,
      fecha: new Date(),
      status: 'Pendiente de Autorización',
      diagnostic: {
        vehicleInfo: {
          plate: '',
          brand: '',
          model: '',
          year: '',
          mileage: '',
        },
        items: [],
        technicianName: '',
      }
    };
    this.showServicesSection = false;
  }

  private async generateUniqueFolio(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let folio: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      folio = `PED-${year}${month}${day}-${timestamp}-${random}`;

      isUnique = await this.customerService.checkFolioUnique(folio);
      attempts++;
    }

    if (!isUnique) {
      const uuid = crypto.randomUUID().substring(0, 8);
      folio = `PED-${year}${month}${day}-${uuid}`;
    }

    return folio!;
  }

  onDiagnosticChange(diagnostic: VehicleDiagnostic) {
    this.newOrder.diagnostic = diagnostic;
    this.showDiagnosticModal = false;
    console.log('Diagnóstico actualizado:', diagnostic);
  }

  onVehicleSelected(vehicle: any) {
    this.selectedVehicle = vehicle;
    console.log('Vehículo seleccionado:', vehicle);
  }

  clearVehicleSelection() {
    this.selectedVehicle = null;
    this.showVehicleSelector = true;
    this.newOrder.diagnostic!.vehicleInfo = {
      plate: '',
      brand: '',
      model: '',
      year: '',
      mileage: ''
    };
    console.log('Vehículo deseleccionado');
  }

  selectVehicleFromList(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.showVehicleSelector = false;
    this.newOrder.diagnostic!.vehicleInfo = {
      plate: vehicle.placas,
      brand: vehicle.marca,
      model: vehicle.modelo,
      year: vehicle.anio,
      mileage: vehicle.kilometraje_inicial?.toString() || ''
    };
    console.log('Vehículo seleccionado:', vehicle);
  }

  async saveNewVehicle() {
    const missingFields: string[] = [];

    if (!this.selectedCustomer?.id) missingFields.push('Cliente');
    if (!this.newVehicle.placas) missingFields.push('Placas');
    if (!this.newVehicle.marca) missingFields.push('Marca');
    if (!this.newVehicle.modelo) missingFields.push('Modelo');
    if (!this.newVehicle.anio) missingFields.push('Año');

    if (missingFields.length > 0) {
      alert(`Por favor complete los siguientes campos obligatorios:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    try {
      const vehicleData = {
        customer_id: this.selectedCustomer!.id!,
        placas: this.newVehicle.placas,
        marca: this.newVehicle.marca,
        modelo: this.newVehicle.modelo,
        anio: this.newVehicle.anio,
        color: this.newVehicle.color || null,
        numero_serie: this.newVehicle.numero_serie || null,
        kilometraje_inicial: this.newVehicle.kilometraje_inicial || null
      };

      const savedVehicle = await this.customerService.createVehicle(vehicleData);

      if (savedVehicle) {
        this.customerVehicles.push(savedVehicle);
        this.selectVehicleFromList(savedVehicle);
        this.showNewVehicleForm = false;
        this.resetNewVehicleForm();
        alert('Vehículo registrado exitosamente');
      }
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      alert('Error al guardar el vehículo');
    }
  }

  cancelNewVehicle() {
    this.showNewVehicleForm = false;
    this.resetNewVehicleForm();
  }

  resetNewVehicleForm() {
    this.newVehicle = {
      placas: '',
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      numero_serie: '',
      kilometraje_inicial: null
    };
  }

  startEditingVehicle() {
    if (this.selectedVehicle) {
      this.editingVehicleData = { ...this.selectedVehicle };
      this.isEditingVehicle = true;
    }
  }

  async saveVehicleEdit() {
    if (!this.selectedVehicle?.id) return;

    try {
      const updatedVehicle = await this.customerService.updateVehicle(
        this.selectedVehicle.id,
        this.editingVehicleData
      );

      if (updatedVehicle) {
        this.selectedVehicle = updatedVehicle;
        this.isEditingVehicle = false;
        this.editingVehicleData = {};
        alert('Vehículo actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      alert('Error al actualizar el vehículo');
    }
  }

  cancelVehicleEdit() {
    this.isEditingVehicle = false;
    this.editingVehicleData = {};
  }

  openDiagnosticModal() {
    this.showDiagnosticModal = true;
  }

  closeDiagnosticModal() {
    this.showDiagnosticModal = false;
  }

  getItemCountBySeverity(severity: 'urgent' | 'recommended' | 'good'): number {
    return this.newOrder.diagnostic!.items.filter(item => item.severity === severity).length;
  }

  getCategoryName(categoryId: string): string {
    const category = DIAGNOSTIC_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  }

  filterOrders() {
    let filtered = [...this.orders];

    // Filtrar por búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.folio.toLowerCase().includes(query) ||
        order.cliente.toLowerCase().includes(query) ||
        order.vehiculo?.placas?.toLowerCase().includes(query) ||
        order.vehiculo?.marca?.toLowerCase().includes(query) ||
        order.vehiculo?.modelo?.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (this.filterStatus) {
      filtered = filtered.filter(order => order.status === this.filterStatus);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'fecha-desc':
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case 'fecha-asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'monto-desc':
          return b.presupuesto - a.presupuesto;
        case 'monto-asc':
          return a.presupuesto - b.presupuesto;
        default:
          return 0;
      }
    });

    this.filteredOrders = filtered;
  }

  async refreshOrders() {
    await this.loadOrders();
    this.filterOrders();
  }

  generateOrderPDF() {
    console.log('Generando PDF...');
    alert('Funcionalidad de generación de PDF en desarrollo');
  }

  authorizeOrder(order: Order) {
    console.log('Autorizando pedido:', order);
    alert('Pedido autorizado');
  }

  openFileUploader() {
    console.log('Abriendo cargador de archivos...');
  }

  getOrderProductsTotal(order: Order): number {
    return order.productos.reduce((total, p) => total + (p.precio * p.cantidad), 0);
  }

  getOrderServicesTotal(order: Order): number {
    if (!order.servicios) return 0;
    return order.servicios.reduce((total, s) => total + s.precio, 0);
  }

  async requestAuthorization(order: Order) {
    // Verificar que haya al menos algo para autorizar
    const hasProducts = order.productos && order.productos.length > 0;
    const hasServices = order.servicios && order.servicios.length > 0;
    const hasDiagnosticItems = order.diagnostic?.items && order.diagnostic.items.length > 0;

    if (!hasProducts && !hasServices && !hasDiagnosticItems) {
      alert('Este pedido no tiene productos, servicios o diagnóstico para autorizar');
      return;
    }

    // Inicializar diagnostic si no existe (para mantener estructura)
    if (!order.diagnostic) {
      order.diagnostic = {
        vehicleInfo: {
          plate: order.vehiculo?.placas,
          brand: order.vehiculo?.marca,
          model: order.vehiculo?.modelo,
          year: order.vehiculo?.anio,
          color: order.vehiculo?.color
        },
        items: []
      };
    }

    this.selectedOrder = order;
    this.showAuthorizationModal = true;
  }

  async onAuthorizationSubmitted(items: any[]) {
    if (!this.selectedOrder?.id) return;

    try {
      const authorizedItems = items.filter(item => item.isAuthorized);
      const rejectedItems = items.filter(item => item.isRejected);

      const totalAutorizado = authorizedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
      const totalRechazado = rejectedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

      console.log('Items rechazados:', rejectedItems);
      console.log('Orden seleccionada:', this.selectedOrder);

      // Guardar ventas perdidas
      if (rejectedItems.length > 0) {
        console.log('Guardando ventas perdidas...');
        await this.customerService.saveLostSales(this.selectedOrder, rejectedItems);
        console.log('Ventas perdidas guardadas exitosamente');
      }

      // Guardar autorizaciones
      await this.customerService.saveAuthorizationItems(this.selectedOrder.id, items);

      // Actualizar el diagnostic del pedido para marcar items como procesados
      if (this.selectedOrder.diagnostic && this.selectedOrder.diagnostic.items) {
        this.selectedOrder.diagnostic.items.forEach(diagnosticItem => {
          const processedItem = items.find(item =>
            item.type === 'diagnostic' && item.originalItem.id === diagnosticItem.id
          );
          if (processedItem) {
            diagnosticItem.isAuthorized = processedItem.isAuthorized;
            diagnosticItem.isRejected = processedItem.isRejected;
            diagnosticItem.rejectionReason = processedItem.rejectionReason;
            diagnosticItem.authorizationDate = new Date();
          }
        });

        // Actualizar el diagnostic en la base de datos
        const { error } = await this.customerService.client
          .from('orders')
          .update({
            diagnostic: this.selectedOrder.diagnostic
          })
          .eq('id', this.selectedOrder.id);

        if (error) {
          console.error('Error actualizando diagnostic:', error);
        }
      }

      // Marcar productos (refacciones) como autorizados o rechazados
      if (this.selectedOrder.productos) {
        items.forEach(item => {
          if (item.type === 'product') {
            const producto = this.selectedOrder!.productos.find(p => p === item.originalItem);
            if (producto) {
              if (item.isAuthorized) {
                producto.isAuthorized = true;
                producto.isRejected = false;
              } else if (item.isRejected) {
                producto.isAuthorized = false;
                producto.isRejected = true;
              }
            }
          }
        });

        // Actualizar productos en la base de datos
        const { error: productosError } = await this.customerService.client
          .from('orders')
          .update({
            productos: this.selectedOrder.productos
          })
          .eq('id', this.selectedOrder.id);

        if (productosError) {
          console.error('Error actualizando productos:', productosError);
        }
      }

      // Marcar servicios (mano de obra) como autorizados o rechazados
      if (this.selectedOrder.servicios) {
        items.forEach(item => {
          if (item.type === 'service') {
            const servicio = this.selectedOrder!.servicios!.find(s => s === item.originalItem);
            if (servicio) {
              if (item.isAuthorized) {
                servicio.isAuthorized = true;
                servicio.isRejected = false;
              } else if (item.isRejected) {
                servicio.isAuthorized = false;
                servicio.isRejected = true;
              }
            }
          }
        });

        // Actualizar servicios en la base de datos
        const { error: serviciosError } = await this.customerService.client
          .from('orders')
          .update({
            servicios: this.selectedOrder.servicios
          })
          .eq('id', this.selectedOrder.id);

        if (serviciosError) {
          console.error('Error actualizando servicios:', serviciosError);
        }
      }

      // Actualizar el estado del pedido a "Autorizado"
      const { error: statusError } = await this.customerService.client
        .from('orders')
        .update({
          status: 'Autorizado',
          estado: 'Autorizado'
        })
        .eq('id', this.selectedOrder.id);

      if (statusError) {
        console.error('Error actualizando estado del pedido:', statusError);
      }

      const message = `Autorización guardada exitosamente.\n\n` +
        `✓ ${authorizedItems.length} servicios autorizados (Total: $${totalAutorizado.toFixed(2)})\n` +
        `✗ ${rejectedItems.length} servicios NO autorizados (Total: $${totalRechazado.toFixed(2)})\n\n` +
        (rejectedItems.length > 0 ? 'Los servicios no autorizados se registraron como ventas perdidas para análisis estadístico.' : '');

      alert(message);

      this.showAuthorizationModal = false;
      this.selectedOrder = null;
      await this.loadOrders();
    } catch (error: any) {
      console.error('Error guardando autorización:', error);
      alert('Error al guardar la autorización: ' + (error?.message || 'Error desconocido'));
    }
  }

  cancelAuthorization() {
    this.showAuthorizationModal = false;
    this.showOrderDetail = false;
    this.selectedOrder = null;
    this.selectedOrderCustomer = null;
    this.selectedOrderVehicle = null;
  }

  openInvoiceUpload(order: Order) {
    this.selectedOrder = order;
    this.showInvoiceUploadModal = true;
  }

  async onInvoiceUploaded(invoice: any) {
    if (!this.selectedOrder?.id) return;

    try {
      await this.customerService.saveInvoice(this.selectedOrder.id, invoice);
      alert('Factura guardada exitosamente');
      this.showInvoiceUploadModal = false;
      this.selectedOrder = null;
      await this.loadOrders();
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar la factura');
    }
  }

  cancelInvoiceUpload() {
    this.showInvoiceUploadModal = false;
    this.selectedOrder = null;
  }

  viewLostSalesReport() {
    this.activeView = 'lost-sales-report';
  }

  async generateBudgetPDF(order: Order) {
    if (!order.id) {
      alert('No se puede generar el presupuesto para este pedido');
      return;
    }

    const customer = this.selectedCustomer || await this.getCustomerForOrder(order);
    if (!customer) {
      alert('No se encontró información del cliente');
      return;
    }

    this.selectedOrder = order;
    this.selectedCustomer = customer;
    this.showBudgetPreview = true;
  }

  async getCustomerForOrder(order: any): Promise<Customer | null> {
    try {
      const result = await this.customerService.searchCustomerByName(order.cliente);
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      return null;
    }
  }

  closeBudgetPreview() {
    this.showBudgetPreview = false;
  }

  onBudgetSent(data: { method: string; destination: string }) {
    console.log('Presupuesto enviado:', data);
  }

  getAuthorizedCount(order: Order): number {
    if (!order.diagnostic_authorizations) return 0;
    return order.diagnostic_authorizations.filter(auth => auth.is_authorized).length;
  }

  getRejectedCount(order: Order): number {
    if (!order.diagnostic_authorizations) return 0;
    return order.diagnostic_authorizations.filter(auth => !auth.is_authorized).length;
  }

  getAuthorizedServices(order: Order): any[] {
    if (!order.diagnostic_authorizations) return [];
    return order.diagnostic_authorizations.filter(auth => auth.is_authorized);
  }

  getTotalServicesCount(order: Order): number {
    const serviciosCount = order.servicios?.length || 0;
    const authorizedCount = this.getAuthorizedServices(order).length;
    return serviciosCount + authorizedCount;
  }

  getTotalServicesAmount(order: Order): number {
    const serviciosTotal = order.servicios?.reduce((sum, s) => sum + s.precio, 0) || 0;
    const authorizedTotal = this.getAuthorizedServices(order).reduce((sum, auth) => sum + auth.estimated_cost, 0);
    return serviciosTotal + authorizedTotal;
  }

  getAuthorizedProducts(order: Order): Product[] {
    if (!order.productos) return [];
    // Incluir productos pre-autorizados Y productos del diagnóstico que fueron autorizados
    return order.productos.filter(p => {
      if (p.isRejected) return false;
      // Incluir: 1) pre-autorizados (sin fromDiagnostic) 2) del diagnóstico que fueron autorizados
      return !p.fromDiagnostic || (p.fromDiagnostic && p.isAuthorized);
    });
  }

  getAuthorizedDiagnosticItems(order: Order): DiagnosticItemAuthorization[] {
    if (!order.diagnostic_authorizations) return [];
    // Devolver TODOS los items autorizados del diagnóstico
    // (ya solo guardamos mano de obra en esta tabla, las refacciones van directo a productos)
    return order.diagnostic_authorizations.filter(auth =>
      auth.is_authorized && !auth.is_rejected
    );
  }

  calculateAuthorizedProductsTotal(order: Order): number {
    return this.getAuthorizedProducts(order).reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  }

  calculateServicesTotal(order: Order): number {
    // Incluir servicios pre-autorizados Y servicios del diagnóstico que fueron autorizados
    return order.servicios?.filter(s => {
      if (s.isRejected) return false;
      return !s.fromDiagnostic || (s.fromDiagnostic && s.isAuthorized);
    }).reduce((sum, s) => sum + s.precio, 0) || 0;
  }

  calculateAuthorizedDiagnosticTotal(order: Order): number {
    return this.getAuthorizedDiagnosticItems(order).reduce((sum, auth) => sum + (auth.estimated_cost || 0), 0);
  }

  calculateTotalAuthorized(order: Order): number {
    return this.calculateAuthorizedProductsTotal(order) +
           this.calculateServicesTotal(order) +
           this.calculateAuthorizedDiagnosticTotal(order);
  }

  isOrderAuthorized(order: Order | null): boolean {
    if (!order) return false;
    // Un pedido está autorizado cuando el status es "Autorizado" o estados posteriores
    const authorizedStatuses = [
      'Autorizado',
      'XML Cargado',
      'Productos Clasificados',
      'Pendiente de Validación de Productos',
      'Productos Validados',
      'Pendiente Validación Admin',
      'Aprobado por Admin',
      'Productos Procesados',
      'Pre-OC Validado',
      'Pendiente de Orden de Compra',
      'OC Generada',
      'Entregado'
    ];
    return authorizedStatuses.includes(order.status);
  }

  closeLostSalesReport() {
    this.activeView = 'dashboard';
  }

  startEditingDiagnostic(order: Order) {
    if (order.diagnostic) {
      this.editingDiagnosticData = { ...order.diagnostic };
      this.isEditingDiagnostic = true;
    }
  }

  cancelEditingDiagnostic() {
    this.isEditingDiagnostic = false;
    this.editingDiagnosticData = null;
  }

  async saveDiagnosticEdit(diagnostic: VehicleDiagnostic) {
    if (!this.selectedOrder) return;

    // Actualizar el diagnóstico
    this.selectedOrder.diagnostic = diagnostic;
    this.selectedOrder.technician_name = diagnostic.technicianName;

    // Transferir items del diagnóstico a servicios y refacciones
    this.transferDiagnosticToExistingOrder(this.selectedOrder);

    await this.updateOrderInDatabase(this.selectedOrder);
    this.isEditingDiagnostic = false;
    this.editingDiagnosticData = null;
  }


  async onDiagnosticUpdated(diagnostic: VehicleDiagnostic) {
    if (!this.selectedOrder?.id) return;

    try {
      const { error } = await this.customerService.client
        .from('orders')
        .update({
          diagnostic: diagnostic,
          technician_name: diagnostic.technicianName,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.selectedOrder.id);

      if (error) {
        console.error('Error actualizando diagnóstico:', error);
        alert('Error al actualizar el diagnóstico');
        return;
      }

      this.selectedOrder.diagnostic = diagnostic;
      this.selectedOrder.technician_name = diagnostic.technicianName;

      alert('Diagnóstico actualizado exitosamente');

      this.isEditingDiagnostic = false;
      this.editingDiagnosticData = null;

      await this.loadOrders();
    } catch (error) {
      console.error('Error guardando diagnóstico:', error);
      alert('Error al guardar el diagnóstico');
    }
  }

  openXmlUpload(order: Order) {
    if (order.status !== 'Autorizado') {
      alert('El pedido debe estar en estado "Autorizado" para cargar facturas XML');
      return;
    }
    this.selectedOrder = order;
    this.showXmlUploadModal = true;
  }

  async onXmlInvoicesUploaded(invoices: OrderInvoice[]) {
    if (!this.selectedOrder?.id) {
      alert('Error: No se ha seleccionado un pedido');
      return;
    }

    console.log('Iniciando carga de facturas XML:', invoices);

    try {
      this.selectedOrder.isProcessingXml = true;

      console.log('Actualizando estado del pedido a "Procesando XML"');
      await this.xmlProductsService.updateOrderStatus(this.selectedOrder.id, 'Procesando XML', {
        is_processing_xml: true
      });

      console.log('Guardando facturas en la base de datos...');
      await this.xmlProductsService.saveInvoices(this.selectedOrder.id, invoices);
      console.log('Facturas guardadas exitosamente');

      this.uploadedInvoices = invoices;

      console.log('Validando productos contra base de datos...');
      const { validados, nuevos, noEncontrados } = await this.xmlProductsService.simulateValidateProducts(this.selectedOrder.id);
      console.log(`Validación completada: ${validados} validados, ${nuevos} nuevos, ${noEncontrados} no encontrados`);

      console.log('Obteniendo productos XML del pedido...');
      this.xmlProducts = await this.xmlProductsService.getOrderXmlProducts(this.selectedOrder.id);
      console.log('Productos obtenidos:', this.xmlProducts.length);

      console.log('Obteniendo facturas del pedido...');
      this.uploadedInvoices = await this.xmlProductsService.getOrderInvoices(this.selectedOrder.id);
      console.log('Facturas obtenidas:', this.uploadedInvoices.length);

      console.log('Agrupando productos por proveedor...');
      this.productosPorProveedor = this.xmlProductsService.groupProductsByProvider(this.xmlProducts, this.uploadedInvoices);
      console.log('Proveedores agrupados:', this.productosPorProveedor.length);

      this.productsToClassify = this.xmlProducts.filter(p => p.isNew);
      console.log('Productos a clasificar:', this.productsToClassify.length);

      if (this.productsToClassify.length > 0) {
        let mensaje = `✅ ${validados} productos validados exitosamente.`;
        if (noEncontrados > 0) {
          mensaje += `\n⚠️ ${noEncontrados} productos NO encontrados - auto-clasificados.`;
        }
        mensaje += `\n\n📋 ${this.productsToClassify.length} productos nuevos requieren clasificación manual.`;
        alert(mensaje);

        this.currentProductIndex = 0;
        this.currentProductToClassify = this.productsToClassify[0];
        this.showXmlUploadModal = false;
        this.showProductClassificationModal = true;
        console.log('Abriendo modal de clasificación');
      } else {
        await this.xmlProductsService.updateOrderStatus(this.selectedOrder.id, 'Pendiente de Validación de Productos', {
          is_processing_xml: false
        });

        let mensaje = `✅ ${validados} productos validados exitosamente.`;
        if (noEncontrados > 0) {
          mensaje += `\n⚠️ ${noEncontrados} productos NO encontrados - auto-clasificados como División 0134, Línea 260, Clase 271.`;
        }
        if (nuevos === 0) {
          mensaje += `\n✓ No hay productos nuevos para clasificar manualmente.`;
        }
        alert(mensaje);
        this.showXmlUploadModal = false;

        // Actualizar selectedOrder con el nuevo estado
        if (this.selectedOrder?.id) {
          this.selectedOrder.status = 'Pendiente de Validación de Productos';
          await this.loadOrderXmlProducts(this.selectedOrder);
        }

        await this.loadOrders();
      }
    } catch (error: any) {
      console.error('Error completo procesando facturas XML:', error);
      const errorMessage = error?.message || 'Error desconocido';
      alert(`Error al procesar las facturas XML: ${errorMessage}`);

      if (this.selectedOrder?.id) {
        try {
          await this.xmlProductsService.updateOrderStatus(this.selectedOrder.id, 'Autorizado', {
            is_processing_xml: false
          });
        } catch (rollbackError) {
          console.error('Error al revertir estado:', rollbackError);
        }
      }
    }
  }

  async onProductClassified(data: { product: XmlProduct; classification: any }) {
    try {
      if (data.product.id) {
        await this.xmlProductsService.classifyProduct(data.product.id, data.classification);
      }

      this.currentProductIndex++;

      if (this.currentProductIndex < this.productsToClassify.length) {
        this.currentProductToClassify = this.productsToClassify[this.currentProductIndex];
      } else {
        await this.finishProductClassification();
      }
    } catch (error) {
      console.error('Error clasificando producto:', error);
      alert('Error al clasificar el producto');
    }
  }

  async onProductNotFound(product: XmlProduct) {
    try {
      if (product.id) {
        await this.xmlProductsService.autoClassifyNotFoundProduct(product.id);
      }

      this.currentProductIndex++;

      if (this.currentProductIndex < this.productsToClassify.length) {
        this.currentProductToClassify = this.productsToClassify[this.currentProductIndex];
      } else {
        await this.finishProductClassification();
      }
    } catch (error) {
      console.error('Error auto-clasificando producto no encontrado:', error);
      alert('Error al procesar el producto no encontrado');
    }
  }

  async finishProductClassification() {
    if (!this.selectedOrder?.id) return;

    try {
      await this.xmlProductsService.updateOrderStatus(this.selectedOrder.id, 'Pendiente de Validación de Productos', {
        is_processing_xml: false
      });

      this.xmlProducts = await this.xmlProductsService.getOrderXmlProducts(this.selectedOrder.id);
      this.uploadedInvoices = await this.xmlProductsService.getOrderInvoices(this.selectedOrder.id);
      this.productosPorProveedor = this.xmlProductsService.groupProductsByProvider(this.xmlProducts, this.uploadedInvoices);

      this.showProductClassificationModal = false;
      this.currentProductToClassify = null;
      this.currentProductIndex = 0;

      // Actualizar selectedOrder con el nuevo estado
      if (this.selectedOrder) {
        this.selectedOrder.status = 'Pendiente de Validación de Productos';
      }

      await this.loadOrders();

      this.detailActiveTab = 'xml-products';

      alert('Todos los productos han sido clasificados exitosamente. Revisa los productos en la pestaña "Productos XML"');
    } catch (error) {
      console.error('Error finalizando clasificación:', error);
      alert('Error al finalizar la clasificación');
    }
  }

  cancelXmlUpload() {
    this.showXmlUploadModal = false;
    this.showProductClassificationModal = false;
    this.currentProductToClassify = null;
    this.currentProductIndex = 0;
    this.productsToClassify = [];
  }

  cancelProductClassification() {
    if (confirm('¿Está seguro? Se perderá el progreso de la clasificación.')) {
      this.showProductClassificationModal = false;
      this.currentProductToClassify = null;
      this.currentProductIndex = 0;
      this.productsToClassify = [];
    }
  }

  async validateProducts(order: Order) {
    if (!order.id) return;

    if (!this.canPerformAction(order, 'advance')) {
      alert(this.getPermissionMessage(order, 'advance'));
      return;
    }

    try {
      order.isValidatingProducts = true;
      await this.xmlProductsService.updateOrderStatus(order.id, 'Validando Productos', {
        is_validating_products: true
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Si el usuario es Gerente, Admin Corporativo o Super Admin, auto-aprobar
      const canAutoApprove = this.auth.isGerente() || this.auth.isAdminCorporativo() || this.auth.isSuperAdmin();

      await this.supabaseService.client
        .from('orders')
        .update({
          status: 'Productos Validados',
          admin_validation_status: canAutoApprove ? 'approved' : 'pending',
          admin_validated_by: canAutoApprove ? this.user?.id : null,
          admin_validated_at: canAutoApprove ? new Date().toISOString() : null,
          is_validating_products: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      order.status = 'Productos Validados';
      order.admin_validation_status = canAutoApprove ? 'approved' : 'pending';
      order.isValidatingProducts = false;

      if (this.selectedOrder?.id === order.id) {
        this.selectedOrder = {...order};
      }

      if (canAutoApprove) {
        await this.authService.logAction('auto_approve_validation', { order_id: order.id });
        alert('Productos validados y aprobados correctamente. Ahora puede procesar los productos.');
      } else {
        alert('Productos validados correctamente. Ahora requieren aprobación del administrador.');
      }

      await this.loadOrders();
      if (!canAutoApprove) {
        await this.loadPendingValidationOrders();
      }
    } catch (error) {
      console.error('Error validando productos:', error);
      alert('Error al validar productos');
      order.isValidatingProducts = false;
    }
  }

  canShowProcessProductsButton(order: Order | null): boolean {
    if (!order) return false;

    // Debe estar en estado "Productos Validados"
    if (order.status !== 'Productos Validados') return false;

    // Usuario debe tener permiso para avanzar
    if (!this.auth.canAdvanceOrderStatus()) return false;

    // Si es Gerente, Admin Corporativo o Super Admin, puede procesar siempre
    if (this.auth.isGerente() || this.auth.isAdminCorporativo() || this.auth.isSuperAdmin()) {
      return true;
    }

    // Para otros roles (Técnico, Asesor Técnico), solo si está aprobado
    return order.admin_validation_status === 'approved';
  }

  canShowPendingValidationMessage(order: Order | null): boolean {
    if (!order) return false;

    // Debe estar en estado "Productos Validados"
    if (order.status !== 'Productos Validados') return false;

    // Debe estar pendiente de aprobación
    if (order.admin_validation_status !== 'pending') return false;

    // Solo para Técnico y Asesor Técnico
    return this.auth.isTecnico() || this.auth.isAsesorTecnico();
  }

  async processProducts(order: Order) {
    if (!order.id) return;

    if (!this.canPerformAction(order, 'advance')) {
      alert(this.getPermissionMessage(order, 'advance'));
      return;
    }

    if (order.admin_validation_status !== 'approved') {
      alert('Este pedido requiere aprobación del administrador antes de procesar los productos.');
      return;
    }

    try {
      order.isProcessingProducts = true;
      await this.xmlProductsService.updateOrderStatus(order.id, 'Procesando Productos', {
        is_processing_products: true
      });

      const products = await this.xmlProductsService.getOrderXmlProducts(order.id);

      await new Promise(resolve => setTimeout(resolve, 3000));

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.id && product.clase) {
          const skus = this.xmlProductsService.generateSKU(product.clase, i + 1);
          // Actualizar producto con SKU Oracle y cambiar estado a 'processed'
          await this.supabaseService.client
            .from('xml_products')
            .update({
              sku_oracle: skus.final,
              sku_original: skus.original,
              sku_final: skus.final,
              product_status: 'processed',
              is_processed: true,
              processed_at: new Date().toISOString(),
              processed_by: this.user?.id
            })
            .eq('id', product.id);
        }
      }

      await this.supabaseService.client
        .from('orders')
        .update({
          status: 'Productos Procesados',
          pre_oc_validation_status: 'pending',
          is_processing_products: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      order.status = 'Productos Procesados';
      order.pre_oc_validation_status = 'pending';
      order.isProcessingProducts = false;

      if (this.selectedOrder?.id === order.id) {
        this.selectedOrder = {...order};
      }

      alert(`${products.length} productos procesados. SKUs generados exitosamente. Ahora requiere validación pre-OC.`);
      await this.loadOrders();
      await this.loadPendingPreOCOrders();
    } catch (error) {
      console.error('Error procesando productos:', error);
      alert('Error al procesar productos');
      order.isProcessingProducts = false;
    }
  }


  openPaymentModal() {
    if (!this.selectedOrder) return;
    this.paymentAmount = this.calculateFinalTotal();
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.paymentAmount = 0;
  }

  async confirmPayment() {
    if (!this.selectedOrder?.id) return;

    if (!this.paymentAmount || this.paymentAmount <= 0) {
      alert('Por favor ingresa una cantidad válida');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          payment_status: 'paid',
          amount_paid: this.paymentAmount,
          paid_at: new Date().toISOString(),
          paid_by: this.user?.id
        })
        .eq('id', this.selectedOrder.id);

      if (error) throw error;

      this.selectedOrder.payment_status = 'paid';
      this.selectedOrder.amount_paid = this.paymentAmount;
      this.selectedOrder.paid_at = new Date().toISOString();

      await this.authService.logAction('register_payment', {
        order_id: this.selectedOrder.id,
        amount: this.paymentAmount
      });

      alert('Pago registrado exitosamente');
      this.closePaymentModal();
      await this.loadOrders();
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar el pago');
    }
  }

  async markAsDelivered(order: Order) {
    if (!order.id) return;

    if (order.payment_status !== 'paid') {
      alert('El pedido debe estar pagado antes de marcarlo como entregado');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          status: 'Entregado',
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: this.user?.id
        })
        .eq('id', order.id);

      if (error) throw error;

      order.status = 'Entregado';
      order.delivery_status = 'delivered';
      order.delivered_at = new Date().toISOString();

      if (this.selectedOrder?.id === order.id) {
        this.selectedOrder = {...order};
      }

      await this.authService.logAction('update_order', { order_id: order.id, action: 'mark_delivered' });

      alert('Pedido marcado como entregado');
      await this.loadOrders();
    } catch (error) {
      console.error('Error marcando como entregado:', error);
      alert('Error al marcar como entregado');
    }
  }

  async loadOrderXmlProducts(order: Order) {
    if (!order.id) return;
    try {
      this.xmlProducts = await this.xmlProductsService.getOrderXmlProducts(order.id);
      this.uploadedInvoices = await this.xmlProductsService.getOrderInvoices(order.id);
      this.productosPorProveedor = this.xmlProductsService.groupProductsByProvider(this.xmlProducts, this.uploadedInvoices);
    } catch (error) {
      console.error('Error cargando productos XML:', error);
    }
  }

  hasXmlProducts(order: Order): boolean {
    // Verificar si el pedido tiene productos XML cargados
    return this.uploadedInvoices.length > 0 || this.xmlProducts.length > 0;
  }

  async deleteInvoice(invoice: OrderInvoice) {
    if (!invoice.id) return;

    if (!confirm(`¿Estás seguro de eliminar la factura ${invoice.invoice_folio}?\n\nEsto eliminará también todos los productos asociados a esta factura.`)) {
      return;
    }

    try {
      // Eliminar productos XML asociados
      const { error: productsError } = await this.supabaseService.client
        .from('xml_products')
        .delete()
        .eq('invoice_id', invoice.id);

      if (productsError) throw productsError;

      // Eliminar factura
      const { error: invoiceError } = await this.supabaseService.client
        .from('order_invoices')
        .delete()
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      // Recargar productos XML
      if (this.selectedOrder?.id) {
        await this.loadOrderXmlProducts(this.selectedOrder);

        // Si ya no hay facturas, regresar el estado a "Autorizado"
        if (this.uploadedInvoices.length === 0 && this.xmlProducts.length === 0) {
          const { error: statusError } = await this.supabaseService.client
            .from('orders')
            .update({
              status: 'Autorizado',
              is_processing_xml: false,
              is_validating_products: false,
              is_processing_products: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', this.selectedOrder.id);

          if (statusError) throw statusError;

          this.selectedOrder.status = 'Autorizado';
          await this.loadOrders();

          alert('Factura eliminada exitosamente.\n\nEl pedido ha regresado al estado "Autorizado" porque ya no tiene facturas cargadas.');
        } else {
          alert('Factura eliminada exitosamente');
        }
      }
    } catch (error) {
      console.error('Error eliminando factura:', error);
      alert('Error al eliminar la factura');
    }
  }

  async loadPendingValidationOrders() {
    try {
      // Construir query base
      let query = this.supabaseService.client
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*)
        `)
        .eq('status', 'Productos Validados')
        .eq('admin_validation_status', 'pending');

      // Filtrar por centro automotriz si no es Super Admin o Admin Corporativo
      if (this.user && this.user.autocenter) {
        const allowedRoles = ['super_admin', 'admin_corporativo'];
        if (!allowedRoles.includes(this.user.role)) {
          query = query.eq('tienda', this.user.autocenter);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      this.pendingValidationOrders = (data || []).map((order: any) => ({
        ...order,
        cliente: order.customer?.nombre_completo || 'Cliente desconocido',
        fecha: new Date(order.created_at),
        vehiculo: order.vehicle ? {
          placas: order.vehicle.placas,
          marca: order.vehicle.marca,
          modelo: order.vehicle.modelo,
          anio: order.vehicle.anio,
          color: order.vehicle.color
        } : undefined
      }));

      for (const order of this.pendingValidationOrders) {
        if (order.id) {
          order.xmlProducts = await this.xmlProductsService.getOrderXmlProducts(order.id);
        }
      }

      this.pendingValidationCount = this.pendingValidationOrders.length;
    } catch (error) {
      console.error('Error cargando pedidos pendientes de validación:', error);
    }
  }

  async approveOrder(order: Order) {
    if (!order.id) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          admin_validation_status: 'approved',
          admin_validated_by: this.user?.id,
          admin_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      await this.authService.logAction('update_order', { order_id: order.id, action: 'approve_order' });

      alert('Pedido aprobado exitosamente. Ahora puede procesar los productos.');
      await this.loadPendingValidationOrders();
    } catch (error: any) {
      console.error('Error aprobando pedido:', error);
      alert('Error al aprobar el pedido: ' + error.message);
    }
  }

  async rejectOrder(order: Order) {
    const reason = prompt('Ingrese el motivo del rechazo:');
    if (!reason) return;

    if (!order.id) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          admin_validation_status: 'rejected',
          admin_validation_notes: reason,
          admin_validated_by: this.user?.id,
          admin_validated_at: new Date().toISOString(),
          status: 'Rechazado por Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      await this.authService.logAction('update_order', { order_id: order.id, action: 'reject_order', reason });

      alert('Pedido rechazado. Se ha notificado al vendedor.');
      await this.loadPendingValidationOrders();
    } catch (error: any) {
      console.error('Error rechazando pedido:', error);
      alert('Error al rechazar el pedido: ' + error.message);
    }
  }

  async loadPendingPreOCOrders() {
    try {
      // Construir query base
      let query = this.supabaseService.client
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*)
        `)
        .eq('status', 'Productos Procesados')
        .eq('pre_oc_validation_status', 'pending');

      // Filtrar por centro automotriz si no es Super Admin o Admin Corporativo
      if (this.user && this.user.autocenter) {
        const allowedRoles = ['super_admin', 'admin_corporativo'];
        if (!allowedRoles.includes(this.user.role)) {
          query = query.eq('tienda', this.user.autocenter);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Cargar conteo de productos procesados para cada orden
      this.pendingPreOCOrders = await Promise.all((data || []).map(async (order: any) => {
        let processedProductsCount = 0;

        if (order.id) {
          const { count } = await this.supabaseService.client
            .from('xml_products')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id)
            .eq('product_status', 'processed');

          processedProductsCount = count || 0;
        }

        return {
          ...order,
          fecha: new Date(order.fecha),
          productos: order.productos || [],
          servicios: order.servicios || [],
          presupuesto: order.presupuesto || 0,
          customer: order.customer || {},
          vehicle: order.vehicle || {},
          processedProductsCount: processedProductsCount
        };
      }));

      this.pendingPreOCCount = this.pendingPreOCOrders.length;
    } catch (error: any) {
      console.error('Error cargando pedidos pendientes de validación pre-OC:', error);
    }
  }

  async openPreOCValidation(order: Order) {
    this.selectedOrder = order;

    // Cargar productos XML agrupados por proveedor
    if (order.id) {
      try {
        const xmlProducts = await this.xmlProductsService.getOrderXmlProducts(order.id);
        const invoices = await this.xmlProductsService.getOrderInvoices(order.id);
        const productosPorProveedor = this.xmlProductsService.groupProductsByProvider(xmlProducts, invoices);

        console.log('Productos XML cargados:', xmlProducts);
        console.log('Productos por proveedor:', productosPorProveedor);

        // Calcular total de productos procesados
        const processedCount = xmlProducts.filter(p => p.isProcessed || p.product_status === 'processed').length;
        const totalAmount = productosPorProveedor.reduce((sum, p) => sum + p.montoTotal, 0);

        this.selectedOrder = {
          ...order,
          productosPorProveedor: productosPorProveedor,
          processedProductsCount: processedCount,
          presupuesto: totalAmount || order.presupuesto,
          fecha: order.fecha ? (typeof order.fecha === 'string' ? new Date(order.fecha) : order.fecha) : new Date()
        };

        console.log('Selected order actualizado:', this.selectedOrder);

        // Forzar detección de cambios
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error cargando productos para validación pre-OC:', error);
      }
    }

    this.showPreOCValidationModal = true;
    this.cdr.detectChanges();
  }

  closePreOCValidation() {
    this.showPreOCValidationModal = false;
    this.selectedOrder = null;
  }

  async approvePreOCValidation(event: { notes: string }) {
    if (!this.selectedOrder?.id) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          pre_oc_validation_status: 'approved',
          pre_oc_validated_by: this.user?.id,
          pre_oc_validated_at: new Date().toISOString(),
          pre_oc_validation_notes: event.notes,
          status: 'Pre-OC Validado',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.selectedOrder.id);

      if (error) throw error;

      await this.authService.logAction('approve_pre_oc', {
        order_id: this.selectedOrder.id,
        notes: event.notes
      });

      // Actualizar el selectedOrder para reflejar el cambio
      if (this.selectedOrder) {
        this.selectedOrder.pre_oc_validation_status = 'approved';
        this.selectedOrder.pre_oc_validated_by = this.user?.id;
        this.selectedOrder.pre_oc_validated_at = new Date();
        this.selectedOrder.pre_oc_validation_notes = event.notes;
        this.selectedOrder.status = 'Pre-OC Validado';
      }

      // Forzar la detección de cambios
      this.cdr.detectChanges();

      alert('Validación pre-OC aprobada. Ahora puede generar la orden de compra.');
      // NO cerrar el modal para permitir generar la OC
      await this.loadPendingPreOCOrders();
      await this.loadOrders();

      // Forzar detección de cambios después de cargar
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error aprobando validación pre-OC:', error);
      alert('Error al aprobar la validación: ' + error.message);
    }
  }

  async rejectPreOCValidation(event: { notes: string }) {
    if (!this.selectedOrder?.id) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          pre_oc_validation_status: 'rejected',
          pre_oc_validated_by: this.user?.id,
          pre_oc_validated_at: new Date().toISOString(),
          pre_oc_validation_notes: event.notes,
          status: 'Pre-OC Rechazado',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.selectedOrder.id);

      if (error) throw error;

      await this.authService.logAction('reject_pre_oc', {
        order_id: this.selectedOrder.id,
        notes: event.notes
      });

      alert('Validación pre-OC rechazada. El pedido debe ser revisado.');
      this.closePreOCValidation();
      await this.loadPendingPreOCOrders();
      await this.loadOrders();
    } catch (error: any) {
      console.error('Error rechazando validación pre-OC:', error);
      alert('Error al rechazar la validación: ' + error.message);
    }
  }

  async generatePurchaseOrder() {
    if (!this.selectedOrder?.id) return;

    try {
      // Generar número de OC único basado en folio
      const purchaseOrderNumber = `OC-${this.selectedOrder.folio}`;

      const { error } = await this.supabaseService.client
        .from('orders')
        .update({
          purchase_order_number: purchaseOrderNumber,
          status: 'Pendiente de Orden de Compra',
          updated_at: new Date().toISOString()
        })
        .eq('id', this.selectedOrder.id);

      if (error) throw error;

      await this.authService.logAction('generate_purchase_order', {
        order_id: this.selectedOrder.id,
        purchase_order_number: purchaseOrderNumber
      });

      // Actualizar el selectedOrder para reflejar el cambio
      if (this.selectedOrder) {
        this.selectedOrder.purchase_order_number = purchaseOrderNumber;
        this.selectedOrder.status = 'Pendiente de Orden de Compra';
      }

      alert(`Orden de Compra generada exitosamente:\n\n${purchaseOrderNumber}`);
      await this.loadPendingPreOCOrders();
      await this.loadOrders();
    } catch (error: any) {
      console.error('Error generando orden de compra:', error);
      alert('Error al generar la orden de compra: ' + error.message);
    }
  }

  canPerformAction(order: Order, action: 'view' | 'edit' | 'advance'): boolean {
    const phase = this.permissionsService.getPhaseFromStatus(order.status);
    return this.permissionsService.canPerformAction(phase, action);
  }

  canAdvancePhase(order: Order): boolean {
    const phase = this.permissionsService.getPhaseFromStatus(order.status);
    return this.permissionsService.canAdvanceToNextPhase(
      phase,
      order.status,
      order.admin_validation_status
    );
  }

  getPermissionMessage(order: Order, action: 'view' | 'edit' | 'advance'): string {
    const phase = this.permissionsService.getPhaseFromStatus(order.status);
    return this.permissionsService.getPermissionDeniedMessage(phase, action);
  }

  async loadNotFoundProducts() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('xml_products')
        .select(`
          *,
          invoice:invoices(
            invoice_folio,
            proveedor,
            order:orders(
              folio,
              tienda,
              customer:customers(nombre_completo),
              vehicle:vehicles(placas, marca, modelo)
            )
          )
        `)
        .eq('not_found', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let products = (data || []).map((product: any) => ({
        ...product,
        invoice_folio: product.invoice?.invoice_folio,
        proveedor: product.invoice?.proveedor,
        order_folio: product.invoice?.order?.folio,
        order_tienda: product.invoice?.order?.tienda,
        cliente: product.invoice?.order?.customer?.nombre_completo,
        vehiculo: product.invoice?.order?.vehicle
      }));

      // Filtrar por centro automotriz si no es Super Admin o Admin Corporativo
      if (this.user && this.user.autocenter) {
        const allowedRoles = ['super_admin', 'admin_corporativo'];
        if (!allowedRoles.includes(this.user.role)) {
          products = products.filter(p => p.order_tienda === this.user!.autocenter);
        }
      }

      this.notFoundProducts = products;
      this.notFoundProductsCount = this.notFoundProducts.length;
    } catch (error: any) {
      console.error('Error cargando productos no encontrados:', error);
    }
  }

  getNotFoundProductsTotal(): number {
    return this.notFoundProducts.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  getDiagnosticBadgeClass(severity: any): string {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'recommended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  async deleteOrder(order: Order) {
    if (!this.canDeleteOrders()) {
      alert('No tienes permisos para eliminar presupuestos');
      return;
    }

    try {
      // 1. Contar datos relacionados que serán eliminados
      const [authorizationsResult, invoicesResult, xmlProductsResult, lostSalesResult] = await Promise.all([
        this.customerService.client.from('diagnostic_items_authorization').select('id', { count: 'exact', head: true }).eq('order_id', order.id),
        this.customerService.client.from('order_invoices').select('id', { count: 'exact', head: true }).eq('order_id', order.id),
        this.customerService.client.from('xml_products').select('id', { count: 'exact', head: true }).eq('order_id', order.id),
        this.customerService.client.from('lost_sales').select('id', { count: 'exact', head: true }).eq('order_id', order.id)
      ]);

      const authCount = authorizationsResult.count || 0;
      const invoiceCount = invoicesResult.count || 0;
      const xmlCount = xmlProductsResult.count || 0;
      const lostSalesCount = lostSalesResult.count || 0;

      let relatedDataMessage = '\nDatos relacionados que serán eliminados:';
      if (authCount > 0) relatedDataMessage += `\n• ${authCount} autorizaciones de diagnóstico`;
      if (invoiceCount > 0) relatedDataMessage += `\n• ${invoiceCount} facturas`;
      if (xmlCount > 0) relatedDataMessage += `\n• ${xmlCount} productos XML`;
      if (lostSalesCount > 0) relatedDataMessage += `\n• ${lostSalesCount} ventas perdidas`;

      if (authCount === 0 && invoiceCount === 0 && xmlCount === 0 && lostSalesCount === 0) {
        relatedDataMessage = '\nNo hay datos relacionados.';
      }

      const confirmacion = confirm(
        `¿Estás seguro de que deseas eliminar este presupuesto?\n\n` +
        `Folio: ${order.folio}\n` +
        `Cliente: ${order.cliente}\n` +
        `Monto: $${order.presupuesto.toFixed(2)}\n` +
        relatedDataMessage +
        `\n\nEsta acción NO se puede deshacer.`
      );

      if (!confirmacion) return;

      // 2. Eliminar el presupuesto (cascada automática)
      const { error: deleteError } = await this.customerService.client
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (deleteError) {
        console.error('Error eliminando presupuesto:', deleteError);
        alert('Error al eliminar el presupuesto: ' + deleteError.message);
        return;
      }

      // 3. Registrar en audit_logs
      const auditData = {
        user_id: this.user?.id,
        action: 'delete_order',
        table_name: 'orders',
        record_id: order.id,
        changes: {
          deleted_order: {
            folio: order.folio,
            cliente: order.cliente,
            presupuesto: order.presupuesto,
            status: order.status,
            deleted_at: new Date().toISOString()
          },
          related_data_deleted: {
            authorizations: authCount,
            invoices: invoiceCount,
            xml_products: xmlCount,
            lost_sales: lostSalesCount
          }
        }
      };

      const { error: auditError } = await this.customerService.client
        .from('audit_logs')
        .insert(auditData);

      if (auditError) {
        console.error('Error registrando auditoría:', auditError);
        // No detenemos el flujo por error en auditoría
      }

      // 4. Mostrar resumen de eliminación
      let successMessage = `Presupuesto eliminado exitosamente.\n\n`;
      successMessage += `Folio: ${order.folio}\n`;
      if (authCount > 0 || invoiceCount > 0 || xmlCount > 0 || lostSalesCount > 0) {
        successMessage += `\nDatos relacionados eliminados:`;
        if (authCount > 0) successMessage += `\n• ${authCount} autorizaciones`;
        if (invoiceCount > 0) successMessage += `\n• ${invoiceCount} facturas`;
        if (xmlCount > 0) successMessage += `\n• ${xmlCount} productos XML`;
        if (lostSalesCount > 0) successMessage += `\n• ${lostSalesCount} ventas perdidas`;
      }

      alert(successMessage);
      await this.loadOrders();
    } catch (error: any) {
      console.error('Error eliminando presupuesto:', error);
      alert('Error al eliminar el presupuesto: ' + (error?.message || 'Error desconocido'));
    }
  }

  calculateTotalInvoicesSubtotal(): number {
    return this.uploadedInvoices.reduce((total, invoice) => {
      return total + (invoice.subtotal || 0);
    }, 0);
  }

  calculateTotalInvoicesIVA(): number {
    return this.uploadedInvoices.reduce((total, invoice) => {
      return total + (invoice.iva || 0);
    }, 0);
  }

  calculateTotalInvoicesTotal(): number {
    return this.uploadedInvoices.reduce((total, invoice) => {
      return total + (invoice.total_amount || 0);
    }, 0);
  }
}
