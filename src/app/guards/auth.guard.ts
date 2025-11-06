import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as UserRole[] | undefined;
    const requiredPermission = route.data['permission'] as string | undefined;

    if (requiredRoles && requiredRoles.length > 0) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || !requiredRoles.includes(currentUser.role)) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    if (requiredPermission) {
      if (requiredPermission === 'manage_users' && !this.authService.canManageUsers()) {
        this.router.navigate(['/dashboard']);
        return false;
      }

      if (requiredPermission === 'view_audit' && !this.authService.canViewAudit()) {
        this.router.navigate(['/dashboard']);
        return false;
      }

      if (requiredPermission === 'create_orders' && !this.authService.canCreateOrders()) {
        this.router.navigate(['/dashboard']);
        return false;
      }

      if (requiredPermission === 'view_reports' && !this.authService.canViewReports()) {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }

    return true;
  }
}
