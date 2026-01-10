-- ============================================
-- SCRIPT: Fix Database & Create Admin User
-- PROPÓSITO: Arreglar triggers y crear admin
-- EMAIL: luis.somarriba.r@gmail.com
-- ============================================

-- PASO 1: Eliminar triggers problemáticos
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- PASO 2: Añadir columnas faltantes a profiles
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN approved_by UUID;
  END IF;
END $$;

-- PASO 3: Eliminar políticas existentes y crear nuevas
-- ============================================
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
CREATE POLICY "Enable insert for authentication"
  ON profiles
  FOR INSERT
  WITH CHECK (true);

-- PASO 4: Recrear función con manejo de errores
-- ============================================
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
    split_part(NEW.email, '@', 1),
    'pending',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no falla el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- PASO 5: Crear trigger
-- ============================================
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta este query para verificar si el usuario existe
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com';

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Si el usuario NO existe en auth.users, debes crearlo primero usando:
-- 1. Dashboard de Supabase > Authentication > Users > Add User
-- 2. O usando la API Admin de Supabase
--
-- Después de crear el usuario, ejecuta el siguiente bloque:
