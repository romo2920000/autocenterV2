/*
  # Crear vista de reporte de ventas perdidas

  1. Vista: lost_sales_report
*/

CREATE OR REPLACE VIEW lost_sales_report AS
SELECT 
  dia.category,
  dia.item_name,
  dia.severity,
  COUNT(*) as times_offered,
  COUNT(*) FILTER (WHERE dia.is_authorized = false AND dia.authorization_date IS NOT NULL) as times_rejected,
  COUNT(*) FILTER (WHERE dia.is_authorized = true) as times_accepted,
  ROUND(
    (COUNT(*) FILTER (WHERE dia.is_authorized = false AND dia.authorization_date IS NOT NULL)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100), 2
  ) as rejection_rate,
  COALESCE(SUM(dia.estimated_cost) FILTER (WHERE dia.is_authorized = false AND dia.authorization_date IS NOT NULL), 0) as total_lost_revenue,
  COALESCE(SUM(dia.estimated_cost) FILTER (WHERE dia.is_authorized = true), 0) as total_revenue_captured,
  ROUND(AVG(dia.estimated_cost), 2) as avg_service_cost
FROM 
  diagnostic_items_authorization dia
GROUP BY 
  dia.category, dia.item_name, dia.severity
HAVING 
  COUNT(*) > 0
ORDER BY 
  times_rejected DESC, total_lost_revenue DESC;