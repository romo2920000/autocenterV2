/*
  # Sistema de Gestión de Productos XML por Proveedor

  1. Nuevas Tablas
    - proveedores
    - xml_products

  2. Modificaciones a Tablas Existentes
    - order_invoices y orders
*/

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rfc text UNIQUE NOT NULL,
  email text,
  telefono text,
  direccion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for proveedores"
  ON proveedores
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Crear tabla de productos XML
CREATE TABLE IF NOT EXISTS xml_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES order_invoices(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad decimal(10, 2) NOT NULL DEFAULT 1,
  precio decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  clave_prod_serv text,
  clave_unidad text,
  unidad text,
  sku text,
  sku_original text,
  sku_final text,
  division text,
  linea text,
  clase text,
  subclase text,
  margen decimal(5, 2),
  precio_venta decimal(10, 2),
  is_validated boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_processed boolean DEFAULT false,
  proveedor text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE xml_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for xml_products"
  ON xml_products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Agregar columnas a order_invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_invoices' AND column_name = 'proveedor_nombre'
  ) THEN
    ALTER TABLE order_invoices ADD COLUMN proveedor_nombre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_invoices' AND column_name = 'rfc_proveedor'
  ) THEN
    ALTER TABLE order_invoices ADD COLUMN rfc_proveedor text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_invoices' AND column_name = 'validados'
  ) THEN
    ALTER TABLE order_invoices ADD COLUMN validados integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_invoices' AND column_name = 'nuevos'
  ) THEN
    ALTER TABLE order_invoices ADD COLUMN nuevos integer DEFAULT 0;
  END IF;
END $$;

-- Agregar columnas a orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'purchase_order_folio'
  ) THEN
    ALTER TABLE orders ADD COLUMN purchase_order_folio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_processing_xml'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_processing_xml boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_validating_products'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_validating_products boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_processing_products'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_processing_products boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_generating_purchase_order'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_generating_purchase_order boolean DEFAULT false;
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_xml_products_invoice_id ON xml_products(invoice_id);
CREATE INDEX IF NOT EXISTS idx_xml_products_order_id ON xml_products(order_id);
CREATE INDEX IF NOT EXISTS idx_xml_products_proveedor ON xml_products(proveedor);
CREATE INDEX IF NOT EXISTS idx_xml_products_sku ON xml_products(sku);
CREATE INDEX IF NOT EXISTS idx_proveedores_rfc ON proveedores(rfc);