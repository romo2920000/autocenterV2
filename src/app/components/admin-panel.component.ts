import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';
import { CustomerService } from '../services/customer.service';

interface Provider {
  id?: string;
  nombre: string;
  rfc: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto_nombre?: string;
  contacto_telefono?: string;
  ciudad?: string;
  codigo_postal?: string;
  notas?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'users' | 'providers' | 'orders' | 'stats' = 'users';

  users: User[] = [];
  providers: Provider[] = [];
  orders: any[] = [];

  showUserModal = false;
  showProviderModal = false;
  showOrderDeleteConfirm = false;

  editingUser: any = null;
  editingProvider: any = null;
  orderToDelete: any = null;

  newUser: any = {
    password: '',
    full_name: '',
    role: 'tecnico',
    email: '',
    is_active: true
  };

  newProvider: Provider = {
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
    contacto_nombre: '',
    contacto_telefono: '',
    ciudad: '',
    codigo_postal: '',
    notas: '',
    is_active: true
  };

  stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalProviders: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  };

  constructor(
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private customerService: CustomerService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (!this.authService.canManageUsers()) {
      alert('Acceso denegado. Solo administradores pueden acceder.');
      this.router.navigate(['/dashboard']);
      return;
    }

    await this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.loadUsers(),
      this.loadProviders(),
      this.loadOrders()
    ]);
    this.calculateStats();
  }

  async loadUsers() {
    try {
      this.users = await this.authService.getAllUsers();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  async loadProviders() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      this.providers = data || [];
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }

  async loadOrders() {
    try {
      this.orders = await this.customerService.getAllOrders();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  calculateStats() {
    this.stats.totalUsers = this.users.length;
    this.stats.activeUsers = this.users.filter(u => u.is_active).length;
    this.stats.totalProviders = this.providers.length;
    this.stats.totalOrders = this.orders.length;
    this.stats.pendingOrders = this.orders.filter(o =>
      o.status === 'Pendiente de Autorización' || o.status === 'Autorizado'
    ).length;
    this.stats.completedOrders = this.orders.filter(o =>
      o.status === 'Completado' || o.status === 'Entregado'
    ).length;
  }

  openCreateUserModal() {
    this.editingUser = null;
    this.newUser = {
      password: '',
      full_name: '',
      role: 'tecnico',
      email: '',
      is_active: true
    };
    this.showUserModal = true;
  }

  openEditUserModal(user: any) {
    this.editingUser = user;
    this.newUser = { ...user, password: '' };
    this.showUserModal = true;
  }

  async saveUser() {
    try {
      if (this.editingUser) {
        const result = await this.authService.updateUser(this.editingUser.id, {
          full_name: this.newUser.full_name,
          role: this.newUser.role,
          is_active: this.newUser.is_active
        });

        if (!result.success) {
          throw new Error(result.message);
        }
        alert('Usuario actualizado exitosamente');
      } else {
        const result = await this.authService.createUser({
          email: this.newUser.email,
          password: this.newUser.password,
          full_name: this.newUser.full_name,
          role: this.newUser.role
        });

        if (!result.success) {
          throw new Error(result.message);
        }
        alert('Usuario creado exitosamente');
      }

      this.showUserModal = false;
      await this.loadUsers();
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      alert('Error al guardar usuario: ' + error.message);
    }
  }

  async deleteUser(user: any) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el usuario "${user.full_name}"?`)) {
      return;
    }

    try {
      const result = await this.authService.deleteUser(user.id);
      if (!result.success) {
        throw new Error(result.message);
      }
      alert('Usuario eliminado exitosamente');
      await this.loadUsers();
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar usuario: ' + error.message);
    }
  }

  async toggleUserActive(user: any) {
    try {
      const result = await this.authService.toggleUserStatus(user.id, !user.is_active);
      if (!result.success) {
        throw new Error(result.message);
      }
      await this.loadUsers();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar estado del usuario');
    }
  }

  openCreateProviderModal() {
    this.editingProvider = null;
    this.newProvider = {
      nombre: '',
      rfc: '',
      email: '',
      telefono: '',
      direccion: '',
      contacto_nombre: '',
      contacto_telefono: '',
      ciudad: '',
      codigo_postal: '',
      notas: '',
      is_active: true
    };
    this.showProviderModal = true;
  }

  openEditProviderModal(provider: Provider) {
    this.editingProvider = provider;
    this.newProvider = { ...provider };
    this.showProviderModal = true;
  }

  async saveProvider() {
    try {
      if (this.editingProvider) {
        const { error } = await this.supabaseService.client
          .from('proveedores')
          .update({
            ...this.newProvider,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.editingProvider.id);

        if (error) throw error;
        alert('Proveedor actualizado exitosamente');
      } else {
        const { error } = await this.supabaseService.client
          .from('proveedores')
          .insert([this.newProvider]);

        if (error) throw error;
        alert('Proveedor creado exitosamente');
      }

      this.showProviderModal = false;
      await this.loadProviders();
    } catch (error: any) {
      console.error('Error guardando proveedor:', error);
      alert('Error al guardar proveedor: ' + error.message);
    }
  }

  async deleteProvider(provider: Provider) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el proveedor "${provider.nombre}"?`)) {
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('proveedores')
        .delete()
        .eq('id', provider.id);

      if (error) throw error;
      alert('Proveedor eliminado exitosamente');
      await this.loadProviders();
    } catch (error: any) {
      console.error('Error eliminando proveedor:', error);
      alert('Error al eliminar proveedor: ' + error.message);
    }
  }

  async toggleProviderActive(provider: Provider) {
    try {
      const { error } = await this.supabaseService.client
        .from('proveedores')
        .update({
          is_active: !provider.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', provider.id);

      if (error) throw error;
      await this.loadProviders();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar estado del proveedor');
    }
  }

  confirmDeleteOrder(order: any) {
    this.orderToDelete = order;
    this.showOrderDeleteConfirm = true;
  }

  async deleteOrder() {
    if (!this.orderToDelete) return;

    try {
      const { error } = await this.supabaseService.client
        .from('orders')
        .delete()
        .eq('id', this.orderToDelete.id);

      if (error) throw error;
      alert('Pedido eliminado exitosamente');
      this.showOrderDeleteConfirm = false;
      this.orderToDelete = null;
      await this.loadOrders();
      this.calculateStats();
    } catch (error: any) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar pedido: ' + error.message);
    }
  }

  getRoleLabel(role: string): string {
    const roles: any = {
      'super_admin': 'Super Admin',
      'admin_corporativo': 'Admin Corporativo',
      'gerente': 'Gerente',
      'tecnico': 'Técnico',
      'asesor_tecnico': 'Asesor Técnico'
    };
    return roles[role] || role;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'Pendiente de Autorización': 'bg-yellow-100 text-yellow-800',
      'Autorizado': 'bg-green-100 text-green-800',
      'Procesando XML': 'bg-blue-100 text-blue-800',
      'Pendiente de Validación de Productos': 'bg-orange-100 text-orange-800',
      'Completado': 'bg-gray-100 text-gray-800',
      'Entregado': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
