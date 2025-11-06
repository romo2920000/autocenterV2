/*
  # Agregar Número de Serie a Vehículos

  1. Cambios en vehicles
    - Agregar campo numero_serie (número de serie del vehículo)
    
  2. Índices
    - Índice en numero_serie para búsquedas rápidas
*/

-- Agregar columna numero_serie
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'numero_serie'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN numero_serie text;
  END IF;
END $$;

-- Crear índice en numero_serie
CREATE INDEX IF NOT EXISTS idx_vehicles_numero_serie ON vehicles(numero_serie);