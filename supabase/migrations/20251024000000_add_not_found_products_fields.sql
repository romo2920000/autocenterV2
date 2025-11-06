/*
  # Agregar Campos para Productos No Encontrados

  1. Nuevos Campos en xml_products
    - `is_auto_classified` (boolean) - Indica si fue auto-clasificado
    - `not_found` (boolean) - Indica si el producto no fue encontrado en el sistema

  2. Propósito
    - Productos no encontrados se clasifican automáticamente como:
      * División: 0134
      * Línea: 260
      * Clase: 271
      * Subclase: NO CLASIFICADO
    - Permite identificar y reportar productos que necesitan atención

  3. Seguridad
    - RLS ya está habilitado en xml_products
    - Las políticas existentes cubren estos nuevos campos
*/

-- Agregar campo is_auto_classified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'is_auto_classified'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN is_auto_classified boolean DEFAULT false;
  END IF;
END $$;

-- Agregar campo not_found
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'xml_products' AND column_name = 'not_found'
  ) THEN
    ALTER TABLE xml_products ADD COLUMN not_found boolean DEFAULT false;
  END IF;
END $$;

-- Crear índice para búsquedas de productos no encontrados
CREATE INDEX IF NOT EXISTS idx_xml_products_not_found
  ON xml_products(not_found)
  WHERE not_found = true;

-- Crear índice para productos auto-clasificados
CREATE INDEX IF NOT EXISTS idx_xml_products_auto_classified
  ON xml_products(is_auto_classified)
  WHERE is_auto_classified = true;

-- Comentarios para documentación
COMMENT ON COLUMN xml_products.is_auto_classified IS 'Indica si el producto fue clasificado automáticamente (División 0134, Línea 260, Clase 271)';
COMMENT ON COLUMN xml_products.not_found IS 'Indica si el producto no fue encontrado en el sistema y requiere revisión manual';
