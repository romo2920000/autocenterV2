/*
  # Crear tabla de ventas perdidas

  1. Nueva Tabla: lost_sales
    - Almacena información de servicios no autorizados
*/

CREATE TABLE IF NOT EXISTS lost_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text NOT NULL,
  description text,
  estimated_cost decimal(10, 2) DEFAULT 0,
  rejection_date timestamptz DEFAULT now(),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_sales_order_id ON lost_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_lost_sales_customer_id ON lost_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lost_sales_category ON lost_sales(category);
CREATE INDEX IF NOT EXISTS idx_lost_sales_rejection_date ON lost_sales(rejection_date DESC);

ALTER TABLE lost_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for lost_sales"
  ON lost_sales
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);