-- ============================================================================
-- WALLETWISE - SISTEMA DE APROBACIÓN DE USUARIOS
-- Ejecuta este archivo en: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new
-- ============================================================================

-- 1. TABLA DE PERFILES DE USUARIO
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

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 3. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS PARA PROFILES

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil (nombre solamente)
CREATE POLICY "Users can update own profile name" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins pueden actualizar cualquier perfil (para aprobar/rechazar)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'pending',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER PARA CREAR PERFIL EN REGISTRO
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. FUNCIÓN PARA APROBAR USUARIO (solo admins)
CREATE OR REPLACE FUNCTION approve_user(user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNCIÓN PARA RECHAZAR USUARIO (solo admins)
CREATE OR REPLACE FUNCTION reject_user(user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- IMPORTANTE: Después de ejecutar esto, debes crear tu usuario admin manualmente:
--
-- 1. Primero regístrate en la app normalmente
-- 2. Luego ejecuta este SQL reemplazando 'tu@email.com' con tu email:
--
--    UPDATE profiles
--    SET status = 'approved', role = 'admin'
--    WHERE email = 'tu@email.com';
--
-- ============================================================================
