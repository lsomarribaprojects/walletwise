-- ============================================================================
-- FIX: Recursión infinita en políticas RLS de profiles
-- Ejecuta este archivo en: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new
-- ============================================================================

-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile name" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- 2. Crear función helper para verificar si es admin (evita recursión)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Nuevas políticas SIN recursión

-- Usuarios pueden ver su propio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles (usando función helper)
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Usuarios pueden actualizar su propio nombre
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- 4. Verificar que el admin actual tenga status approved
UPDATE profiles
SET status = 'approved', role = 'admin'
WHERE email = 'luis.somarriba.r@gmail.com';

-- ============================================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que funciona
-- SELECT * FROM profiles;
-- ============================================================================
