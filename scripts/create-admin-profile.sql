-- ============================================
-- SCRIPT: Create Admin Profile
-- EMAIL: luis.somarriba.r@gmail.com
-- EJECUTAR DESPUÉS de crear el usuario en auth.users
-- ============================================

-- PASO 1: Crear/Actualizar perfil como admin
-- ============================================
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  status,
  role,
  approved_at,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  'Luis Somarriba',
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

-- PASO 2: Verificar el resultado
-- ============================================
SELECT
  p.id,
  p.email,
  p.full_name,
  p.status,
  p.role,
  p.approved_at,
  u.email_confirmed_at,
  u.created_at as user_created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'luis.somarriba.r@gmail.com';
