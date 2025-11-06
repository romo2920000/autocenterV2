/*
  # Agregar Username y Autocenter a User Profiles

  1. Cambios en user_profiles
    - Agregar campo username (único, para login)
    - Agregar campo autocenter (para técnicos, gerentes, asesores)
    
  2. Función para generar username automático
    - Basado en el nombre y apellido
    - Asegura unicidad agregando números si es necesario
    
  3. Índices
    - Índice único en username
    - Índice en autocenter para búsquedas
*/

-- Agregar columna username
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text;
  END IF;
END $$;

-- Agregar columna autocenter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'autocenter'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN autocenter text;
  END IF;
END $$;

-- Crear índice único en username
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Crear índice en autocenter
CREATE INDEX IF NOT EXISTS idx_user_profiles_autocenter ON user_profiles(autocenter);

-- Función para generar username único basado en nombre
CREATE OR REPLACE FUNCTION generate_username(p_full_name text, p_email text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_username text;
  v_username text;
  v_counter integer := 0;
  v_exists boolean;
BEGIN
  -- Extraer primer nombre y primer apellido del nombre completo
  v_base_username := lower(regexp_replace(
    split_part(p_full_name, ' ', 1) || split_part(p_full_name, ' ', 2),
    '[^a-zA-Z0-9]',
    '',
    'g'
  ));
  
  -- Si el username base está vacío, usar parte del email
  IF v_base_username = '' THEN
    v_base_username := lower(split_part(p_email, '@', 1));
  END IF;
  
  -- Verificar si el username existe
  v_username := v_base_username;
  
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_profiles WHERE username = v_username
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
    
    v_counter := v_counter + 1;
    v_username := v_base_username || v_counter::text;
  END LOOP;
  
  RETURN v_username;
END;
$$;

-- Actualizar usuarios existentes para generar username si no tienen
UPDATE user_profiles
SET username = generate_username(full_name, email)
WHERE username IS NULL OR username = '';

-- Hacer username obligatorio después de generar para todos
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;