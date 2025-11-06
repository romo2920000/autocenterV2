/*
  # Agregar Estado de Validación de Administrador

  1. Cambios en Orders
    - Agregar campos de validación de administrador
    - Nuevos estados en el flujo de trabajo
    
  2. Nuevos Estados
    - "Pendiente de Validación Admin" - Después de validar productos XML, antes de procesarlos
    - Se mantienen todos los estados existentes
    
  3. Campos Nuevos
    - admin_validation_status: Estado de la validación del admin (pending, approved, rejected)
    - admin_validation_notes: Notas del administrador sobre la validación
    - admin_validated_by: ID del usuario admin que validó
    - admin_validated_at: Fecha de validación del admin
*/

-- Agregar columnas de validación de administrador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'admin_validation_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN admin_validation_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'admin_validation_notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN admin_validation_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'admin_validated_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN admin_validated_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'admin_validated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN admin_validated_at timestamptz;
  END IF;
END $$;

-- Agregar constraint para admin_validation_status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_admin_validation_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_admin_validation_status_check 
  CHECK (admin_validation_status IN ('pending', 'approved', 'rejected'));