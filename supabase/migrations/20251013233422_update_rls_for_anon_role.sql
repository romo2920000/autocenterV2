/*
  # Actualizar Políticas RLS para Rol Anon

  1. Cambios
    - Modificar políticas para permitir acceso al rol 'anon'
    - Esto es necesario porque la app usa autenticación personalizada
    - El cliente de Supabase usa el rol 'anon' por defecto

  2. Seguridad
    - RLS permanece habilitado
    - Solo usuarios con la clave API anon pueden acceder
*/

-- xml_products: Permitir acceso al rol anon
DROP POLICY IF EXISTS "Allow all for authenticated users" ON xml_products;

CREATE POLICY "Allow all for anon and authenticated users"
  ON xml_products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- order_invoices: Permitir acceso al rol anon
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_invoices;

CREATE POLICY "Allow all for anon and authenticated users"
  ON order_invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- proveedores: Permitir acceso al rol anon
DROP POLICY IF EXISTS "Allow all for authenticated users" ON proveedores;

CREATE POLICY "Allow all for anon and authenticated users"
  ON proveedores
  FOR ALL
  USING (true)
  WITH CHECK (true);