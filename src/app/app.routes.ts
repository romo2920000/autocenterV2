import { Routes } from '@angular/router';
import { AutoservicioLoginComponent } from './components/autoservicio-login.component';
import { DashboardComponent } from './components/dashboard.component';
import { AdminPanelComponent } from './components/admin-panel.component';
import { UserManagementComponent } from './components/user-management.component';
import { AuditLogsComponent } from './components/audit-logs.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard.component';
import { AdvancedAuditComponent } from './components/advanced-audit.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: AutoservicioLoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'autoservicio-dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { permission: 'manage_users' }
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [AuthGuard],
    data: { permission: 'view_analytics' }
  },
  {
    path: 'audit',
    component: AdvancedAuditComponent,
    canActivate: [AuthGuard],
    data: { permission: 'super_admin' }
  },
  {
    path: 'audit-logs',
    component: AuditLogsComponent,
    canActivate: [AuthGuard],
    data: { permission: 'view_audit' }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
