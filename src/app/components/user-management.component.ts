import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User, UserRole } from '../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
              <button
                (click)="goToDashboard()"
                class="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Volver al Dashboard
              </button>
              <h2 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
            </div>
            <button
              (click)="showCreateModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              + Crear Usuario
            </button>
          </div>

          <div class="mb-6">
            <div class="flex gap-4">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="filterUsers()"
                placeholder="Buscar por nombre o email..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">

              <select
                [(ngModel)]="filterRole"
                (change)="filterUsers()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos los roles</option>
                <option *ngFor="let role of getAvailableRoles()" [value]="role.value">
                  {{role.label}}
                </option>
              </select>

              <select
                [(ngModel)]="filterStatus"
                (change)="filterUsers()"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre / Username
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centro Automotriz
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let user of filteredUsers" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{user.email}}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{user.full_name}}</div>
                    <div class="text-xs text-gray-500">{{ '@' + user.username }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getRoleBadgeClass(user.role)">
                      {{getRoleLabel(user.role)}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{{user.autocenter || '-'}}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="user.is_active ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800' : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'">
                      {{user.is_active ? 'Activo' : 'Inactivo'}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex gap-2">
                      <button
                        *ngIf="canManageUser(user)"
                        (click)="editUser(user)"
                        class="text-blue-600 hover:text-blue-900">
                        Editar
                      </button>
                      <button
                        *ngIf="canManageUser(user)"
                        (click)="toggleUserStatus(user)"
                        [class]="user.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'">
                        {{user.is_active ? 'Desactivar' : 'Activar'}}
                      </button>
                      <button
                        *ngIf="canManageUser(user) && authService.isSuperAdmin()"
                        (click)="deleteUser(user)"
                        class="text-red-600 hover:text-red-900">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="filteredUsers.length === 0" class="text-center py-12">
            <p class="text-gray-500">No se encontraron usuarios</p>
          </div>
        </div>
      </div>

      <div *ngIf="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
              {{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}}
            </h3>

            <form (ngSubmit)="saveUser()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  [(ngModel)]="formData.full_name"
                  name="full_name"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  [disabled]="!!editingUser"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100">
              </div>

              <div *ngIf="!editingUser">
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  [(ngModel)]="formData.password"
                  name="password"
                  required
                  minlength="6"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <p class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  [(ngModel)]="formData.role"
                  name="role"
                  (change)="onRoleChange()"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seleccionar rol...</option>
                  <option *ngFor="let role of getAvailableRoles()" [value]="role.value">
                    {{role.label}}
                  </option>
                </select>
              </div>

              <div *ngIf="requiresAutocenter()">
                <label class="block text-sm font-medium text-gray-700 mb-1">Centro Automotriz *</label>
                <select
                  [(ngModel)]="formData.autocenter"
                  name="autocenter"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Seleccionar Centro Automotriz...</option>
                  <option value="Insurgentes Taller Mecanico">Insurgentes Taller Mecanico</option>
                  <option value="Universidad Taller Mecanico">Universidad Taller Mecanico</option>
                  <option value="Satelite Taller Mecanico">Satelite Taller Mecanico</option>
                  <option value="Lindavista Taller Mecanico">Lindavista Taller Mecanico</option>
                  <option value="Monterrey Anahuac Taller Mecanico">Monterrey Anahuac Taller Mecanico</option>
                  <option value="Monterrey Centro Taller Mecanico">Monterrey Centro Taller Mecanico</option>
                  <option value="Guadalajara Centro Taller Mecanico">Guadalajara Centro Taller Mecanico</option>
                  <option value="Puebla Centro Taller Mecanico">Puebla Centro Taller Mecanico</option>
                  <option value="Cuernavaca Taller Mecanico">Cuernavaca Taller Mecanico</option>
                  <option value="Gomez Palacio Taller Mecanico">Gomez Palacio Taller Mecanico</option>
                  <option value="Leon Plaza Taller Mecanico">Leon Plaza Taller Mecanico</option>
                  <option value="Pachuca Outlet Taller Mecanico">Pachuca Outlet Taller Mecanico</option>
                  <option value="Celaya Taller Mecanico">Celaya Taller Mecanico</option>
                  <option value="Queretaro Plaza Taller Mecanico">Queretaro Plaza Taller Mecanico</option>
                  <option value="Neza (CD Jardin) Taller Mecanico">Neza (CD Jardin) Taller Mecanico</option>
                  <option value="Cuautitlan Izcalli Taller Mecanico">Cuautitlan Izcalli Taller Mecanico</option>
                </select>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  [disabled]="isLoading"
                  class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                  {{isLoading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}}
                </button>
                <button
                  type="button"
                  (click)="closeModal()"
                  class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                  Cancelar
                </button>
              </div>
            </form>

            <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {{errorMessage}}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  filterRole: string = '';
  filterStatus: string = '';

  showCreateModal: boolean = false;
  editingUser: User | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  formData: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole | '';
    autocenter: string;
  } = {
    full_name: '',
    email: '',
    password: '',
    role: '',
    autocenter: ''
  };

  roleLabels: Record<UserRole, string> = {
    'super_admin': 'Super Admin',
    'admin_corporativo': 'Admin Corporativo',
    'gerente': 'Gerente',
    'tecnico': 'Técnico',
    'asesor_tecnico': 'Asesor Técnico'
  };

  constructor(public authService: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async loadUsers() {
    this.users = await this.authService.getAllUsers();
    this.filterUsers();
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.filterRole || user.role === this.filterRole;

      const matchesStatus = !this.filterStatus ||
        (this.filterStatus === 'active' && user.is_active) ||
        (this.filterStatus === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  getAvailableRoles() {
    const managedRoles = [
      { value: 'admin_corporativo', label: 'Admin Corporativo' },
      { value: 'gerente', label: 'Gerente' },
      { value: 'tecnico', label: 'Técnico' },
      { value: 'asesor_tecnico', label: 'Asesor Técnico' }
    ];

    if (this.authService.isSuperAdmin()) {
      return managedRoles;
    } else if (this.authService.isAdminCorporativo()) {
      return managedRoles.filter(r => ['gerente', 'tecnico', 'asesor_tecnico'].includes(r.value));
    }

    return [];
  }

  getRoleLabel(role: UserRole): string {
    return this.roleLabels[role] || role;
  }

  getRoleBadgeClass(role: UserRole): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    const colorMap: Record<UserRole, string> = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'admin_corporativo': 'bg-indigo-100 text-indigo-800',
      'gerente': 'bg-blue-100 text-blue-800',
      'tecnico': 'bg-green-100 text-green-800',
      'asesor_tecnico': 'bg-yellow-100 text-yellow-800'
    };
    return `${baseClass} ${colorMap[role] || 'bg-gray-100 text-gray-800'}`;
  }

  canManageUser(user: User): boolean {
    return this.authService.canManageRole(user.role);
  }

  editUser(user: User) {
    this.editingUser = user;
    this.formData = {
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      autocenter: user.autocenter || ''
    };
    this.showCreateModal = true;
  }

  async saveUser() {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      if (this.editingUser) {
        const updateData: any = {
          full_name: this.formData.full_name,
          role: this.formData.role as UserRole
        };
        if (this.requiresAutocenter()) {
          updateData.autocenter = this.formData.autocenter;
        }
        const result = await this.authService.updateUser(this.editingUser.id, updateData);

        if (result.success) {
          await this.loadUsers();
          this.closeModal();
        } else {
          this.errorMessage = result.message || 'Error al actualizar usuario';
        }
      } else {
        if (!this.formData.role || !this.formData.password) {
          this.errorMessage = 'Por favor complete todos los campos';
          this.isLoading = false;
          return;
        }

        const userData: any = {
          email: this.formData.email,
          password: this.formData.password,
          full_name: this.formData.full_name,
          role: this.formData.role as UserRole
        };
        if (this.requiresAutocenter()) {
          userData.autocenter = this.formData.autocenter;
        }
        const result = await this.authService.createUser(userData);

        if (result.success) {
          await this.loadUsers();
          this.closeModal();
        } else {
          this.errorMessage = result.message || 'Error al crear usuario';
        }
      }
    } catch (error) {
      this.errorMessage = 'Error inesperado al guardar usuario';
      console.error('Save user error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleUserStatus(user: User) {
    if (!confirm(`¿Está seguro de ${user.is_active ? 'desactivar' : 'activar'} a ${user.full_name}?`)) {
      return;
    }

    const result = await this.authService.toggleUserStatus(user.id, !user.is_active);

    if (result.success) {
      await this.loadUsers();
    } else {
      alert(result.message || 'Error al cambiar estado del usuario');
    }
  }

  async deleteUser(user: User) {
    if (!confirm(`¿Está seguro de eliminar permanentemente a ${user.full_name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const result = await this.authService.deleteUser(user.id);

    if (result.success) {
      await this.loadUsers();
    } else {
      alert(result.message || 'Error al eliminar usuario');
    }
  }

  closeModal() {
    this.showCreateModal = false;
    this.editingUser = null;
    this.errorMessage = '';
    this.formData = {
      full_name: '',
      email: '',
      password: '',
      role: '',
      autocenter: ''
    };
  }

  requiresAutocenter(): boolean {
    return ['tecnico', 'gerente', 'asesor_tecnico'].includes(this.formData.role);
  }

  onRoleChange() {
    if (!this.requiresAutocenter()) {
      this.formData.autocenter = '';
    }
  }
}
