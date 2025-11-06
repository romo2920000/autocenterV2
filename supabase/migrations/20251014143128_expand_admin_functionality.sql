/*
  # Expandir Funcionalidad de Administración

  1. Cambios en Usuarios
    - Agregar más campos de información
    - Agregar campo de teléfono
    - Mejorar estructura para soporte de proveedores

  2. Seguridad
    - Mantener RLS habilitado
    - Políticas permisivas para rol anon (autenticación personalizada)
*/

-- Agregar campos adicionales a usuarios si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE users ADD COLUMN telefono text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'departamento'
  ) THEN
    ALTER TABLE users ADD COLUMN departamento text;
  END IF;
END $$;

-- Actualizar constraint de roles para incluir 'proveedor'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'vendedor', 'proveedor'));