/*
  # Agregar columnas faltantes a la tabla lost_sales

  1. Cambios en tabla lost_sales
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