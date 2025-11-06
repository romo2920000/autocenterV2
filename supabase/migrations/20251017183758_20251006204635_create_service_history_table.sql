/*
  # Crear tabla de historial de servicios

  1. Nueva Tabla: service_history
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

CREATE POLICY "Enable all for service_history"
  ON service_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);