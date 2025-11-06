export type DiagnosticSeverity = 'urgent' | 'recommended' | 'good';

export interface DiagnosticItem {
  id: string;
  category: string;
  item: string;
  description: string;
  severity: DiagnosticSeverity;
  notes?: string;
  estimatedCost?: number;
  isAuthorized?: boolean;
  isRejected?: boolean;
  authorizationDate?: Date;
  rejectionReason?: string;
  // Campos para servicios del catálogo
  serviceSku?: string;
  serviceName?: string;
  servicePrice?: number;
}

export interface DiagnosticPart {
  id: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  precio: number;
  margen: number;
  porcentaje: number;
  severity: DiagnosticSeverity;
  relatedServiceId?: string; // ID del servicio relacionado
}

export interface VehicleDiagnostic {
  vehicleInfo: {
    plate?: string;
    brand?: string;
    model?: string;
    year?: string;
    mileage?: string;
    color?: string;
  };
  items: DiagnosticItem[];
  parts?: DiagnosticPart[];
  technicianName?: string;
  completedAt?: Date;
}

export interface DiagnosticCategory {
  id: string;
  name: string;
  icon: string;
}

export const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  { id: 'engine', name: 'Motor', icon: '🔧' },
  { id: 'transmission', name: 'Transmisión', icon: '⚙️' },
  { id: 'brakes', name: 'Frenos', icon: '🛑' },
  { id: 'suspension', name: 'Suspensión', icon: '🔩' },
  { id: 'electrical', name: 'Sistema Eléctrico', icon: '⚡' },
  { id: 'cooling', name: 'Sistema de Enfriamiento', icon: '❄️' },
  { id: 'tires', name: 'Llantas', icon: '🛞' },
  { id: 'fluids', name: 'Fluidos', icon: '💧' },
  { id: 'body', name: 'Carrocería', icon: '🚗' },
  { id: 'other', name: 'Otros', icon: '📋' },
];

export const DIAGNOSTIC_ITEMS_BY_CATEGORY: { [key: string]: string[] } = {
  engine: [
    'Nivel de aceite de motor',
    'Filtro de aceite',
    'Filtro de aire',
    'Bujías',
    'Correa de distribución',
    'Batería',
    'Ruidos anormales',
  ],
  transmission: [
    'Nivel de líquido de transmisión',
    'Cambios de velocidad',
    'Embrague (manual)',
    'Fugas',
  ],
  brakes: [
    'Pastillas de freno delanteras',
    'Pastillas de freno traseras',
    'Discos de freno',
    'Líquido de frenos',
    'Freno de mano',
  ],
  suspension: [
    'Amortiguadores',
    'Resortes',
    'Rótulas',
    'Terminales',
    'Brazos de suspensión',
  ],
  electrical: [
    'Luces delanteras',
    'Luces traseras',
    'Luces de freno',
    'Alternador',
    'Sistema de arranque',
    'Fusibles',
  ],
  cooling: [
    'Nivel de refrigerante',
    'Radiador',
    'Termostato',
    'Ventilador',
    'Mangueras',
  ],
  tires: [
    'Profundidad de banda',
    'Presión de aire',
    'Desgaste irregular',
    'Alineación',
    'Balanceo',
  ],
  fluids: [
    'Líquido de dirección asistida',
    'Líquido limpiaparabrisas',
    'Aceite de diferencial',
  ],
  body: [
    'Parabrisas',
    'Limpiaparabrisas',
    'Espejos',
    'Abolladuras/Rayones',
  ],
  other: [
    'Aire acondicionado',
    'Calefacción',
    'Sistema de escape',
    'Inspección general',
  ],
};

export function getSeverityColor(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 'urgent':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'recommended':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'good':
      return 'bg-green-100 border-green-300 text-green-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
}

export function getSeverityBadgeColor(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'recommended':
      return 'bg-yellow-500 text-white';
    case 'good':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function getSeverityLabel(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 'urgent':
      return 'Urgente';
    case 'recommended':
      return 'Recomendable';
    case 'good':
      return 'Bien';
    default:
      return 'Sin clasificar';
  }
}

export function getSeverityIcon(severity: DiagnosticSeverity): string {
  switch (severity) {
    case 'urgent':
      return '⚠️';
    case 'recommended':
      return '⚡';
    case 'good':
      return '✓';
    default:
      return '•';
  }
}
