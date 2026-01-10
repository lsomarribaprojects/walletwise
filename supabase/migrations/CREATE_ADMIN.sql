-- ============================================================================
-- CREAR USUARIO ADMIN
-- Ejecutar DESPUÉS de registrarte en la app con luis.somarriba.r@gmail.com
-- ============================================================================

-- PASO 1: Verificar que el usuario existe en auth.users
SELECT
  id,
  email,
  created_at,
  confirmed_at
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com';

-- Si no ves ningún resultado, PRIMERO regístrate en la app en:
-- https://walletwise-app.vercel.app/signup

-- PASO 2: Verificar si ya tiene perfil
SELECT
  id,
  email,
  full_name,
  status,
  role,
  created_at
FROM profiles
WHERE email = 'luis.somarriba.r@gmail.com';

-- PASO 3: Crear/actualizar el perfil como ADMIN APROBADO
INSERT INTO profiles (id, email, full_name, status, role, approved_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Luis Somarriba'),
  'approved',
  'admin',
  NOW()
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  status = 'approved',
  role = 'admin',
  approved_at = NOW(),
  updated_at = NOW();

-- PASO 4: VERIFICAR que se creó correctamente
SELECT
  id,
  email,
  full_name,
  status,
  role,
  approved_at,
  created_at
FROM profiles
WHERE email = 'luis.somarriba.r@gmail.com';

-- Deberías ver:
-- status: 'approved'
-- role: 'admin'
-- approved_at: [fecha actual]

-- ============================================================================
-- VERIFICACIÓN EXTRA: Ver todos los usuarios
-- ============================================================================

-- Ver todos los perfiles existentes
SELECT
  p.email,
  p.full_name,
  p.status,
  p.role,
  p.created_at,
  u.confirmed_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
