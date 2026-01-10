-- ============================================================================
-- MIGRACIÓN: Fix Profiles Registration Error
-- Fecha: 2026-01-03
-- Descripción: Añade columnas faltantes y corrige trigger de creación de perfiles
-- ============================================================================

-- PASO 1: Verificar columnas existentes (ejecutar primero para diagnóstico)
-- COMENTAR DESPUÉS DE VERIFICAR
/*
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
*/

-- PASO 2: Añadir columnas faltantes
-- Añadir columna 'status' si no existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Añadir columna 'role' si no existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- Añadir columnas de aprobación
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- PASO 3: Eliminar triggers existentes que puedan estar causando conflictos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- PASO 4: Recrear función handle_new_user con manejo de errores robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Intentar insertar el perfil
  INSERT INTO public.profiles (id, email, full_name, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'pending',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Siempre retornar NEW para no bloquear el registro
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Recrear trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 6: Actualizar políticas RLS para permitir inserción desde trigger
-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Crear política que permita inserción durante autenticación
CREATE POLICY "Enable insert for authentication"
ON profiles
FOR INSERT
WITH CHECK (true);

-- PASO 7: Asegurar que RLS esté habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecutar estas queries después de aplicar la migración:

/*
-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_profile';

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
*/

-- ============================================================================
-- PASO 8: Crear/Actualizar usuario admin (EJECUTAR DESPUÉS DE LA MIGRACIÓN)
-- ============================================================================
-- Ejecutar esta query SEPARADAMENTE después de que el usuario se haya registrado:

/*
-- Verificar si el usuario existe en auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'luis.somarriba.r@gmail.com';

-- Si existe pero no tiene perfil, insertarlo:
INSERT INTO profiles (id, email, full_name, status, role, approved_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'approved',
  'admin',
  NOW()
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  status = 'approved',
  role = 'admin',
  approved_at = NOW();

-- Verificar que se creó correctamente:
SELECT id, email, full_name, status, role, approved_at
FROM profiles
WHERE email = 'luis.somarriba.r@gmail.com';
*/
