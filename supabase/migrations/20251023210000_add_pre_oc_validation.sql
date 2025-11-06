/*
  # Agregar Validación Pre-OC y Control de Fases

  1. Nuevos Campos
    - `pre_oc_validation_status` - Estado de validación antes de generar OC
    - `pre_oc_validated_by` - Usuario que validó
    - `pre_oc_validated_at` - Fecha de validación
    - `pre_oc_validation_notes` - Notas de la validación

  2. Cambios
    - Se agrega un paso de validación obligatorio antes de generar la OC
    - Los roles admin_corporativo y gerente deben validar antes de continuar
    - Este es el "doble chequeo" solicitado

  3. Seguridad
    - RLS ya está habilitado en la tabla orders
    - Las políticas existentes cubren estos nuevos campos
*/

-- Agregar campo de validación pre-OC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pre_oc_validation_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN pre_oc_validation_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pre_oc_validated_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN pre_oc_validated_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pre_oc_validated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN pre_oc_validated_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'pre_oc_validation_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN pre_oc_validation_notes text;
  END IF;
END $$;

-- Agregar constraint para pre_oc_validation_status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pre_oc_validation_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_pre_oc_validation_status_check
  CHECK (pre_oc_validation_status IN ('pending', 'approved', 'rejected'));

-- Agregar foreign key para pre_oc_validated_by (referencia a user_profiles si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pre_oc_validated_by_fkey;
    ALTER TABLE orders ADD CONSTRAINT orders_pre_oc_validated_by_fkey
      FOREIGN KEY (pre_oc_validated_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Crear índice para búsquedas por estado de validación pre-OC
CREATE INDEX IF NOT EXISTS idx_orders_pre_oc_validation_status
  ON orders(pre_oc_validation_status);

-- Comentarios para documentación
COMMENT ON COLUMN orders.pre_oc_validation_status IS 'Estado de validación antes de generar OC: pending, approved, rejected';
COMMENT ON COLUMN orders.pre_oc_validated_by IS 'ID del usuario que realizó la validación pre-OC';
COMMENT ON COLUMN orders.pre_oc_validated_at IS 'Fecha y hora de la validación pre-OC';
COMMENT ON COLUMN orders.pre_oc_validation_notes IS 'Notas o comentarios de la validación pre-OC';
