import { Injectable } from '@angular/core';
import { AuthService, UserRole } from './auth.service';

export type OrderPhase =
  | 'diagnostico'           // Fase 1
  | 'autorizacion_cliente'  // Fase 2
  | 'cargar_xml'            // Fase 3
  | 'clasificar_productos'  // Fase 4
  | 'validar_productos'     // Fase 5
  | 'validacion_admin'      // Fase 5.5 (Admin corporativo/gerente)
  | 'validacion_pre_oc'     // Fase 6.5 (Validación antes de generar OC)
  | 'procesar_productos'    // Fase 6
  | 'generar_oc'            // Fase 7
  | 'entregar';             // Fase 8

export interface PhasePermissions {
  canView: boolean;
  canAdvance: boolean;
  canEdit: boolean;
  allowedRoles: UserRole[];
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderPermissionsService {

  constructor(private authService: AuthService) {}

  /**
   * Obtiene los permisos para una fase específica
   */
  getPhasePermissions(phase: OrderPhase): PhasePermissions {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return {
        canView: false,
        canAdvance: false,
        canEdit: false,
        allowedRoles: [],
        description: ''
      };
    }

    const role = user.role;
    const permissions = this.getPhaseConfig(phase);

    return {
      ...permissions,
      canView: this.canViewPhase(phase, role),
      canAdvance: permissions.allowedRoles.includes(role),
      canEdit: permissions.allowedRoles.includes(role)
    };
  }

  /**
   * Configuración de permisos por fase
   */
  private getPhaseConfig(phase: OrderPhase): Omit<PhasePermissions, 'canView' | 'canAdvance' | 'canEdit'> {
    const configs: Record<OrderPhase, Omit<PhasePermissions, 'canView' | 'canAdvance' | 'canEdit'>> = {
      'diagnostico': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente', 'asesor_tecnico', 'tecnico'],
        description: 'Crear diagnóstico inicial del vehículo'
      },
      'autorizacion_cliente': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente', 'asesor_tecnico', 'tecnico'],
        description: 'Cliente autoriza el presupuesto'
      },
      'cargar_xml': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente', 'asesor_tecnico'],
        description: 'Cargar XML de facturas'
      },
      'clasificar_productos': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente', 'asesor_tecnico'],
        description: 'Clasificar productos del XML'
      },
      'validar_productos': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente'],
        description: 'Validar productos clasificados'
      },
      'validacion_admin': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente'],
        description: 'Validación administrativa obligatoria'
      },
      'validacion_pre_oc': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente'],
        description: 'Doble chequeo antes de generar OC'
      },
      'procesar_productos': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente'],
        description: 'Procesar productos y generar SKUs'
      },
      'generar_oc': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente'],
        description: 'Generar orden de compra'
      },
      'entregar': {
        allowedRoles: ['super_admin', 'admin_corporativo', 'gerente', 'asesor_tecnico', 'tecnico'],
        description: 'Entregar orden al cliente'
      }
    };

    return configs[phase];
  }

  /**
   * Verifica si el usuario puede ver una fase
   */
  private canViewPhase(phase: OrderPhase, role: UserRole): boolean {
    // Super admin puede ver todo
    if (role === 'super_admin') return true;

    // Admin corporativo y gerente pueden ver todo
    if (role === 'admin_corporativo' || role === 'gerente') return true;

    // Otros roles pueden ver según la fase
    const viewablePhases: Record<UserRole, OrderPhase[]> = {
      'super_admin': [] as OrderPhase[], // Ya retorna true arriba
      'admin_corporativo': [] as OrderPhase[], // Ya retorna true arriba
      'gerente': [] as OrderPhase[], // Ya retorna true arriba
      'asesor_tecnico': [
        'diagnostico',
        'autorizacion_cliente',
        'cargar_xml',
        'clasificar_productos',
        'entregar'
      ],
      'tecnico': [
        'diagnostico',
        'autorizacion_cliente',
        'entregar'
      ]
    };

    return viewablePhases[role]?.includes(phase) || false;
  }

  /**
   * Verifica si el usuario puede avanzar a la siguiente fase
   */
  canAdvanceToNextPhase(currentPhase: OrderPhase, orderStatus: string, adminValidationStatus?: string): boolean {
    const permissions = this.getPhasePermissions(currentPhase);

    // Debe tener permisos para avanzar
    if (!permissions.canAdvance) return false;

    // Validaciones especiales según la fase
    if (currentPhase === 'validar_productos' && adminValidationStatus !== 'approved') {
      // No puede avanzar si el admin no ha aprobado
      return false;
    }

    if (currentPhase === 'validacion_pre_oc' && orderStatus !== 'pre_oc_validated') {
      // No puede generar OC sin validación previa
      return false;
    }

    return true;
  }

  /**
   * Obtiene el nombre de la siguiente fase
   */
  getNextPhase(currentPhase: OrderPhase): OrderPhase | null {
    const phaseFlow: OrderPhase[] = [
      'diagnostico',
      'autorizacion_cliente',
      'cargar_xml',
      'clasificar_productos',
      'validar_productos',
      'validacion_admin',
      'procesar_productos',
      'validacion_pre_oc',
      'generar_oc',
      'entregar'
    ];

    const currentIndex = phaseFlow.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === phaseFlow.length - 1) {
      return null;
    }

    return phaseFlow[currentIndex + 1];
  }

  /**
   * Mapea el status de la orden a una fase
   */
  getPhaseFromStatus(status: string): OrderPhase {
    const statusToPhase: Record<string, OrderPhase> = {
      'Nuevo': 'diagnostico',
      'En Diagnóstico': 'diagnostico',
      'Presupuesto Generado': 'autorizacion_cliente',
      'Autorización Enviada': 'autorizacion_cliente',
      'Parcialmente Autorizado': 'cargar_xml',
      'Autorizado': 'cargar_xml',
      'XML Cargado': 'clasificar_productos',
      'Productos Clasificados': 'validar_productos',
      'Productos Validados': 'validacion_admin',
      'Pendiente Validación Admin': 'validacion_admin',
      'Aprobado por Admin': 'procesar_productos',
      'Productos Procesados': 'validacion_pre_oc',
      'Pre-OC Validado': 'generar_oc',
      'OC Generada': 'entregar',
      'Entregado': 'entregar',
      'Rechazado por Admin': 'validar_productos'
    };

    return statusToPhase[status] || 'diagnostico';
  }

  /**
   * Obtiene los roles permitidos para una fase
   */
  getAllowedRolesForPhase(phase: OrderPhase): UserRole[] {
    return this.getPhaseConfig(phase).allowedRoles;
  }

  /**
   * Verifica si el usuario actual puede realizar una acción en una fase
   */
  canPerformAction(phase: OrderPhase, action: 'view' | 'edit' | 'advance'): boolean {
    const permissions = this.getPhasePermissions(phase);

    switch (action) {
      case 'view':
        return permissions.canView;
      case 'edit':
        return permissions.canEdit;
      case 'advance':
        return permissions.canAdvance;
      default:
        return false;
    }
  }

  /**
   * Obtiene mensaje de error si no tiene permisos
   */
  getPermissionDeniedMessage(phase: OrderPhase, action: 'view' | 'edit' | 'advance'): string {
    const config = this.getPhaseConfig(phase);
    const rolesString = config.allowedRoles.join(', ');

    const messages = {
      view: `No tienes permisos para ver esta fase. Roles permitidos: ${rolesString}`,
      edit: `No tienes permisos para editar en esta fase. Roles permitidos: ${rolesString}`,
      advance: `No tienes permisos para avanzar esta fase. Roles permitidos: ${rolesString}`
    };

    return messages[action];
  }

  /**
   * Verifica si una orden necesita validación admin
   */
  needsAdminValidation(status: string, adminValidationStatus?: string): boolean {
    return status === 'Productos Validados' &&
           (!adminValidationStatus || adminValidationStatus === 'pending');
  }

  /**
   * Verifica si una orden necesita validación pre-OC
   */
  needsPreOCValidation(status: string): boolean {
    return status === 'Productos Procesados';
  }

  /**
   * Obtiene el label descriptivo de una fase
   */
  getPhaseLabel(phase: OrderPhase): string {
    const labels: Record<OrderPhase, string> = {
      'diagnostico': 'Fase 1: Diagnóstico',
      'autorizacion_cliente': 'Fase 2: Autorización Cliente',
      'cargar_xml': 'Fase 3: Cargar XML',
      'clasificar_productos': 'Fase 4: Clasificar Productos',
      'validar_productos': 'Fase 5: Validar Productos',
      'validacion_admin': 'Fase 5.5: Validación Admin',
      'procesar_productos': 'Fase 6: Procesar Productos',
      'validacion_pre_oc': 'Fase 6.5: Validación Pre-OC',
      'generar_oc': 'Fase 7: Generar OC',
      'entregar': 'Fase 8: Entregar'
    };

    return labels[phase];
  }
}
