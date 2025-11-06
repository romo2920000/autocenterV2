/*
  # Sistema de Analíticas y Versionado de Presupuestos

  1. Nuevas Tablas
    - `order_versions` - Historial de cambios en presupuestos
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `version_number` (integer)
      - `changed_by` (uuid, foreign key a user_profiles)
      - `changed_at` (timestamptz)
      - `changes` (jsonb) - Objeto con before/after de cada campo modificado
      - `change_description` (text)

    - `system_alerts` - Alertas del sistema
      - `id` (uuid, primary key)
      - `alert_type` (text) - Tipo: 'pending_authorization', 'not_found_product', 'vip_customer', etc
      - `severity` (text) - 'low', 'medium', 'high', 'critical'
      - `title` (text)
      - `description` (text)
      - `related_order_id` (uuid)
      - `related_customer_id` (uuid)
      - `is_read` (boolean)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz)
      - `read_by` (uuid)

  2. Vistas Materializadas para Reportes
    - `sales_by_month` - Ventas agrupadas por mes
    - `top_products` - Productos más vendidos
    - `top_services` - Servicios más solicitados
    - `conversion_rate` - Tasa de conversión de presupuestos

  3. Funciones para Análisis
    - `calculate_customer_ltv(customer_id)` - Calcular valor de vida del cliente
    - `get_inactive_customers(months)` - Obtener clientes inactivos

  4. Seguridad
    - Enable RLS en todas las tablas
    - Políticas restrictivas basadas en roles
*/

-- =====================================================
-- TABLA: order_versions (Historial de cambios)
-- =====================================================

CREATE TABLE IF NOT EXISTS order_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  changed_by uuid REFERENCES user_profiles(id),
  changed_at timestamptz DEFAULT now(),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_description text,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_versions_order_id ON order_versions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_versions_changed_at ON order_versions(changed_at DESC);

ALTER TABLE order_versions ENABLE ROW LEVEL SECURITY;

-- Solo Super Admin puede ver historial de versiones
CREATE POLICY "Super Admin puede ver todas las versiones"
  ON order_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- TABLA: system_alerts (Alertas del sistema)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  related_order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  related_customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  related_product_id uuid,
  autocenter text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  read_by uuid REFERENCES user_profiles(id),
  dismissed_at timestamptz,
  dismissed_by uuid REFERENCES user_profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_autocenter ON system_alerts(autocenter);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read) WHERE is_read = false;

ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Super Admin y Admin Corporativo ven todas las alertas
CREATE POLICY "Admins pueden ver todas las alertas"
  ON system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('super_admin', 'admin_corporativo')
    )
  );

-- Gerentes y técnicos solo ven alertas de su autocenter
CREATE POLICY "Usuarios ven alertas de su autocenter"
  ON system_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.autocenter = system_alerts.autocenter
      AND user_profiles.role IN ('gerente', 'tecnico', 'asesor_tecnico')
    )
  );

-- Solo Super Admin puede marcar como leído/descartar alertas
CREATE POLICY "Super Admin puede actualizar alertas"
  ON system_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

-- =====================================================
-- FUNCIÓN: Registrar cambio de versión automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION log_order_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number integer;
  v_changes jsonb := '{}'::jsonb;
  v_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  v_user_id := auth.uid();

  -- Calcular número de versión
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM order_versions
  WHERE order_id = NEW.id;

  -- Construir objeto de cambios
  IF OLD.status != NEW.status THEN
    v_changes := jsonb_set(v_changes, '{status}', jsonb_build_object('before', OLD.status, 'after', NEW.status));
  END IF;

  IF OLD.presupuesto != NEW.presupuesto THEN
    v_changes := jsonb_set(v_changes, '{presupuesto}', jsonb_build_object('before', OLD.presupuesto, 'after', NEW.presupuesto));
  END IF;

  IF OLD.productos::text != NEW.productos::text THEN
    v_changes := jsonb_set(v_changes, '{productos}', jsonb_build_object('before', OLD.productos, 'after', NEW.productos));
  END IF;

  IF OLD.servicios::text != NEW.servicios::text THEN
    v_changes := jsonb_set(v_changes, '{servicios}', jsonb_build_object('before', OLD.servicios, 'after', NEW.servicios));
  END IF;

  -- Solo insertar si hubo cambios significativos
  IF v_changes != '{}'::jsonb THEN
    INSERT INTO order_versions (
      order_id,
      version_number,
      changed_by,
      changes,
      previous_data,
      new_data
    ) VALUES (
      NEW.id,
      v_version_number,
      v_user_id,
      v_changes,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_log_order_version ON orders;
CREATE TRIGGER trigger_log_order_version
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_version();

-- =====================================================
-- FUNCIÓN: Calcular valor de vida del cliente (LTV)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_customer_ltv(p_customer_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(presupuesto), 0)
  INTO v_total
  FROM orders
  WHERE customer_id = p_customer_id
  AND status IN ('Entregado', 'Autorizado', 'Productos Procesados');

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Obtener clientes inactivos
-- =====================================================

CREATE OR REPLACE FUNCTION get_inactive_customers(p_months integer DEFAULT 6)
RETURNS TABLE (
  customer_id uuid,
  nombre_completo text,
  telefono text,
  last_order_date timestamptz,
  months_inactive numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nombre_completo,
    c.telefono,
    MAX(o.created_at) as last_order_date,
    EXTRACT(EPOCH FROM (now() - MAX(o.created_at))) / (30 * 24 * 60 * 60) as months_inactive
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.nombre_completo, c.telefono
  HAVING MAX(o.created_at) < now() - (p_months || ' months')::interval
  OR MAX(o.created_at) IS NULL
  ORDER BY last_order_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Generar alertas automáticas
-- =====================================================

CREATE OR REPLACE FUNCTION generate_system_alerts()
RETURNS void AS $$
BEGIN
  -- Alerta: Presupuestos sin autorizar por más de 3 días
  INSERT INTO system_alerts (alert_type, severity, title, description, related_order_id, autocenter)
  SELECT
    'pending_authorization',
    'high',
    'Presupuesto pendiente de autorización',
    'El presupuesto ' || folio || ' lleva ' || EXTRACT(DAY FROM now() - created_at) || ' días sin autorizar',
    id,
    tienda
  FROM orders
  WHERE status = 'Pendiente de Autorización'
  AND created_at < now() - interval '3 days'
  AND NOT EXISTS (
    SELECT 1 FROM system_alerts sa
    WHERE sa.related_order_id = orders.id
    AND sa.alert_type = 'pending_authorization'
    AND sa.created_at > now() - interval '1 day'
  );

  -- Alerta: Productos no encontrados recurrentes (más de 3 veces)
  INSERT INTO system_alerts (alert_type, severity, title, description, related_product_id, metadata)
  SELECT
    'recurring_not_found',
    'medium',
    'Producto frecuentemente no encontrado',
    'El producto "' || descripcion || '" no se ha encontrado ' || COUNT(*) || ' veces',
    NULL,
    jsonb_build_object('producto', descripcion, 'count', COUNT(*))
  FROM xml_products
  WHERE not_found = true
  AND created_at > now() - interval '30 days'
  GROUP BY descripcion
  HAVING COUNT(*) >= 3
  AND NOT EXISTS (
    SELECT 1 FROM system_alerts sa
    WHERE sa.metadata->>'producto' = xml_products.descripcion
    AND sa.alert_type = 'recurring_not_found'
    AND sa.created_at > now() - interval '7 days'
  );

  -- Alerta: Validaciones pendientes acumuladas
  INSERT INTO system_alerts (alert_type, severity, title, description, autocenter)
  SELECT
    'pending_validations',
    'high',
    'Múltiples validaciones pendientes',
    'Hay ' || COUNT(*) || ' presupuestos esperando validación en ' || tienda,
    tienda
  FROM orders
  WHERE status = 'Productos Validados'
  AND admin_validation_status = 'pending'
  GROUP BY tienda
  HAVING COUNT(*) >= 5
  AND NOT EXISTS (
    SELECT 1 FROM system_alerts sa
    WHERE sa.autocenter = orders.tienda
    AND sa.alert_type = 'pending_validations'
    AND sa.created_at > now() - interval '1 day'
  );

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: Ventas por mes
-- =====================================================

CREATE OR REPLACE VIEW sales_by_month AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  tienda as autocenter,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('Entregado', 'Autorizado')) as completed_orders,
  SUM(presupuesto) as total_revenue,
  SUM(presupuesto) FILTER (WHERE status IN ('Entregado', 'Autorizado')) as completed_revenue,
  AVG(presupuesto) as avg_ticket
FROM orders
WHERE created_at > now() - interval '12 months'
GROUP BY DATE_TRUNC('month', created_at), tienda
ORDER BY month DESC, tienda;

-- =====================================================
-- VISTA: Productos más vendidos
-- =====================================================

CREATE OR REPLACE VIEW top_products AS
SELECT
  p->>'nombre' as product_name,
  p->>'sku' as sku,
  COUNT(*) as times_ordered,
  SUM((p->>'cantidad')::integer) as total_quantity,
  SUM((p->>'precio')::numeric * (p->>'cantidad')::integer) as total_revenue,
  AVG((p->>'precio')::numeric) as avg_price
FROM orders o,
  jsonb_array_elements(o.productos) as p
WHERE o.status IN ('Entregado', 'Autorizado', 'Productos Procesados')
AND o.created_at > now() - interval '6 months'
GROUP BY p->>'nombre', p->>'sku'
ORDER BY total_quantity DESC
LIMIT 50;

-- =====================================================
-- VISTA: Servicios más solicitados
-- =====================================================

CREATE OR REPLACE VIEW top_services AS
SELECT
  s->>'descripcion' as service_name,
  COUNT(*) as times_requested,
  SUM((s->>'precio')::numeric) as total_revenue,
  AVG((s->>'precio')::numeric) as avg_price
FROM orders o,
  jsonb_array_elements(o.servicios) as s
WHERE o.status IN ('Entregado', 'Autorizado', 'Productos Procesados')
AND o.created_at > now() - interval '6 months'
GROUP BY s->>'descripcion'
ORDER BY times_requested DESC
LIMIT 30;

-- =====================================================
-- VISTA: Tasa de conversión
-- =====================================================

CREATE OR REPLACE VIEW conversion_rate AS
SELECT
  tienda as autocenter,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('Autorizado', 'Entregado', 'Productos Procesados', 'Productos Validados')) as authorized_orders,
  COUNT(*) FILTER (WHERE status = 'Rechazado') as rejected_orders,
  ROUND(
    (COUNT(*) FILTER (WHERE status IN ('Autorizado', 'Entregado', 'Productos Procesados', 'Productos Validados'))::numeric /
    NULLIF(COUNT(*), 0) * 100), 2
  ) as conversion_rate_percentage
FROM orders
WHERE created_at > now() - interval '12 months'
GROUP BY tienda, DATE_TRUNC('month', created_at)
ORDER BY month DESC, tienda;

-- =====================================================
-- VISTA: Clientes más frecuentes
-- =====================================================

CREATE OR REPLACE VIEW top_customers AS
SELECT
  c.id,
  c.nombre_completo,
  c.telefono,
  c.email,
  COUNT(o.id) as total_orders,
  SUM(o.presupuesto) as lifetime_value,
  AVG(o.presupuesto) as avg_ticket,
  MAX(o.created_at) as last_order_date,
  MIN(o.created_at) as first_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.status IN ('Entregado', 'Autorizado', 'Productos Procesados')
GROUP BY c.id, c.nombre_completo, c.telefono, c.email
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 100;

-- =====================================================
-- VISTA: Análisis de ventas perdidas mejorado
-- =====================================================

CREATE OR REPLACE VIEW lost_sales_analysis AS
SELECT
  ls.category,
  ls.service_name,
  ls.severity,
  COUNT(*) as times_rejected,
  SUM(ls.estimated_cost) as total_lost_revenue,
  AVG(ls.estimated_cost) as avg_lost_per_rejection,
  ARRAY_AGG(DISTINCT ls.rejection_reason) as rejection_reasons
FROM lost_sales ls
WHERE ls.rejection_date > now() - interval '6 months'
GROUP BY ls.category, ls.service_name, ls.severity
ORDER BY total_lost_revenue DESC;
