import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-autoservicio-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autoservicio-login.component.html',
  styleUrls: ['./autoservicio-login.component.css']
})
export class AutoservicioLoginComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  tipoUsuario: string = 'tecnico';
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  tiposUsuario = [
    { value: 'admin_corporativo', text: 'Admin Corporativo' },
    { value: 'gerente', text: 'Gerente' },
    { value: 'tecnico', text: 'Técnico' },
    { value: 'asesor_tecnico', text: 'Asesor Técnico' }
  ];

  goBack() {
    this.router.navigate(['/']);
  }

  onTipoUsuarioChange() {
    this.errorMessage = '';
  }

  async onLogin() {
    this.errorMessage = '';

    if (!this.username.trim()) {
      this.errorMessage = 'Por favor ingrese su usuario';
      return;
    }

    if (!this.password.trim()) {
      this.errorMessage = 'Por favor ingrese su contraseña';
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.authService.login(this.username, this.password);

      if (result.success && result.user) {
        if (result.user.role === this.tipoUsuario || result.user.role === 'super_admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = `Este usuario tiene rol de ${this.getRoleLabel(result.user.role)}, pero seleccionaste ${this.getRoleLabel(this.tipoUsuario as any)}`;
          await this.authService.logout();
        }
      } else {
        this.errorMessage = result.message || 'Usuario o contraseña incorrectos';
      }
    } catch (error) {
      console.error('Error during login:', error);
      this.errorMessage = 'Error inesperado al iniciar sesión';
    } finally {
      this.isLoading = false;
    }
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'super_admin': 'Super Admin',
      'admin_corporativo': 'Admin Corporativo',
      'gerente': 'Gerente',
      'tecnico': 'Técnico',
      'asesor_tecnico': 'Asesor Técnico'
    };
    return labels[role] || role;
  }
}
