export interface Customer {
  id?: string;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
  rfc?: string;
  razon_social?: string;
  direccion?: string;
  colonia?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  notas?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Vehicle {
  id?: string;
  customer_id: string;
  placas: string;
  marca: string;
  modelo: string;
  anio: string;
  color?: string;
  vin?: string;
  numero_serie?: string;
  kilometraje_inicial?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

export interface CustomerSearchResult {
  customer: Customer;
  vehicles: Vehicle[];
  ordersCount: number;
  lastOrderDate?: Date;
}
