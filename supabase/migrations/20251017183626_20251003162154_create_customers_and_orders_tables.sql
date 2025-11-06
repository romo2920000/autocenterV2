/*
  # Sistema de Gestión de Clientes y Pedidos - Autoservicio

  1. Nuevas Tablas
    - `customers` (clientes)
    - `vehicles` (vehículos)
    - `orders` (pedidos)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para acceso público (anon role)
*/

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  telefono text NOT NULL,
  email text,
  direccion text,
  ciudad text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre_completo);

-- Crear tabla de vehículos
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  placas text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  anio text NOT NULL,
  color text,
  vin text,
  kilometraje_inicial integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para vehículos
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_placas ON vehicles(placas);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  tienda text NOT NULL,
  division text NOT NULL,
  productos jsonb DEFAULT '[]'::jsonb,
  servicios jsonb DEFAULT '[]'::jsonb,
  diagnostic jsonb,
  presupuesto decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendiente de Autorización',
  estado text,
  technician_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para pedidos
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_folio ON orders(folio);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas para customers
CREATE POLICY "Allow all operations on customers"
  ON customers
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Políticas para vehicles
CREATE POLICY "Allow all operations on vehicles"
  ON vehicles
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Políticas para orders
CREATE POLICY "Allow all operations on orders"
  ON orders
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();