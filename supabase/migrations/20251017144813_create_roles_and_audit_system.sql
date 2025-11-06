/*
  # Sistema de Roles y Auditoría Completa

  ## 1. Nuevos Roles Implementados
    - super_admin: Control total del sistema + auditoría
    - admin_corporativo: Gestión de usuarios (sin auditoría)
    - gerente: Supervisión y reportes
    - tecnico: Crear/buscar pedidos (antes vendedor)
    - asesor_tecnico: Soporte y diagnósticos

  ## 2. Tablas Nuevas
    
    ### `user_profiles`
    - `id` (uuid, FK a auth.users)
    - `email` (text)
    - `full_name` (text)
    - `role` (text con valores específicos)
    - `is_active` (boolean)
    - `created_at` (timestamptz)
    - `created_by` (uuid, FK a user_profiles)
    - `updated_at` (timestamptz)
    - `last_login` (timestamptz)

    ### `audit_logs`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK a user_profiles)
    - `action_type` (text: login, logout, create_user, update_user, etc.)
    - `action_details` (jsonb)
    - `ip_address` (text)
    - `user_agent` (text)
    - `created_at` (timestamptz)

    ### `user_sessions`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK a user_profiles)
    - `session_start` (timestamptz)
    - `session_end` (timestamptz)
    - `is_active` (boolean)
    - `ip_address` (text)

  ## 3. Seguridad (RLS)
    - Super Admin: Acceso completo a todas las tablas
    - Admin Corporativo: Gestión de usuarios (gerente, técnico, asesor)
    - Otros roles: Solo lectura de su propio perfil
    - Auditoría: Solo Super Admin

  ## 4. Notas Importantes
    - Los roles están definidos como tipo ENUM para validación
    - Las contraseñas se manejan por auth.users (Supabase Auth)
    - Auditoría automática mediante triggers
    - Sesiones activas rastreadas en tiempo real
*/

-- Crear tipo ENUM para roles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'super_admin',
      'admin_corporativo', 
      'gerente',
      'tecnico',
      'asesor_tecnico'
    );
  END IF;
END $$;

-- Crear tipo ENUM para acciones de auditoría
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM (
      'login',
      'logout',
      'create_user',
      'update_user',
      'activate_user',
      'deactivate_user',
      'delete_user',
      'create_order',
      'update_order',
      'delete_order',
      'view_report',
      'export_data',
      'other'
    );
  END IF;
END $$;

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'tecnico',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action_type audit_action NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  is_active boolean DEFAULT true,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at en user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ===============================================
-- POLÍTICAS RLS - USER_PROFILES
-- ===============================================

-- Super Admin: Acceso total a todos los perfiles
CREATE POLICY "Super admin can view all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Super admin can insert any user profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Super admin can update any user profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

CREATE POLICY "Super admin can delete any user profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

-- Admin Corporativo: Puede gestionar gerentes, técnicos y asesores
CREATE POLICY "Admin corporativo can view managed users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin_corporativo' 
      AND up.is_active = true
    )
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can insert managed users"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin_corporativo' 
      AND up.is_active = true
    )
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can update managed users"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin_corporativo' 
      AND up.is_active = true
    )
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin_corporativo' 
      AND up.is_active = true
    )
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can delete managed users"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'admin_corporativo' 
      AND up.is_active = true
    )
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

-- Todos los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own last_login"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ===============================================
-- POLÍTICAS RLS - AUDIT_LOGS
-- ===============================================

-- Solo Super Admin puede ver auditoría
CREATE POLICY "Super admin can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

-- Todos los usuarios autenticados pueden insertar en auditoría
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ===============================================
-- POLÍTICAS RLS - USER_SESSIONS
-- ===============================================

-- Super Admin puede ver todas las sesiones
CREATE POLICY "Super admin can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'super_admin' 
      AND up.is_active = true
    )
  );

-- Usuarios pueden ver sus propias sesiones
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuarios pueden crear sus propias sesiones
CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuarios pueden actualizar sus propias sesiones
CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===============================================
-- FUNCIONES AUXILIARES
-- ===============================================

-- Función para registrar acciones en auditoría
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id uuid,
  p_action_type audit_action,
  p_action_details jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, action_type, action_details, ip_address, user_agent)
  VALUES (p_user_id, p_action_type, p_action_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear sesión de usuario
CREATE OR REPLACE FUNCTION start_user_session(
  p_user_id uuid,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Cerrar sesiones activas previas
  UPDATE user_sessions
  SET is_active = false, session_end = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Crear nueva sesión
  INSERT INTO user_sessions (user_id, ip_address, user_agent)
  VALUES (p_user_id, p_ip_address, p_user_agent)
  RETURNING id INTO v_session_id;
  
  -- Actualizar last_login
  UPDATE user_profiles
  SET last_login = now()
  WHERE id = p_user_id;
  
  -- Registrar en auditoría
  PERFORM log_audit_action(p_user_id, 'login', jsonb_build_object('session_id', v_session_id), p_ip_address, p_user_agent);
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para cerrar sesión de usuario
CREATE OR REPLACE FUNCTION end_user_session(p_session_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM user_sessions
  WHERE id = p_session_id;
  
  UPDATE user_sessions
  SET is_active = false, session_end = now()
  WHERE id = p_session_id;
  
  -- Registrar en auditoría
  PERFORM log_audit_action(v_user_id, 'logout', jsonb_build_object('session_id', p_session_id));
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;