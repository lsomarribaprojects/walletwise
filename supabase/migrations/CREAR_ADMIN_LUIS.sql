-- ============================================================================
-- CREAR ADMIN: luis.somarriba.r@gmail.com
-- EJECUTA DESPUÉS DE FIX_REGISTRATION_FINAL.sql
-- ============================================================================

-- 1. Verificar si el usuario existe en auth.users
SELECT 'BUSCANDO USUARIO EN AUTH.USERS:' as paso;
SELECT id, email, created_at FROM auth.users WHERE email = 'luis.somarriba.r@gmail.com';

-- 2. Verificar si tiene perfil
SELECT 'BUSCANDO PERFIL EXISTENTE:' as paso;
SELECT id, email, status, role FROM profiles WHERE email = 'luis.somarriba.r@gmail.com';

-- 3. Crear o actualizar perfil como ADMIN APROBADO
SELECT 'CREANDO/ACTUALIZANDO COMO ADMIN:' as paso;

INSERT INTO profiles (id, email, full_name, status, role, approved_at, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Luis Somarriba'),
  'approved',
  'admin',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  status = 'approved',
  role = 'admin',
  approved_at = NOW(),
  updated_at = NOW();

-- 4. Verificar resultado
SELECT 'RESULTADO FINAL:' as paso;
SELECT
  id,
  email,
  full_name,
  status,
  role,
  approved_at
FROM profiles
WHERE email = 'luis.somarriba.r@gmail.com';

-- SI NO APARECE NINGÚN RESULTADO, primero necesitas registrarte en:
-- https://walletwise-liard.vercel.app/signup
-- o donde esté desplegada la app
