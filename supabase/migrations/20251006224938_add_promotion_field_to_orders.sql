/*
  # Agregar campo de promoción a orders

  1. Cambios en Tabla orders
    - Agregar columna `promotion` (text, nullable) para almacenar la promoción aplicada
    - Permite NULL ya que las promociones son opcionales
  
  2. Notas
    - Campo opcional para registrar promociones como "12 MESES SIN INT", "6 MESES SIN INT", etc.
    - Se mostrará en el detalle del pedido y presupuestos
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
