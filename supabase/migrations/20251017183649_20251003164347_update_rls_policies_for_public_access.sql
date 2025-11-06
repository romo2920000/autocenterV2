/*
  # Actualizar Políticas de RLS para Acceso Público

  1. Cambios
    - Eliminar políticas restrictivas existentes
    - Crear nuevas políticas que permitan acceso público (anon y authenticated)
*/

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Allow all operations on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;

-- Políticas para customers
CREATE POLICY "Enable all access for customers"
  ON customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para vehicles
CREATE POLICY "Enable all access for vehicles"
  ON vehicles
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Políticas para orders
CREATE POLICY "Enable all access for orders"
  ON orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);