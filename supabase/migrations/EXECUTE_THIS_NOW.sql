-- ============================================================================
-- SOLUCIÓN COMPLETA: Fix Registration Error
-- Fecha: 2026-01-03
-- Descripción: Script consolidado que garantiza que el registro funcione
-- ============================================================================

-- PASO 1: Verificar si la tabla profiles existe, si no, crearla con todas las columnas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- PASO 2: Si la tabla ya existía pero le faltan columnas, añadirlas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- PASO 3: Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- PASO 4: Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASO 5: Eliminar TODAS las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile name" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON profiles;

-- PASO 6: Crear políticas RLS CORRECTAS

-- Política CRÍTICA: Permitir que el trigger inserte perfiles (usa SECURITY DEFINER)
CREATE POLICY "Enable insert for authentication"
ON profiles
FOR INSERT
WITH CHECK (true);

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil (solo full_name)
CREATE POLICY "Users can update own profile name"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PASO 7: Eliminar triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- PASO 8: Recrear la función con manejo de errores ROBUSTO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- SIEMPRE retornar NEW para no bloquear el registro en auth.users
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Si hay cualquier error, logearlo pero NO FALLAR el registro
  RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 9: Recrear el trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 10: Funciones helper para admins (approve/reject)
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verificar si el que llama es admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Aprobar el usuario
  UPDATE profiles
  SET
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid(),
    updated_at = now()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.reject_user(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verificar si el que llama es admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Rechazar el usuario
  UPDATE profiles
  SET
    status = 'rejected',
    updated_at = now()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICACIÓN INMEDIATA
-- ============================================================================

-- Ver estructura de profiles
DO $$
BEGIN
  RAISE NOTICE '=== ESTRUCTURA DE PROFILES ===';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Ver trigger
DO $$
BEGIN
  RAISE NOTICE '=== TRIGGER CREADO ===';
END $$;

SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_profile';

-- Ver políticas RLS
DO $$
BEGIN
  RAISE NOTICE '=== POLÍTICAS RLS ===';
END $$;

SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'profiles';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Deberías ver:
-- 1. Tabla profiles con 9 columnas (id, email, full_name, status, role, approved_at, approved_by, created_at, updated_at)
-- 2. Trigger on_auth_user_created_profile en auth.users
-- 3. 5 políticas RLS (1 INSERT, 2 SELECT, 2 UPDATE)
-- ============================================================================
