-- ============================================================================
-- FIX REGISTRATION FINAL
-- Fecha: 2026-01-03
-- EJECUTA ESTO EN: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new
-- ============================================================================

-- PASO 1: Eliminar triggers problemáticos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- PASO 2: Ver qué columnas tiene la tabla profiles
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';

-- PASO 3: Añadir columnas que faltan (si no existen)
DO $$
BEGIN
  -- Añadir status si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'pending';
    ALTER TABLE public.profiles ADD CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- Añadir role si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    ALTER TABLE public.profiles ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin'));
  END IF;

  -- Añadir approved_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  -- Añadir approved_by si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_by UUID;
  END IF;
END $$;

-- PASO 4: Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- PASO 5: Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PASO 6: Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile name" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON profiles;

-- PASO 7: Crear políticas RLS correctas
-- CRÍTICO: Esta política permite al trigger insertar
CREATE POLICY "Enable insert for authentication" ON profiles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PASO 8: Recrear función handle_new_user con manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'pending',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- PASO 9: Crear trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 10: Verificar resultado
SELECT 'COLUMNAS DE PROFILES:' as info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT 'TRIGGER CREADO:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_profile';

SELECT 'POLITICAS RLS:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
