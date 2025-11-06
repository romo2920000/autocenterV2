/*
  # Actualizar Políticas de RLS para Acceso Público

  1. Cambios
    - Eliminar políticas restrictivas existentes
    - Crear nuevas políticas que permitan acceso público (anon y authenticated)
    - Mantener RLS habilitado pero con políticas más permisivas para desarrollo

  2. Notas Importantes
    - Estas políticas permiten acceso público para desarrollo
    - En producción, se deberían ajustar según las necesidades de seguridad específicas
*/

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;

-- Políticas para customers (permitir a todos los usuarios autenticados y anónimos)
CREATE POLICY "Enable all access for customers"
  ON customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para vehicles (permitir a todos los usuarios autenticados y anónimos)
CREATE POLICY "Enable all access for vehicles"
  ON vehicles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para orders (permitir a todos los usuarios autenticados y anónimos)
CREATE POLICY "Enable all access for orders"
  ON orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
