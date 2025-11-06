/*
  # Crear tabla de historial de servicios

  1. Nueva Tabla: service_history
    - id (uuid, primary key)
    - order_id (uuid, foreign key a orders)
    - vehicle_id (uuid, foreign key a vehicles)
    - customer_id (uuid, foreign key a customers)
    - service_date (timestamptz, fecha del servicio)
    - mileage_at_service (integer, kilometraje al momento del servicio)
    - services_performed (jsonb, servicios realizados)
    - products_used (jsonb, productos usados)
    - total_cost (decimal, costo total)
    - technician (text, técnico que realizó el servicio)
    - notes (text, notas del servicio)
    - created_at (timestamptz)

  2. Seguridad
    - Habilitar RLS
    - Políticas para acceso público
*/

CREATE TABLE IF NOT EXISTS service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  service_date timestamptz DEFAULT now(),
  mileage_at_service integer,
  services_performed jsonb DEFAULT '[]'::jsonb,
  products_used jsonb DEFAULT '[]'::jsonb,
  total_cost decimal(10, 2) DEFAULT 0,
  technician text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_history_vehicle_id ON service_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_history_customer_id ON service_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_history_order_id ON service_history(order_id);
CREATE INDEX IF NOT EXISTS idx_service_history_service_date ON service_history(service_date DESC);

ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to service_history"
  ON service_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to service_history"
  ON service_history FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to service_history"
  ON service_history FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from service_history"
  ON service_history FOR DELETE
  TO public
  USING (true);
