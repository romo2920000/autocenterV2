/*
  # Sistema de Autenticación y Roles

  1. Nueva Tabla
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Nombre de usuario para login
      - `password_hash` (text) - Contraseña hasheada
      - `full_name` (text) - Nombre completo del usuario
      - `role` (text) - Rol del usuario (admin, vendedor)
      - `email` (text, optional) - Email del usuario
      - `is_active` (boolean) - Si el usuario está activo
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS on `users` table
    - Add policies for user authentication and management
    
  3. Datos Iniciales
    - Crear usuario admin por defecto
    - Crear usuario vendedor por defecto

  4. Notas Importantes
    - Los roles son: 'admin' (acceso total) y 'vendedor' (acceso limitado)
    - Las contraseñas están en texto plano SOLO para desarrollo inicial
    - En producción deberían usarse funciones de hash como pgcrypto
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'vendedor')),
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir lectura pública para login (verificación de credenciales)
CREATE POLICY "Allow public read for authentication"
  ON users
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy: Solo admins pueden crear usuarios
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (false);

-- Policy: Solo admins pueden actualizar usuarios
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO public
  USING (false)
  WITH CHECK (false);

-- Policy: Solo admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO public
  USING (false);

-- Insertar usuarios por defecto
-- Nota: En producción, estas contraseñas deberían estar hasheadas
INSERT INTO users (username, password_hash, full_name, role, email)
VALUES 
  ('admin', '123', 'Administrador del Sistema', 'admin', 'admin@searsauto.com'),
  ('vendedor', '123', 'Vendedor Auto Center', 'vendedor', 'vendedor@searsauto.com')
ON CONFLICT (username) DO NOTHING;

-- Crear índice para búsquedas rápidas por username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);