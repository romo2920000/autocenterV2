/*
  # Agregar columna severity a lost_sales

  ## Descripción
  Agrega la columna `severity` a la tabla `lost_sales` para registrar el nivel de 
  criticidad de las ventas perdidas.

  ## Cambios
  1. Nueva Columna
    - `severity` (text) - Nivel de criticidad: 'urgent', 'recommended', o 'good'
    - NOT NULL con valor por defecto 'recommended'
    - CHECK constraint para validar valores permitidos

  ## Notas
  - Esta columna es necesaria para el registro de autorizaciones rechazadas
  - Los valores posibles son: 'urgent', 'recommended', 'good'
*/

-- Agregar columna severity con valor por defecto
ALTER TABLE lost_sales 
ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'recommended';

-- Agregar constraint para validar valores permitidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lost_sales_severity_check'
  ) THEN
    ALTER TABLE lost_sales
    ADD CONSTRAINT lost_sales_severity_check 
    CHECK (severity IN ('urgent', 'recommended', 'good'));
  END IF;
END $$;

-- Crear índice para mejorar consultas por severity
CREATE INDEX IF NOT EXISTS idx_lost_sales_severity ON lost_sales(severity);