/*
  # Agregar Columnas de SKUs y Estado de Productos

  1. Nuevos Campos en xml_products
    - `sku_xml` (text) - SKU extraído del XML de la factura
    - `sku_oracle` (text) - SKU generado/asignado para Oracle
    - `product_status` (text) - Estado del producto: 'pending', 'found', 'not_found', 'processed'
    - `processed_at` (timestamptz) - Fecha cuando se procesó el producto
    - `processed_by` (uuid) - Usuario que procesó el producto

  2. Propósito
    - Separar SKU del XML vs SKU para Oracle
    - Tracking de estado del producto durante el flujo
    - Auditoría de quién procesó los productos

  3. Estados del Producto
    - 'pending': Recién cargado desde XML, sin procesar
    - 'found': Producto encontrado en catálogo
    - 'not_found': Producto NO encontrado, clasificado automáticamente
    - 'processed': Producto procesado y listo con SKU Oracle asignado

  4. Seguridad
    - RLS ya habilitado en xml_products
    - Políticas existentes cubren estos campos
*/

-- Agregar campo sku_xml
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'sku_xml'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN sku_xml text;
  END IF;
END $$;

-- Agregar campo sku_oracle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'sku_oracle'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN sku_oracle text;
  END IF;
END $$;

-- Agregar campo product_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'product_status'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN product_status text DEFAULT 'pending';
  END IF;
END $$;

-- Agregar campo processed_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

-- Agregar campo processed_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'processed_by'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN processed_by uuid REFERENCES user_profiles(id);
  END IF;
END $$;

-- Crear constraint para product_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'xml_products_status_check'
  ) THEN
    ALTER TABLE xml_products
    ADD CONSTRAINT xml_products_status_check 
    CHECK (product_status IN ('pending', 'found', 'not_found', 'processed'));
  END IF;
END $$;

-- Crear índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_xml_products_sku_xml ON xml_products(sku_xml);
CREATE INDEX IF NOT EXISTS idx_xml_products_sku_oracle ON xml_products(sku_oracle);
CREATE INDEX IF NOT EXISTS idx_xml_products_product_status ON xml_products(product_status);
CREATE INDEX IF NOT EXISTS idx_xml_products_processed_at ON xml_products(processed_at);

-- Actualizar productos existentes
UPDATE xml_products 
SET product_status = CASE
  WHEN not_found = true THEN 'not_found'
  WHEN is_processed = true THEN 'processed'
  WHEN is_validated = true THEN 'found'
  ELSE 'pending'
END
WHERE product_status IS NULL OR product_status = 'pending';

-- Migrar SKU existente a sku_oracle para productos ya procesados
UPDATE xml_products 
SET sku_oracle = sku
WHERE sku IS NOT NULL AND sku_oracle IS NULL;

-- Comentarios para documentación
COMMENT ON COLUMN xml_products.sku_xml IS 'SKU extraído del archivo XML de la factura';
COMMENT ON COLUMN xml_products.sku_oracle IS 'SKU generado o asignado para sistema Oracle';
COMMENT ON COLUMN xml_products.product_status IS 'Estado del producto: pending, found, not_found, processed';
COMMENT ON COLUMN xml_products.processed_at IS 'Timestamp de cuando se procesó el producto';
COMMENT ON COLUMN xml_products.processed_by IS 'ID del usuario que procesó el producto';
