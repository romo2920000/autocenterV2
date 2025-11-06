/*
  # Agregar columnas faltantes a la tabla lost_sales

  1. Cambios en tabla lost_sales
    - Agregar columna `order_folio` (text) para el folio de la orden
    - Agregar columna `vehicle_id` (uuid) para el vehículo asociado
    - Agregar columna `service_category` (text) para la categoría del servicio
    - Agregar columna `service_name` (text) para el nombre del servicio
    - Agregar columna `service_description` (text) para la descripción del servicio
    - Agregar columna `technician_name` (text) para el nombre del técnico
    - Renombrar `item_name` a usar el nuevo `service_name`
    - Renombrar `category` a usar el nuevo `service_category`

  2. Notas
    - Estas columnas permiten un análisis más completo de las ventas perdidas
    - Facilitan reportes y estadísticas detalladas
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'order_folio'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN order_folio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN vehicle_id uuid REFERENCES vehicles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'service_category'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN service_category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'service_name'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN service_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'service_description'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN service_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lost_sales' AND column_name = 'technician_name'
  ) THEN
    ALTER TABLE lost_sales ADD COLUMN technician_name text;
  END IF;
END $$;

COMMENT ON COLUMN lost_sales.order_folio IS 'Folio de la orden para fácil referencia';
COMMENT ON COLUMN lost_sales.vehicle_id IS 'Vehículo asociado al servicio rechazado';
COMMENT ON COLUMN lost_sales.service_category IS 'Categoría del servicio (Motor, Frenos, etc.)';
COMMENT ON COLUMN lost_sales.service_name IS 'Nombre del servicio rechazado';
COMMENT ON COLUMN lost_sales.service_description IS 'Descripción detallada del servicio';
COMMENT ON COLUMN lost_sales.technician_name IS 'Nombre del técnico que realizó el diagnóstico';
