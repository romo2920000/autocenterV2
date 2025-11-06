/*
  # Agregar campo de promoción a orders

  1. Cambios en Tabla orders
    - Agregar columna promotion
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'promotion'
  ) THEN
    ALTER TABLE orders ADD COLUMN promotion text;
  END IF;
END $$;