-- ============================================================================
-- DIAGNÓSTICO: Verificar estado actual de la base de datos
-- Fecha: 2026-01-03
-- ============================================================================

-- 1. Ver estructura completa de la tabla profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Ver triggers existentes en auth.users
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 3. Ver funciones relacionadas con profiles
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
  OR routine_name LIKE '%profile%';

-- 4. Ver políticas RLS en profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Ver si RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 6. Contar perfiles existentes
SELECT
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as users
FROM profiles;

-- 7. Ver últimos 5 usuarios creados en auth
SELECT
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 8. Ver últimos 5 perfiles creados
SELECT
  id,
  email,
  full_name,
  status,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 9. Verificar usuarios sin perfil (esto debería estar vacío)
SELECT
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 10. Ver constraints de la tabla profiles
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'c' THEN pg_get_constraintdef(con.oid)
    WHEN 'f' THEN pg_get_constraintdef(con.oid)
    WHEN 'p' THEN pg_get_constraintdef(con.oid)
    WHEN 'u' THEN pg_get_constraintdef(con.oid)
  END AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles'
  AND nsp.nspname = 'public'
ORDER BY con.contype, con.conname;
