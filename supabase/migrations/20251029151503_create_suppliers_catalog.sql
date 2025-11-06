/*
  # Crear catálogo de proveedores

  1. Nueva Tabla
    - `suppliers` - Catálogo de proveedores autorizados
      - `id` (uuid, primary key)
      - `nombre` (text, nombre del proveedor)
      - `rfc` (text, RFC del proveedor, único)
      - `email` (text, opcional)
      - `telefono` (text, opcional)
      - `direccion` (text, opcional)
      - `is_active` (boolean, si está activo)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Seguridad
    - Habilitar RLS
    - Permitir acceso público para lectura
    - Solo usuarios autenticados pueden modificar

  3. Datos Iniciales
    - HUGO ALEJANDRO BELMONT ROMO (BERH000529HF6)
    - MARIO ARTEAGA MARTINEZ (AEMM000517QK2)
*/

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rfc text UNIQUE NOT NULL,
  email text,
  telefono text,
  direccion text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_suppliers_rfc ON suppliers(rfc);
CREATE INDEX IF NOT EXISTS idx_suppliers_nombre ON suppliers(nombre);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Habilitar RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Enable read access for all users"
  ON suppliers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON suppliers
  FOR DELETE
  TO authenticated
  USING (true);

-- Insertar proveedores iniciales
INSERT INTO suppliers (nombre, rfc, is_active)
VALUES 
  ('HUGO ALEJANDRO BELMONT ROMO', 'BERH000529HF6', true),
  ('MARIO ARTEAGA MARTINEZ', 'AEMM000517QK2', true)
ON CONFLICT (rfc) DO NOTHING;
