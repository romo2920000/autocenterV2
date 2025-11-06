/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Current RLS policies query user_profiles within user_profiles policies
    - This creates infinite recursion when trying to access the table
  
  2. Solution
    - Create SECURITY DEFINER functions that bypass RLS
    - Update policies to use these functions instead of direct table queries
  
  3. Security Functions Created
    - get_user_role: Returns the role of the authenticated user
    - is_user_active: Checks if the authenticated user is active
    - has_role_access: Checks if user has specific role and is active
  
  4. Updated Policies
    - All policies now use security definer functions
    - No more infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own last_login" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can insert any user profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can update any user profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admin can delete any user profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin corporativo can view managed users" ON user_profiles;
DROP POLICY IF EXISTS "Admin corporativo can insert managed users" ON user_profiles;
DROP POLICY IF EXISTS "Admin corporativo can update managed users" ON user_profiles;
DROP POLICY IF EXISTS "Admin corporativo can delete managed users" ON user_profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM user_profiles
  WHERE id = auth.uid();
  
  RETURN user_role_result;
END;
$$;

CREATE OR REPLACE FUNCTION is_user_active()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_active_result boolean;
BEGIN
  SELECT is_active INTO is_active_result
  FROM user_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_active_result, false);
END;
$$;

CREATE OR REPLACE FUNCTION has_role_access(required_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE id = auth.uid()
      AND role = required_role
      AND is_active = true
  );
END;
$$;

-- Create new policies using security definer functions

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own last_login
CREATE POLICY "Users can update own last_login"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Super Admin policies
CREATE POLICY "Super admin can view all user profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (has_role_access('super_admin'));

CREATE POLICY "Super admin can insert any user profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role_access('super_admin'));

CREATE POLICY "Super admin can update any user profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (has_role_access('super_admin'))
  WITH CHECK (has_role_access('super_admin'));

CREATE POLICY "Super admin can delete any user profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (has_role_access('super_admin'));

-- Admin Corporativo policies
CREATE POLICY "Admin corporativo can view managed users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    has_role_access('admin_corporativo')
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can insert managed users"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role_access('admin_corporativo')
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can update managed users"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    has_role_access('admin_corporativo')
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  )
  WITH CHECK (
    has_role_access('admin_corporativo')
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );

CREATE POLICY "Admin corporativo can delete managed users"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    has_role_access('admin_corporativo')
    AND role IN ('gerente', 'tecnico', 'asesor_tecnico')
  );