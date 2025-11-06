export interface ServiceDefinition {
  sku: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioBase: number;
  precioConIva: number;
}

export const SERVICE_CATEGORIES = [
  'AFINACION',
  'BATERIAS Y SISTEMA DE CARGA',
  'FRENOS',
  'GARANTIAS',
  'LLANTAS, ALINEACION Y BALANCEO',
  'LUBRICACION',
  'SISTEMA DE ENFRIAMIENTO',
  'SUSPENSION',
  'PAQUETES',
  'MOTOR',
  'DIAGNOSTICO',
  'SERVICIOS EXTERNOS',
  'SERVICIOS INTERNOS',
  'SERVICIOS PARA LLANTAS VENDIDAS EN TIENDAS SIN AUTO CENTERS',
  'SERVICIOS CON ACEITE QUAKER STATE'
];

export const PREDEFINED_SERVICES: ServiceDefinition[] = [
  {
    sku: '09996026',
    nombre: 'AFINACION CARBURADOR',
    descripcion: 'Limpieza de Carburador, cambiar bujías, filtro de aire, filtro de gasolina, condensador, platinos, inspección y ajustes con scanner, cambiar bujías, filtro de aire, filtro de gasolina, limpiar cuerpo de aceleración.',
    categoria: 'AFINACION',
    precioBase: 558.50,
    precioConIva: 647.26
  },
  {
    sku: '09996027',
    nombre: 'AFINACION FUEL INJECTION 4 CILINDROS',
    descripcion: 'Cambiar bujías, filtro de aire, filtro de gasolina, limpiar cuerpo de aceleración, inspección y ajustes con scanner de 4 cilindros.',
    categoria: 'AFINACION',
    precioBase: 1044.79,
    precioConIva: 1211.96
  },
  {
    sku: '09996028',
    nombre: 'AFINACION FUEL INJECTION 6 CILINDROS',
    descripcion: 'Cambiar bujías, filtro de aire, filtro de gasolina, limpiar cuerpo de aceleración, inspección y ajustes con scanner de 6 cilindros.',
    categoria: 'AFINACION',
    precioBase: 1044.79,
    precioConIva: 1211.96
  },
  {
    sku: '10001234',
    nombre: 'CAMBIO DE BATERIA',
    descripcion: 'Cambio de batería del vehículo, incluye revisión del sistema de carga.',
    categoria: 'BATERIAS Y SISTEMA DE CARGA',
    precioBase: 250.00,
    precioConIva: 290.00
  },
  {
    sku: '10001235',
    nombre: 'REVISION SISTEMA DE CARGA',
    descripcion: 'Revisión completa del sistema de carga, alternador y batería.',
    categoria: 'BATERIAS Y SISTEMA DE CARGA',
    precioBase: 150.00,
    precioConIva: 174.00
  },
  {
    sku: '10002234',
    nombre: 'CAMBIO DE BALATAS DELANTERAS',
    descripcion: 'Cambio de balatas/pastillas de freno delanteras, incluye limpieza y revisión.',
    categoria: 'FRENOS',
    precioBase: 400.00,
    precioConIva: 464.00
  },
  {
    sku: '10002235',
    nombre: 'CAMBIO DE BALATAS TRASERAS',
    descripcion: 'Cambio de balatas/pastillas de freno traseras, incluye limpieza y revisión.',
    categoria: 'FRENOS',
    precioBase: 380.00,
    precioConIva: 440.80
  },
  {
    sku: '10002236',
    nombre: 'CAMBIO DE DISCOS DE FRENO',
    descripcion: 'Cambio de discos de freno delanteros o traseros.',
    categoria: 'FRENOS',
    precioBase: 600.00,
    precioConIva: 696.00
  },
  {
    sku: '10003234',
    nombre: 'ALINEACION',
    descripcion: 'Alineación de las 4 ruedas del vehículo.',
    categoria: 'LLANTAS, ALINEACION Y BALANCEO',
    precioBase: 300.00,
    precioConIva: 348.00
  },
  {
    sku: '10003235',
    nombre: 'BALANCEO',
    descripcion: 'Balanceo de las 4 llantas del vehículo.',
    categoria: 'LLANTAS, ALINEACION Y BALANCEO',
    precioBase: 200.00,
    precioConIva: 232.00
  },
  {
    sku: '10003236',
    nombre: 'ROTACION DE LLANTAS',
    descripcion: 'Rotación de las 4 llantas del vehículo.',
    categoria: 'LLANTAS, ALINEACION Y BALANCEO',
    precioBase: 100.00,
    precioConIva: 116.00
  },
  {
    sku: '10004234',
    nombre: 'CAMBIO DE ACEITE Y FILTRO',
    descripcion: 'Cambio de aceite de motor y filtro de aceite.',
    categoria: 'LUBRICACION',
    precioBase: 250.00,
    precioConIva: 290.00
  },
  {
    sku: '10004235',
    nombre: 'CAMBIO DE ACEITE SINTETICO',
    descripcion: 'Cambio de aceite sintético de motor y filtro de aceite.',
    categoria: 'LUBRICACION',
    precioBase: 350.00,
    precioConIva: 406.00
  },
  {
    sku: '10005234',
    nombre: 'CAMBIO DE REFRIGERANTE',
    descripcion: 'Cambio de refrigerante/anticongelante del sistema de enfriamiento.',
    categoria: 'SISTEMA DE ENFRIAMIENTO',
    precioBase: 400.00,
    precioConIva: 464.00
  },
  {
    sku: '10005235',
    nombre: 'REVISION SISTEMA DE ENFRIAMIENTO',
    descripcion: 'Revisión completa del sistema de enfriamiento, radiador y mangueras.',
    categoria: 'SISTEMA DE ENFRIAMIENTO',
    precioBase: 200.00,
    precioConIva: 232.00
  },
  {
    sku: '10006234',
    nombre: 'CAMBIO DE AMORTIGUADORES',
    descripcion: 'Cambio de amortiguadores delanteros o traseros.',
    categoria: 'SUSPENSION',
    precioBase: 800.00,
    precioConIva: 928.00
  },
  {
    sku: '10006235',
    nombre: 'CAMBIO DE ROTULAS',
    descripcion: 'Cambio de rótulas de suspensión.',
    categoria: 'SUSPENSION',
    precioBase: 600.00,
    precioConIva: 696.00
  },
  {
    sku: '10007234',
    nombre: 'DIAGNOSTICO CON SCANNER',
    descripcion: 'Diagnóstico completo del vehículo con scanner automotriz.',
    categoria: 'DIAGNOSTICO',
    precioBase: 250.00,
    precioConIva: 290.00
  },
  {
    sku: '10007235',
    nombre: 'DIAGNOSTICO ELECTRICO',
    descripcion: 'Diagnóstico del sistema eléctrico del vehículo.',
    categoria: 'DIAGNOSTICO',
    precioBase: 300.00,
    precioConIva: 348.00
  },
  {
    sku: '10008234',
    nombre: 'PAQUETE MANTENIMIENTO BASICO',
    descripcion: 'Incluye cambio de aceite, filtro, revisión de frenos y suspensión.',
    categoria: 'PAQUETES',
    precioBase: 800.00,
    precioConIva: 928.00
  },
  {
    sku: '10008235',
    nombre: 'PAQUETE MANTENIMIENTO COMPLETO',
    descripcion: 'Incluye afinación, cambio de aceite, filtros, revisión completa y diagnóstico.',
    categoria: 'PAQUETES',
    precioBase: 1500.00,
    precioConIva: 1740.00
  }
];

export function getServicesByCategory(category: string): ServiceDefinition[] {
  return PREDEFINED_SERVICES.filter(service => service.categoria === category);
}

export function getServiceBySku(sku: string): ServiceDefinition | undefined {
  return PREDEFINED_SERVICES.find(service => service.sku === sku);
}

export function getAllServices(): ServiceDefinition[] {
  return PREDEFINED_SERVICES;
}
