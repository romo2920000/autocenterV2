/*
  # Sistema de Gestión de Clientes y Pedidos - Autoservicio

  1. Nuevas Tablas
    - `customers` (clientes)
      - `id` (uuid, primary key)
      - `nombre_completo` (text) - Nombre completo del cliente
      - `telefono` (text) - Número de teléfono
      - `email` (text, opcional) - Correo electrónico
      - `direccion` (text, opcional) - Dirección del cliente
      - `ciudad` (text, opcional) - Ciudad
      - `notas` (text, opcional) - Notas adicionales del cliente
      - `created_at` (timestamptz) - Fecha de registro
      - `updated_at` (timestamptz) - Última actualización

    - `vehicles` (vehículos)
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key) - ID del cliente propietario
      - `placas` (text) - Placas del vehículo
      - `marca` (text) - Marca del vehículo
      - `modelo` (text) - Modelo del vehículo
      - `anio` (text) - Año del vehículo
      - `color` (text, opcional) - Color del vehículo
      - `vin` (text, opcional) - Número de identificación vehicular
      - `kilometraje_inicial` (integer, opcional) - Kilometraje al registrar
      - `created_at` (timestamptz) - Fecha de registro
      - `updated_at` (timestamptz) - Última actualización

    - `orders` (pedidos)
      - `id` (uuid, primary key)
      - `folio` (text, unique) - Folio único del pedido
      - `customer_id` (uuid, foreign key) - ID del cliente
      - `vehicle_id` (uuid, foreign key, opcional) - ID del vehículo
      - `tienda` (text) - Sucursal donde se realizó
      - `division` (text) - División del servicio
      - `productos` (jsonb) - Array de productos
      - `servicios` (jsonb) - Array de servicios
      - `diagnostic` (jsonb, opcional) - Diagnóstico del vehículo
      - `presupuesto` (decimal) - Total del pedido
      - `status` (text) - Estado del pedido
      - `estado` (text, opcional) - Estado adicional
      - `technician_name` (text, opcional) - Nombre del técnico
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Última actualización

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
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

-- Políticas para customers (por ahora permitir todo para desarrollo, luego ajustar según necesidades)
CREATE POLICY "Allow all operations on customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para vehicles
CREATE POLICY "Allow all operations on vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para orders
CREATE POLICY "Allow all operations on orders"
  ON orders
  FOR ALL
  TO authenticated
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
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
