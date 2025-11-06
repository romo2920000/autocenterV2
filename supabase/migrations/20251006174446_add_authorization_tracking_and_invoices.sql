/*
  # Sistema de Autorización de Servicios y Seguimiento de Ventas Perdidas

  1. Nuevas Tablas
    - `diagnostic_items_authorization` (autorización de items de diagnóstico)
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key) - ID del pedido
      - `diagnostic_item_id` (text) - ID del item de diagnóstico
      - `item_name` (text) - Nombre del item diagnosticado
      - `category` (text) - Categoría del diagnóstico
      - `description` (text) - Descripción del problema/recomendación
      - `severity` (text) - Nivel de urgencia (urgent, recommended, good)
      - `estimated_cost` (decimal) - Costo estimado del servicio/reparación
      - `is_authorized` (boolean) - Si fue autorizado por el cliente
      - `authorization_date` (timestamptz) - Fecha de autorización/rechazo
      - `rejection_reason` (text, opcional) - Razón del rechazo si aplica
      - `notes` (text, opcional) - Notas adicionales
      - `created_at` (timestamptz) - Fecha de creación
      - `updated_at` (timestamptz) - Última actualización

    - `order_invoices` (facturas de pedidos)
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key) - ID del pedido
      - `invoice_folio` (text) - Folio de la factura
      - `xml_content` (text, opcional) - Contenido del XML de la factura
      - `xml_data` (jsonb) - Datos parseados del XML
      - `total_amount` (decimal) - Monto total de la factura
      - `items` (jsonb) - Items de la factura
      - `upload_date` (timestamptz) - Fecha de carga
      - `created_at` (timestamptz) - Fecha de creación

  2. Modificaciones a Tablas Existentes
    - Agregar campos a `orders` para rastrear el estado de autorización

  3. Seguridad
    - Habilitar RLS en todas las nuevas tablas
    - Políticas para acceso público temporal (después ajustar según autenticación)

  4. Índices
    - Índices para búsquedas y reportes eficientes de ventas perdidas
*/

-- Crear tabla de autorización de items de diagnóstico
CREATE TABLE IF NOT EXISTS diagnostic_items_authorization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  diagnostic_item_id text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'recommended',
  estimated_cost decimal(10, 2) NOT NULL DEFAULT 0,
  is_authorized boolean DEFAULT false,
  authorization_date timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para diagnostic_items_authorization
CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_order_id ON diagnostic_items_authorization(order_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_authorized ON diagnostic_items_authorization(is_authorized);
CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_severity ON diagnostic_items_authorization(severity);
CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_category ON diagnostic_items_authorization(category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_created_at ON diagnostic_items_authorization(created_at DESC);

-- Crear tabla de facturas de pedidos
CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_folio text NOT NULL,
  xml_content text,
  xml_data jsonb DEFAULT '{}'::jsonb,
  total_amount decimal(10, 2) NOT NULL DEFAULT 0,
  items jsonb DEFAULT '[]'::jsonb,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Crear índices para order_invoices
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON order_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_folio ON order_invoices(invoice_folio);
CREATE INDEX IF NOT EXISTS idx_invoices_upload_date ON order_invoices(upload_date DESC);

-- Agregar campos a orders para rastrear autorización
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'authorization_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN authorization_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'authorization_sent_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN authorization_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'authorization_completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN authorization_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_authorized_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN total_authorized_amount decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_rejected_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN total_rejected_amount decimal(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE diagnostic_items_authorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para diagnostic_items_authorization
CREATE POLICY "Allow public read on diagnostic_items_authorization"
  ON diagnostic_items_authorization
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on diagnostic_items_authorization"
  ON diagnostic_items_authorization
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on diagnostic_items_authorization"
  ON diagnostic_items_authorization
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on diagnostic_items_authorization"
  ON diagnostic_items_authorization
  FOR DELETE
  USING (true);

-- Políticas para order_invoices
CREATE POLICY "Allow public read on order_invoices"
  ON order_invoices
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on order_invoices"
  ON order_invoices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on order_invoices"
  ON order_invoices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on order_invoices"
  ON order_invoices
  FOR DELETE
  USING (true);

-- Trigger para actualizar updated_at en diagnostic_items_authorization
CREATE TRIGGER update_diagnostic_auth_updated_at
  BEFORE UPDATE ON diagnostic_items_authorization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear vista para reportes de ventas perdidas
CREATE OR REPLACE VIEW lost_sales_report AS
SELECT 
  dia.category,
  dia.item_name,
  dia.severity,
  COUNT(*) as times_offered,
  SUM(CASE WHEN dia.is_authorized = false THEN 1 ELSE 0 END) as times_rejected,
  SUM(CASE WHEN dia.is_authorized = true THEN 1 ELSE 0 END) as times_accepted,
  ROUND(
    (SUM(CASE WHEN dia.is_authorized = false THEN 1 ELSE 0 END)::decimal / COUNT(*)::decimal * 100), 
    2
  ) as rejection_rate,
  SUM(CASE WHEN dia.is_authorized = false THEN dia.estimated_cost ELSE 0 END) as total_lost_revenue,
  SUM(CASE WHEN dia.is_authorized = true THEN dia.estimated_cost ELSE 0 END) as total_revenue_captured,
  AVG(dia.estimated_cost) as avg_service_cost
FROM diagnostic_items_authorization dia
WHERE dia.authorization_date IS NOT NULL
GROUP BY dia.category, dia.item_name, dia.severity
ORDER BY times_rejected DESC, total_lost_revenue DESC;
