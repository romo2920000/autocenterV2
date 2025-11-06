/*
  # Arreglar Políticas RLS para Productos XML

  1. Cambios
    - Eliminar políticas restrictivas existentes
    - Crear políticas permisivas para usuarios autenticados
    - Permitir todas las operaciones CRUD sin restricciones adicionales

  2. Seguridad
    - Mantener RLS habilitado
    - Permitir acceso completo a usuarios autenticados
*/

-- Eliminar políticas existentes de xml_products
DROP POLICY IF EXISTS "Authenticated users can read xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can insert xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can update xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can delete xml_products" ON xml_products;

-- Crear nuevas políticas permisivas
CREATE POLICY "Allow all for authenticated users"
  ON xml_products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Eliminar políticas existentes de order_invoices
DROP POLICY IF EXISTS "Authenticated users can read order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Authenticated users can insert order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Authenticated users can update order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Authenticated users can delete order_invoices" ON order_invoices;

-- Crear nuevas políticas permisivas para order_invoices
CREATE POLICY "Allow all for authenticated users"
  ON order_invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Eliminar políticas existentes de proveedores
DROP POLICY IF EXISTS "Authenticated users can read proveedores" ON proveedores;
DROP POLICY IF EXISTS "Authenticated users can insert proveedores" ON proveedores;
DROP POLICY IF EXISTS "Authenticated users can update proveedores" ON proveedores;

-- Crear nuevas políticas permisivas para proveedores
CREATE POLICY "Allow all for authenticated users"
  ON proveedores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);