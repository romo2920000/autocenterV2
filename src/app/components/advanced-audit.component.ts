import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

interface OrderVersion {
  id: string;
  order_id: string;
  version_number: number;
  changed_by: string;
  changed_at: string;
  changes: any;
  change_description: string;
  previous_data: any;
  new_data: any;
  user_name?: string;
  order_folio?: string;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  related_order_id: string;
  related_customer_id: string;
  autocenter: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string;
  read_by: string;
  dismissed_at: string;
  dismissed_by: string;
  metadata: any;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

@Component({
  selector: 'app-advanced-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg mb-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center gap-4">
              <button (click)="goBack()" class="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
              </button>
              <h1 class="text-3xl font-bold text-white">Auditoría Avanzada</h1>
            </div>
            <div class="flex gap-4">
              <button (click)="generateAlerts()" class="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                Generar Alertas
              </button>
              <button (click)="exportToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Exportar a Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-6">

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            (click)="activeTab = 'alerts'"
            [class.border-blue-500]="activeTab === 'alerts'"
            [class.text-blue-600]="activeTab === 'alerts'"
            [class.border-transparent]="activeTab !== 'alerts'"
            [class.text-gray-500]="activeTab !== 'alerts'"
            class="py-4 px-1 border-b-2 font-medium text-sm">
            Alertas del Sistema
            <span *ngIf="unreadAlertsCount > 0" class="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
              {{ unreadAlertsCount }}
            </span>
          </button>
          <button
            (click)="activeTab = 'versions'"
            [class.border-blue-500]="activeTab === 'versions'"
            [class.text-blue-600]="activeTab === 'versions'"
            [class.border-transparent]="activeTab !== 'versions'"
            [class.text-gray-500]="activeTab !== 'versions'"
            class="py-4 px-1 border-b-2 font-medium text-sm">
            Historial de Versiones
          </button>
          <button
            (click)="activeTab = 'audit'"
            [class.border-blue-500]="activeTab === 'audit'"
            [class.text-blue-600]="activeTab === 'audit'"
            [class.border-transparent]="activeTab !== 'audit'"
            [class.text-gray-500]="activeTab !== 'audit'"
            class="py-4 px-1 border-b-2 font-medium text-sm">
            Logs de Auditoría
          </button>
        </nav>
      </div>

      <!-- Alertas del Sistema -->
      <div *ngIf="activeTab === 'alerts'" class="space-y-6">
        <!-- Filtros -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
              <select [(ngModel)]="alertFilters.severity" (change)="loadAlerts()" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Todas</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select [(ngModel)]="alertFilters.type" (change)="loadAlerts()" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Todos</option>
                <option value="pending_authorization">Autorización Pendiente</option>
                <option value="recurring_not_found">Producto No Encontrado</option>
                <option value="pending_validations">Validaciones Pendientes</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select [(ngModel)]="alertFilters.read" (change)="loadAlerts()" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Todas</option>
                <option value="unread">No leídas</option>
                <option value="read">Leídas</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Autocenter</label>
              <select [(ngModel)]="alertFilters.autocenter" (change)="loadAlerts()" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Todos</option>
                <option *ngFor="let ac of autocenters" [value]="ac">{{ ac }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Lista de Alertas -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="divide-y divide-gray-200">
            <div *ngFor="let alert of alerts" class="p-4 hover:bg-gray-50 transition-colors"
                 [class.bg-blue-50]="!alert.is_read">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span [class]="getSeverityBadgeClass(alert.severity)">
                      {{ getSeverityLabel(alert.severity) }}
                    </span>
                    <span class="text-sm text-gray-500">{{ alert.autocenter || 'Global' }}</span>
                    <span class="text-xs text-gray-400">{{ formatDate(alert.created_at) }}</span>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ alert.title }}</h3>
                  <p class="text-gray-600">{{ alert.description }}</p>
                  <div *ngIf="alert.metadata && Object.keys(alert.metadata).length > 0" class="mt-2">
                    <details class="text-sm text-gray-500">
                      <summary class="cursor-pointer hover:text-gray-700">Ver detalles</summary>
                      <pre class="mt-2 p-2 bg-gray-100 rounded">{{ alert.metadata | json }}</pre>
                    </details>
                  </div>
                </div>
                <div class="flex flex-col gap-2 ml-4">
                  <button
                    *ngIf="!alert.is_read"
                    (click)="markAsRead(alert)"
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Marcar leída
                  </button>
                  <button
                    *ngIf="!alert.is_dismissed"
                    (click)="dismissAlert(alert)"
                    class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                    Descartar
                  </button>
                </div>
              </div>
            </div>
            <div *ngIf="alerts.length === 0" class="p-8 text-center text-gray-500">
              No hay alertas para mostrar
            </div>
          </div>
        </div>
      </div>

      <!-- Historial de Versiones -->
      <div *ngIf="activeTab === 'versions'" class="space-y-6">
        <!-- Filtros -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Buscar por Folio</label>
              <input
                type="text"
                [(ngModel)]="versionFilters.folio"
                (keyup.enter)="loadVersions()"
                placeholder="Folio del presupuesto"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input
                type="date"
                [(ngModel)]="versionFilters.dateFrom"
                (change)="loadVersions()"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
              <input
                type="date"
                [(ngModel)]="versionFilters.dateTo"
                (change)="loadVersions()"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
          </div>
          <div class="mt-4">
            <button (click)="loadVersions()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Buscar
            </button>
          </div>
        </div>

        <!-- Tabla de Versiones -->
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versión</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modificado Por</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cambios</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let version of versions">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ version.order_folio }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">v{{ version.version_number }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ version.user_name || 'Sistema' }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ formatDateTime(version.changed_at) }}</td>
                <td class="px-6 py-4 text-sm">
                  <div class="space-y-1">
                    <div *ngFor="let change of getChangesList(version.changes)" class="text-xs">
                      <span class="font-semibold">{{ change.field }}:</span>
                      <span class="text-red-600 line-through">{{ change.before }}</span>
                      →
                      <span class="text-green-600">{{ change.after }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm">
                  <button (click)="viewVersionDetails(version)" class="text-blue-600 hover:text-blue-800">
                    Ver Detalle
                  </button>
                </td>
              </tr>
              <tr *ngIf="versions.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  No hay versiones para mostrar
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Logs de Auditoría -->
      <div *ngIf="activeTab === 'audit'" class="space-y-6">
        <!-- Filtros -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                [(ngModel)]="auditFilters.user"
                placeholder="Nombre o email"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Acción</label>
              <select [(ngModel)]="auditFilters.action" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Todas</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create_order">Crear Orden</option>
                <option value="update_order">Actualizar Orden</option>
                <option value="delete_order">Eliminar Orden</option>
                <option value="approve_order">Aprobar Orden</option>
                <option value="reject_order">Rechazar Orden</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
              <input
                type="date"
                [(ngModel)]="auditFilters.dateFrom"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
              <input
                type="date"
                [(ngModel)]="auditFilters.dateTo"
                class="w-full px-3 py-2 border rounded-lg">
            </div>
          </div>
          <div class="mt-4">
            <button (click)="loadAuditLogs()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Buscar
            </button>
          </div>
        </div>

        <!-- Tabla de Auditoría -->
        <div class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalles</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let log of auditLogs">
                <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                <td class="px-6 py-4 text-sm">
                  <div class="font-medium text-gray-900">{{ log.user_name || 'Desconocido' }}</div>
                  <div class="text-xs text-gray-500">{{ log.user_email }}</div>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {{ getActionLabel(log.action) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ log.resource_type }} - {{ log.resource_id?.substring(0, 8) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 font-mono">{{ log.ip_address || 'N/A' }}</td>
                <td class="px-6 py-4 text-sm">
                  <details *ngIf="log.details" class="cursor-pointer">
                    <summary class="text-blue-600 hover:text-blue-800">Ver</summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs max-w-md overflow-x-auto">{{ log.details | json }}</pre>
                  </details>
                </td>
              </tr>
              <tr *ngIf="auditLogs.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  No hay logs para mostrar
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Detalle de Versión -->
      <div *ngIf="showVersionDetail" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold">Detalle de Versión</h2>
              <button (click)="showVersionDetail = false" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div *ngIf="selectedVersion" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h3 class="font-semibold text-gray-700">Versión Anterior</h3>
                  <pre class="mt-2 p-4 bg-gray-100 rounded text-xs overflow-x-auto">{{ selectedVersion.previous_data | json }}</pre>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-700">Versión Nueva</h3>
                  <pre class="mt-2 p-4 bg-gray-100 rounded text-xs overflow-x-auto">{{ selectedVersion.new_data | json }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `
})
export class AdvancedAuditComponent implements OnInit {
  activeTab: 'alerts' | 'versions' | 'audit' = 'alerts';

  alerts: SystemAlert[] = [];
  versions: OrderVersion[] = [];
  auditLogs: AuditLog[] = [];
  autocenters: string[] = [];

  unreadAlertsCount = 0;

  Object = Object;

  alertFilters = {
    severity: '',
    type: '',
    read: '',
    autocenter: ''
  };

  versionFilters = {
    folio: '',
    dateFrom: '',
    dateTo: ''
  };

  auditFilters = {
    user: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  };

  showVersionDetail = false;
  selectedVersion: OrderVersion | null = null;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAutocenters();
    this.loadAlerts();
    this.loadVersions();
    this.loadAuditLogs();
  }

  async loadAutocenters() {
    try {
      const { data, error } = await this.supabase.client
        .from('orders')
        .select('tienda')
        .order('tienda');

      if (error) throw error;

      const unique = [...new Set(data?.map(d => d.tienda) || [])];
      this.autocenters = unique.filter(a => a);
    } catch (error) {
      console.error('Error loading autocenters:', error);
    }
  }

  async loadAlerts() {
    try {
      let query = this.supabase.client
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (this.alertFilters.severity) {
        query = query.eq('severity', this.alertFilters.severity);
      }
      if (this.alertFilters.type) {
        query = query.eq('alert_type', this.alertFilters.type);
      }
      if (this.alertFilters.read === 'unread') {
        query = query.eq('is_read', false);
      } else if (this.alertFilters.read === 'read') {
        query = query.eq('is_read', true);
      }
      if (this.alertFilters.autocenter) {
        query = query.eq('autocenter', this.alertFilters.autocenter);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.alerts = data || [];
      this.unreadAlertsCount = this.alerts.filter(a => !a.is_read).length;
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  async loadVersions() {
    try {
      let query = this.supabase.client
        .from('order_versions')
        .select(`
          *,
          order:orders(folio),
          user:user_profiles(full_name)
        `)
        .order('changed_at', { ascending: false })
        .limit(100);

      if (this.versionFilters.dateFrom) {
        query = query.gte('changed_at', this.versionFilters.dateFrom);
      }
      if (this.versionFilters.dateTo) {
        query = query.lte('changed_at', this.versionFilters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.versions = (data || []).map((v: any) => ({
        ...v,
        order_folio: v.order?.folio,
        user_name: v.user?.full_name
      }));

      if (this.versionFilters.folio) {
        this.versions = this.versions.filter(v =>
          v.order_folio?.toLowerCase().includes(this.versionFilters.folio.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  }

  async loadAuditLogs() {
    try {
      let query = this.supabase.client
        .from('audit_logs')
        .select(`
          *,
          user:user_profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (this.auditFilters.action) {
        query = query.eq('action', this.auditFilters.action);
      }
      if (this.auditFilters.dateFrom) {
        query = query.gte('created_at', this.auditFilters.dateFrom);
      }
      if (this.auditFilters.dateTo) {
        query = query.lte('created_at', this.auditFilters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.auditLogs = (data || []).map((log: any) => ({
        ...log,
        user_name: log.user?.full_name,
        user_email: log.user?.email
      }));

      if (this.auditFilters.user) {
        this.auditLogs = this.auditLogs.filter(log =>
          log.user_name?.toLowerCase().includes(this.auditFilters.user.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(this.auditFilters.user.toLowerCase())
        );
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  }

  async generateAlerts() {
    try {
      const { error } = await this.supabase.client.rpc('generate_system_alerts');
      if (error) throw error;

      alert('Alertas generadas exitosamente');
      await this.loadAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
      alert('Error al generar alertas');
    }
  }

  async markAsRead(alert: SystemAlert) {
    try {
      const { error } = await this.supabase.client
        .from('system_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
          read_by: this.auth.getCurrentUser()?.id
        })
        .eq('id', alert.id);

      if (error) throw error;

      await this.loadAlerts();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  async dismissAlert(alert: SystemAlert) {
    try {
      const { error } = await this.supabase.client
        .from('system_alerts')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
          dismissed_by: this.auth.getCurrentUser()?.id
        })
        .eq('id', alert.id);

      if (error) throw error;

      await this.loadAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }

  viewVersionDetails(version: OrderVersion) {
    this.selectedVersion = version;
    this.showVersionDetail = true;
  }

  getChangesList(changes: any): any[] {
    if (!changes) return [];
    return Object.keys(changes).map(field => ({
      field,
      before: this.formatValue(changes[field].before),
      after: this.formatValue(changes[field].after)
    }));
  }

  formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    return String(value);
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'px-2 py-1 text-xs rounded-full bg-red-600 text-white';
      case 'high':
        return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
      case 'medium':
        return 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800';
      case 'low':
        return 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-800';
      default:
        return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return severity;
    }
  }

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'login': 'Inicio de sesión',
      'logout': 'Cierre de sesión',
      'create_order': 'Crear orden',
      'update_order': 'Actualizar orden',
      'delete_order': 'Eliminar orden',
      'approve_order': 'Aprobar orden',
      'reject_order': 'Rechazar orden'
    };
    return labels[action] || action;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX');
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('es-MX');
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  exportToExcel() {
    alert('Funcionalidad de exportar a Excel en desarrollo');
  }
}
