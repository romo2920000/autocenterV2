/*
  # Arreglar Políticas RLS para Productos XML

  1. Cambios
    - Actualizar políticas para acceso público
*/

-- xml_products
DROP POLICY IF EXISTS "Authenticated users can read xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can insert xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can update xml_products" ON xml_products;
DROP POLICY IF EXISTS "Authenticated users can delete xml_products" ON xml_products;
DROP POLICY IF EXISTS "Enable all for xml_products" ON xml_products;

CREATE POLICY "Enable all for xml_products"
  ON xml_products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- order_invoices
DROP POLICY IF EXISTS "Allow public read on order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Allow public insert on order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Allow public update on order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Allow public delete on order_invoices" ON order_invoices;
DROP POLICY IF EXISTS "Enable all for order_invoices" ON order_invoices;

CREATE POLICY "Enable all for order_invoices"
  ON order_invoices
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- proveedores
DROP POLICY IF EXISTS "Authenticated users can read proveedores" ON proveedores;
DROP POLICY IF EXISTS "Authenticated users can insert proveedores" ON proveedores;
DROP POLICY IF EXISTS "Authenticated users can update proveedores" ON proveedores;
DROP POLICY IF EXISTS "Enable all for proveedores" ON proveedores;

CREATE POLICY "Enable all for proveedores"
  ON proveedores
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);