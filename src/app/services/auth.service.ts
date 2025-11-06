import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

export type UserRole = 'super_admin' | 'admin_corporativo' | 'gerente' | 'tecnico' | 'asesor_tecnico';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  autocenter?: string;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  created_by?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_start: Date;
  session_end?: Date;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private currentSessionId: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.loadUserFromStorage();
    this.setupAuthStateListener();
  }

  private setupAuthStateListener() {
    this.supabaseService.client.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.handleLogout();
        }
      })();
    });
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      const supabaseUrl = this.supabaseService.supabaseUrl;
      const supabaseKey = this.supabaseService.supabaseAnonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/login-with-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return { success: false, message: result.error || 'Usuario o contraseña incorrectos' };
      }

      if (!result.session || !result.user) {
        return { success: false, message: 'Error al autenticar usuario' };
      }

      await this.supabaseService.client.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      });

      const { data: profile, error: profileError } = await this.supabaseService.client
        .from('user_profiles')
        .select('*')
        .eq('id', result.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError || !profile) {
        await this.supabaseService.client.auth.signOut();
        return { success: false, message: 'Usuario inactivo o no encontrado' };
      }

      const user: User = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active,
        autocenter: profile.autocenter,
        last_login: profile.last_login,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        created_by: profile.created_by
      };

      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));

      await this.startSession();

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Error inesperado durante el login' };
    }
  }

  async loadUserProfile(userId: string): Promise<void> {
    const { data: profile } = await this.supabaseService.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      this.currentUser = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active,
        autocenter: profile.autocenter,
        last_login: profile.last_login,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        created_by: profile.created_by
      };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }

  private async startSession(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .rpc('start_user_session', {
          p_user_id: this.currentUser?.id,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });

      if (!error && data) {
        this.currentSessionId = data;
        localStorage.setItem('currentSessionId', data);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  private async endSession(): Promise<void> {
    if (this.currentSessionId) {
      try {
        await this.supabaseService.client
          .rpc('end_user_session', {
            p_session_id: this.currentSessionId
          });
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  }

  async logout() {
    await this.endSession();
    await this.supabaseService.client.auth.signOut();
    this.handleLogout();
  }

  private handleLogout() {
    this.currentUser = null;
    this.currentSessionId = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentSessionId');
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super_admin' && this.currentUser?.is_active === true;
  }

  isAdminCorporativo(): boolean {
    return this.currentUser?.role === 'admin_corporativo' && this.currentUser?.is_active === true;
  }

  isGerente(): boolean {
    return this.currentUser?.role === 'gerente' && this.currentUser?.is_active === true;
  }

  isTecnico(): boolean {
    return this.currentUser?.role === 'tecnico' && this.currentUser?.is_active === true;
  }

  isAsesorTecnico(): boolean {
    return this.currentUser?.role === 'asesor_tecnico' && this.currentUser?.is_active === true;
  }

  canManageUsers(): boolean {
    return this.isSuperAdmin() || this.isAdminCorporativo();
  }

  canViewAudit(): boolean {
    return this.isSuperAdmin();
  }

  canCreateOrders(): boolean {
    return this.isAuthenticated();
  }

  canViewReports(): boolean {
    return this.isGerente() || this.canManageUsers();
  }

  canAdvanceOrderStatus(): boolean {
    // Solo gerente, asesor técnico, admin corporativo y super admin pueden avanzar estados
    // Los técnicos NO pueden
    return this.isGerente() || this.isAsesorTecnico() || this.isAdminCorporativo() || this.isSuperAdmin();
  }

  canManageRole(targetRole: UserRole): boolean {
    if (this.isSuperAdmin()) return true;
    if (this.isAdminCorporativo()) {
      return ['gerente', 'tecnico', 'asesor_tecnico'].includes(targetRole);
    }
    return false;
  }

  async logAction(actionType: string, actionDetails: any = {}): Promise<void> {
    if (!this.currentUser) return;

    try {
      await this.supabaseService.client
        .rpc('log_audit_action', {
          p_user_id: this.currentUser.id,
          p_action_type: actionType,
          p_action_details: actionDetails,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  async createUser(userData: { email: string; password: string; full_name: string; role: UserRole; autocenter?: string }): Promise<{ success: boolean; message?: string; user?: any }> {
    if (!this.canManageUsers()) {
      return { success: false, message: 'No tienes permisos para crear usuarios' };
    }

    if (!this.canManageRole(userData.role)) {
      return { success: false, message: 'No tienes permisos para crear usuarios con este rol' };
    }

    try {
      const supabaseUrl = this.supabaseService.supabaseUrl;
      const supabaseKey = this.supabaseService.supabaseAnonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          autocenter: userData.autocenter,
          created_by: this.currentUser?.id
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return { success: false, message: result.error || 'Error al crear usuario' };
      }

      await this.logAction('create_user', { created_user_id: result.user.id, role: userData.role });

      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, message: error?.message || 'Error inesperado al crear usuario' };
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; message?: string }> {
    if (!this.canManageUsers()) {
      return { success: false, message: 'No tienes permisos para actualizar usuarios' };
    }

    try {
      const { error } = await this.supabaseService.client
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        return { success: false, message: 'Error al actualizar usuario' };
      }

      await this.logAction('update_user', { updated_user_id: userId, updates });

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: 'Error inesperado al actualizar usuario' };
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message?: string }> {
    const result = await this.updateUser(userId, { is_active: isActive });
    if (result.success) {
      await this.logAction(isActive ? 'activate_user' : 'deactivate_user', { user_id: userId });
    }
    return result;
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    if (!this.canManageUsers()) {
      return { success: false, message: 'No tienes permisos para eliminar usuarios' };
    }

    try {
      const { error } = await this.supabaseService.client.auth.admin.deleteUser(userId);

      if (error) {
        return { success: false, message: 'Error al eliminar usuario' };
      }

      await this.logAction('delete_user', { deleted_user_id: userId });

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Error inesperado al eliminar usuario' };
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    if (!this.canViewAudit()) return [];

    try {
      const { data, error } = await this.supabaseService.client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async getActiveSessions(): Promise<UserSession[]> {
    if (!this.canViewAudit()) return [];

    try {
      const { data, error } = await this.supabaseService.client
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('session_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  }
}
