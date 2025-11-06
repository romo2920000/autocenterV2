/*
  # Create Base Tables for Autoservicio System

  1. Tables
    - customers: Client information
    - vehicles: Vehicle information
    - orders: Service orders
    - diagnostic_items_authorization: Authorization tracking
    - order_invoices: Invoice tracking
    - xml_products: Products from XML invoices
    - suppliers_catalog: Supplier catalog

  2. Security
    - Enable RLS on all tables
    - Public access policies for development
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  telefono text NOT NULL,
  email text,
  direccion text,
  ciudad text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre_completo);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  placas text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  anio text NOT NULL,
  color text,
  vin text,
  numero_serie text,
  kilometraje_inicial integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_placas ON vehicles(placas);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  tienda text NOT NULL,
  division text NOT NULL,
  productos jsonb DEFAULT '[]'::jsonb,
  servicios jsonb DEFAULT '[]'::jsonb,
  diagnostic jsonb,
  presupuesto decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendiente de Autorización',
  estado text,
  technician_name text,
  has_pending_supplier_validation boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_orders_folio ON orders(folio);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Create diagnostic_items_authorization table
CREATE TABLE IF NOT EXISTS diagnostic_items_authorization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  diagnostic_item_id text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'recommended',
  estimated_cost decimal(10, 2) NOT NULL DEFAULT 0,
  is_authorized boolean DEFAULT false,
  authorization_date timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_auth_order_id ON diagnostic_items_authorization(order_id);

-- Create order_invoices table
CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_folio text NOT NULL,
  xml_content text,
  xml_data jsonb DEFAULT '{}'::jsonb,
  total_amount decimal(10, 2) NOT NULL DEFAULT 0,
  items jsonb DEFAULT '[]'::jsonb,
  proveedor_nombre text,
  rfc_proveedor text,
  validados integer DEFAULT 0,
  nuevos integer DEFAULT 0,
  is_generic_supplier boolean DEFAULT false,
  generic_supplier_approved boolean DEFAULT false,
  generic_supplier_approved_by uuid,
  generic_supplier_approved_at timestamptz,
  pending_supplier_validation boolean DEFAULT false,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON order_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_order_invoices_pending_supplier ON order_invoices(pending_supplier_validation) WHERE pending_supplier_validation = true;

-- Create suppliers_catalog table
CREATE TABLE IF NOT EXISTS suppliers_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_proveedor text NOT NULL,
  rfc text UNIQUE NOT NULL,
  direccion text,
  telefono text,
  email text,
  contacto_nombre text,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_rfc ON suppliers_catalog(rfc);
CREATE INDEX IF NOT EXISTS idx_suppliers_nombre ON suppliers_catalog(nombre_proveedor);

-- Create xml_products table
CREATE TABLE IF NOT EXISTS xml_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES order_invoices(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad decimal(10, 2) NOT NULL DEFAULT 0,
  precio decimal(10, 2) NOT NULL DEFAULT 0,
  subtotal decimal(10, 2) DEFAULT 0,
  iva decimal(10, 2) DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  clave_prod_serv text,
  sku_xml text,
  clave_unidad text,
  unidad text DEFAULT 'PZ',
  division text,
  linea text,
  clase text,
  subclase text,
  margen decimal(5, 2) DEFAULT 0,
  precio_venta decimal(10, 2) DEFAULT 0,
  sku text,
  sku_original text,
  sku_final text,
  is_validated boolean DEFAULT false,
  is_new boolean DEFAULT true,
  is_processed boolean DEFAULT false,
  is_auto_classified boolean DEFAULT false,
  is_generic_supplier boolean DEFAULT false,
  not_found boolean DEFAULT false,
  product_status text DEFAULT 'pending',
  proveedor text,
  invoice_number text,
  supplier_rfc text,
  supplier_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xml_products_invoice_id ON xml_products(invoice_id);
CREATE INDEX IF NOT EXISTS idx_xml_products_order_id ON xml_products(order_id);
CREATE INDEX IF NOT EXISTS idx_xml_products_product_status ON xml_products(product_status);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_items_authorization ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE xml_products ENABLE ROW LEVEL SECURITY;

-- Public access policies (temporary for development)
CREATE POLICY "Allow public read on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON customers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on customers" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow public read on vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on vehicles" ON vehicles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on vehicles" ON vehicles FOR DELETE USING (true);

CREATE POLICY "Allow public read on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on orders" ON orders FOR DELETE USING (true);

CREATE POLICY "Allow public read on diagnostic_items_authorization" ON diagnostic_items_authorization FOR SELECT USING (true);
CREATE POLICY "Allow public insert on diagnostic_items_authorization" ON diagnostic_items_authorization FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on diagnostic_items_authorization" ON diagnostic_items_authorization FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on diagnostic_items_authorization" ON diagnostic_items_authorization FOR DELETE USING (true);

CREATE POLICY "Allow public read on order_invoices" ON order_invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_invoices" ON order_invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on order_invoices" ON order_invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on order_invoices" ON order_invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read on suppliers_catalog" ON suppliers_catalog FOR SELECT USING (true);
CREATE POLICY "Allow public insert on suppliers_catalog" ON suppliers_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on suppliers_catalog" ON suppliers_catalog FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on suppliers_catalog" ON suppliers_catalog FOR DELETE USING (true);

CREATE POLICY "Allow public read on xml_products" ON xml_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert on xml_products" ON xml_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on xml_products" ON xml_products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on xml_products" ON xml_products FOR DELETE USING (true);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostic_auth_updated_at BEFORE UPDATE ON diagnostic_items_authorization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_xml_products_updated_at BEFORE UPDATE ON xml_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();