import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuditLog, UserSession } from '../services/auth.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex items-center gap-4 mb-6">
            <button
              (click)="goToDashboard()"
              class="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver al Dashboard
            </button>
            <h2 class="text-2xl font-bold text-gray-900">Auditoría del Sistema</h2>
          </div>

          <div class="mb-6">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8">
                <button
                  (click)="activeTab = 'logs'"
                  [class]="activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                  Registro de Actividades
                </button>
                <button
                  (click)="activeTab = 'sessions'"
                  [class]="activeTab === 'sessions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                  Sesiones Activas
                </button>
                <button
                  (click)="activeTab = 'stats'"
                  [class]="activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                  Estadísticas
                </button>
              </nav>
            </div>
          </div>

          <div *ngIf="activeTab === 'logs'">
            <div class="mb-4 flex gap-4">
              <input
                type="text"
                [(ngModel)]="logSearchTerm"
                (input)="filterLogs()"
                placeholder="Buscar en registros..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

              <select
                [(ngModel)]="actionTypeFilter"
                (change)="filterLogs()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todas las acciones</option>
                <option value="login">Inicios de sesión</option>
                <option value="logout">Cierres de sesión</option>
                <option value="create_user">Crear usuario</option>
                <option value="update_user">Actualizar usuario</option>
                <option value="activate_user">Activar usuario</option>
                <option value="deactivate_user">Desactivar usuario</option>
                <option value="delete_user">Eliminar usuario</option>
                <option value="create_order">Crear pedido</option>
                <option value="update_order">Actualizar pedido</option>
                <option value="delete_order">Eliminar pedido</option>
              </select>

              <button
                (click)="loadAuditLogs()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Actualizar
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let log of filteredLogs" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{log.created_at | date:'short'}}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{getUserName(log.user_id)}}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getActionBadgeClass(log.action_type)">
                        {{getActionLabel(log.action_type)}}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {{formatActionDetails(log.action_details)}}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{log.ip_address || 'N/A'}}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="filteredLogs.length === 0" class="text-center py-12">
              <p class="text-gray-500">No se encontraron registros</p>
            </div>
          </div>

          <div *ngIf="activeTab === 'sessions'">
            <div class="mb-4 flex justify-end">
              <button
                (click)="loadActiveSessions()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Actualizar
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div *ngFor="let session of activeSessions" class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span class="text-sm font-medium text-gray-900">Sesión Activa</span>
                  </div>
                </div>

                <div class="space-y-2">
                  <div>
                    <span class="text-xs text-gray-500">Usuario:</span>
                    <p class="text-sm font-medium text-gray-900">{{getUserName(session.user_id)}}</p>
                  </div>

                  <div>
                    <span class="text-xs text-gray-500">Inicio de sesión:</span>
                    <p class="text-sm text-gray-700">{{session.session_start | date:'short'}}</p>
                  </div>

                  <div>
                    <span class="text-xs text-gray-500">Duración:</span>
                    <p class="text-sm text-gray-700">{{getSessionDuration(session.session_start)}}</p>
                  </div>

                  <div *ngIf="session.ip_address">
                    <span class="text-xs text-gray-500">IP:</span>
                    <p class="text-sm text-gray-700">{{session.ip_address}}</p>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="activeSessions.length === 0" class="text-center py-12">
              <p class="text-gray-500">No hay sesiones activas</p>
            </div>
          </div>

          <div *ngIf="activeTab === 'stats'">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div class="bg-blue-50 rounded-lg p-6">
                <div class="text-blue-600 text-sm font-medium mb-2">Total de Acciones</div>
                <div class="text-3xl font-bold text-blue-900">{{auditLogs.length}}</div>
              </div>

              <div class="bg-green-50 rounded-lg p-6">
                <div class="text-green-600 text-sm font-medium mb-2">Sesiones Activas</div>
                <div class="text-3xl font-bold text-green-900">{{activeSessions.length}}</div>
              </div>

              <div class="bg-purple-50 rounded-lg p-6">
                <div class="text-purple-600 text-sm font-medium mb-2">Usuarios Activos</div>
                <div class="text-3xl font-bold text-purple-900">{{getActiveUsersCount()}}</div>
              </div>

              <div class="bg-orange-50 rounded-lg p-6">
                <div class="text-orange-600 text-sm font-medium mb-2">Acciones Hoy</div>
                <div class="text-3xl font-bold text-orange-900">{{getTodayActionsCount()}}</div>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Acciones más Frecuentes</h3>
              <div class="space-y-3">
                <div *ngFor="let action of getTopActions()" class="flex items-center justify-between">
                  <div class="flex items-center flex-1">
                    <span class="text-sm text-gray-700 mr-4">{{getActionLabel(action.type)}}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full"
                        [style.width.%]="(action.count / auditLogs.length) * 100">
                      </div>
                    </div>
                  </div>
                  <span class="text-sm font-medium text-gray-900 ml-4">{{action.count}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  activeSessions: UserSession[] = [];
  users: any[] = [];

  activeTab: 'logs' | 'sessions' | 'stats' = 'logs';
  logSearchTerm: string = '';
  actionTypeFilter: string = '';

  actionLabels: Record<string, string> = {
    'login': 'Inicio de Sesión',
    'logout': 'Cierre de Sesión',
    'create_user': 'Crear Usuario',
    'update_user': 'Actualizar Usuario',
    'activate_user': 'Activar Usuario',
    'deactivate_user': 'Desactivar Usuario',
    'delete_user': 'Eliminar Usuario',
    'create_order': 'Crear Pedido',
    'update_order': 'Actualizar Pedido',
    'delete_order': 'Eliminar Pedido',
    'view_report': 'Ver Reporte',
    'export_data': 'Exportar Datos',
    'other': 'Otra Acción'
  };

  constructor(public authService: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.loadData();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async loadData() {
    await Promise.all([
      this.loadAuditLogs(),
      this.loadActiveSessions(),
      this.loadUsers()
    ]);
  }

  async loadAuditLogs() {
    this.auditLogs = await this.authService.getAuditLogs(500);
    this.filterLogs();
  }

  async loadActiveSessions() {
    this.activeSessions = await this.authService.getActiveSessions();
  }

  async loadUsers() {
    this.users = await this.authService.getAllUsers();
  }

  filterLogs() {
    this.filteredLogs = this.auditLogs.filter(log => {
      const matchesSearch = !this.logSearchTerm ||
        this.getUserName(log.user_id).toLowerCase().includes(this.logSearchTerm.toLowerCase()) ||
        this.getActionLabel(log.action_type).toLowerCase().includes(this.logSearchTerm.toLowerCase());

      const matchesActionType = !this.actionTypeFilter || log.action_type === this.actionTypeFilter;

      return matchesSearch && matchesActionType;
    });
  }

  getUserName(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.full_name : 'Usuario Desconocido';
  }

  getActionLabel(actionType: string): string {
    return this.actionLabels[actionType] || actionType;
  }

  getActionBadgeClass(actionType: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    const colorMap: Record<string, string> = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create_user': 'bg-blue-100 text-blue-800',
      'update_user': 'bg-yellow-100 text-yellow-800',
      'activate_user': 'bg-green-100 text-green-800',
      'deactivate_user': 'bg-orange-100 text-orange-800',
      'delete_user': 'bg-red-100 text-red-800',
      'create_order': 'bg-purple-100 text-purple-800',
      'update_order': 'bg-indigo-100 text-indigo-800',
      'delete_order': 'bg-red-100 text-red-800'
    };
    return `${baseClass} ${colorMap[actionType] || 'bg-gray-100 text-gray-800'}`;
  }

  formatActionDetails(details: any): string {
    if (!details || Object.keys(details).length === 0) {
      return 'Sin detalles';
    }
    return JSON.stringify(details).substring(0, 100);
  }

  getSessionDuration(startTime: Date): string {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getActiveUsersCount(): number {
    const uniqueUsers = new Set(this.activeSessions.map(s => s.user_id));
    return uniqueUsers.size;
  }

  getTodayActionsCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.auditLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= today;
    }).length;
  }

  getTopActions(): { type: string; count: number }[] {
    const actionCounts: Record<string, number> = {};

    this.auditLogs.forEach(log => {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
