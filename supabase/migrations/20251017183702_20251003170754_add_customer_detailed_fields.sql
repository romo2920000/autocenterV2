/*
  # Mejorar estructura de clientes para búsqueda profesional

  1. Cambios en la tabla customers
    - Agregar campos para nombre separado
    - Mantener nombre_completo como campo calculado
*/

-- Agregar nuevas columnas a customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE customers ADD COLUMN nombre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'apellido_paterno'
  ) THEN
    ALTER TABLE customers ADD COLUMN apellido_paterno text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'apellido_materno'
  ) THEN
    ALTER TABLE customers ADD COLUMN apellido_materno text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'rfc'
  ) THEN
    ALTER TABLE customers ADD COLUMN rfc text;
  END IF;
END $$;

-- Crear índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre);
CREATE INDEX IF NOT EXISTS idx_customers_apellido_paterno ON customers(apellido_paterno);
CREATE INDEX IF NOT EXISTS idx_customers_apellido_materno ON customers(apellido_materno);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_rfc ON customers(rfc);

-- Función para actualizar nombre_completo automáticamente
CREATE OR REPLACE FUNCTION update_nombre_completo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nombre IS NOT NULL AND NEW.apellido_paterno IS NOT NULL THEN
    NEW.nombre_completo = TRIM(CONCAT(
      NEW.nombre, ' ',
      NEW.apellido_paterno, ' ',
      COALESCE(NEW.apellido_materno, '')
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar nombre_completo automáticamente
DROP TRIGGER IF EXISTS trigger_update_nombre_completo ON customers;
CREATE TRIGGER trigger_update_nombre_completo
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_nombre_completo();