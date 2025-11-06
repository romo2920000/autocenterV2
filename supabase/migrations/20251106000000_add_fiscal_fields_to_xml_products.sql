/*
  # Agregar Campos Fiscales a Facturas XML

  1. Cambios en tabla xml_products
    - `subtotal` (numeric) - Base sin IVA (cfdi:Traslado Base)
    - `iva` (numeric) - Impuesto 16% (cfdi:Traslado Importe)
    - `total` (numeric) - Subtotal + IVA
    - `is_generic_supplier` (boolean) - Si es proveedor genérico (no registrado)
    - `supplier_rfc` (text) - RFC del proveedor desde el XML
    - `supplier_name` (text) - Nombre del proveedor desde el XML

  2. Funciones
    - Actualizar función para calcular totales por factura
*/

-- Agregar campos fiscales a xml_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'iva'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN iva numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'total'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN total numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'is_generic_supplier'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN is_generic_supplier boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'supplier_rfc'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN supplier_rfc text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'supplier_name'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN supplier_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN invoice_number text;
  END IF;
END $$;

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_xml_products_invoice_number ON xml_products(invoice_number);
CREATE INDEX IF NOT EXISTS idx_xml_products_supplier_rfc ON xml_products(supplier_rfc);
CREATE INDEX IF NOT EXISTS idx_xml_products_is_generic ON xml_products(is_generic_supplier);

-- Vista para totales por factura
CREATE OR REPLACE VIEW invoice_totals AS
SELECT
  order_id,
  invoice_number,
  supplier_name,
  supplier_rfc,
  is_generic_supplier,
  COUNT(*) as total_items,
  COALESCE(SUM(subtotal), 0) as invoice_subtotal,
  COALESCE(SUM(iva), 0) as invoice_iva,
  COALESCE(SUM(subtotal + iva), 0) as invoice_total,
  array_agg(
    jsonb_build_object(
      'descripcion', descripcion,
      'cantidad', cantidad,
      'precio', precio,
      'subtotal', subtotal,
      'iva', iva,
      'total', subtotal + iva
    )
  ) as items
FROM xml_products
WHERE invoice_number IS NOT NULL
GROUP BY order_id, invoice_number, supplier_name, supplier_rfc, is_generic_supplier;

-- Función para obtener resumen de facturas por orden
CREATE OR REPLACE FUNCTION get_invoice_summary(p_order_id uuid)
RETURNS TABLE (
  invoice_count bigint,
  total_invoices_subtotal numeric,
  total_invoices_iva numeric,
  total_invoices_total numeric,
  invoices jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT invoice_number)::bigint as invoice_count,
    SUM(invoice_subtotal) as total_invoices_subtotal,
    SUM(invoice_iva) as total_invoices_iva,
    SUM(invoice_total) as total_invoices_total,
    jsonb_agg(
      jsonb_build_object(
        'invoice_number', invoice_number,
        'supplier_name', supplier_name,
        'supplier_rfc', supplier_rfc,
        'is_generic_supplier', is_generic_supplier,
        'total_items', total_items,
        'subtotal', invoice_subtotal,
        'iva', invoice_iva,
        'total', invoice_total
      )
    ) as invoices
  FROM invoice_totals
  WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;
