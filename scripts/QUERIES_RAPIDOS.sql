-- ============================================
-- QUERIES RÁPIDOS PARA DEBUGGING Y VERIFICACIÓN
-- ============================================

-- 1. VERIFICAR SI EL USUARIO YA EXISTE
-- ============================================
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'luis.somarriba.r@gmail.com';


-- 2. VERIFICAR PERFIL DEL USUARIO
-- ============================================
SELECT
  p.id,
  p.email,
  p.full_name,
  p.status,
  p.role,
  p.approved_at,
  p.created_at,
  p.updated_at,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'luis.somarriba.r@gmail.com';


-- 3. CONFIRMAR EMAIL MANUALMENTE (si está pendiente)
-- ============================================
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'luis.somarriba.r@gmail.com'
  AND email_confirmed_at IS NULL;


-- 4. ACTUALIZAR A ADMIN (si el usuario ya existe)
-- ============================================
UPDATE public.profiles
SET
  status = 'approved',
  role = 'admin',
  approved_at = NOW(),
  updated_at = NOW()
WHERE email = 'luis.somarriba.r@gmail.com';


-- 5. VER TODAS LAS POLÍTICAS RLS
-- ============================================
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- 6. VER POLÍTICAS DE LA TABLA PROFILES
-- ============================================
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';


-- 7. VERIFICAR TRIGGERS ACTIVOS
-- ============================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;


-- 8. VER FUNCIONES RELACIONADAS CON USUARIOS
-- ============================================
SELECT
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;


-- 9. LISTAR TODOS LOS USUARIOS
-- ============================================
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.last_sign_in_at,
  p.full_name,
  p.status,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;


-- 10. LISTAR TODOS LOS PERFILES
-- ============================================
SELECT
  id,
  email,
  full_name,
  status,
  role,
  approved_at,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC;


-- 11. VER ESTRUCTURA DE LA TABLA PROFILES
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;


-- 12. VERIFICAR COLUMNAS FALTANTES
-- ============================================
SELECT
  'status' AS columna,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'status'
  ) AS existe
UNION ALL
SELECT
  'role' AS columna,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'role'
  ) AS existe
UNION ALL
SELECT
  'approved_at' AS columna,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approved_at'
  ) AS existe
UNION ALL
SELECT
  'approved_by' AS columna,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'approved_by'
  ) AS existe;


-- 13. ELIMINAR USUARIO COMPLETAMENTE (USAR CON CUIDADO)
-- ============================================
-- Descomenta para usar:
-- DELETE FROM public.profiles WHERE email = 'usuario@ejemplo.com';
-- DELETE FROM auth.users WHERE email = 'usuario@ejemplo.com';


-- 14. RESETEAR PASSWORD DE UN USUARIO
-- ============================================
-- Nota: Esto requiere privilegios admin, ejecutar desde Dashboard
-- O usar la API de Supabase Auth Admin


-- 15. VER LOGS RECIENTES DE POSTGRES
-- ============================================
-- Nota: Esto solo funciona en el Dashboard de Supabase
-- Ve a: Logs > Postgres Logs


-- 16. VERIFICAR SI RLS ESTÁ HABILITADO
-- ============================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- 17. CREAR PERFIL PARA USUARIO EXISTENTE (MANUALMENTE)
-- ============================================
-- Reemplaza el UUID con el ID del usuario de auth.users
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
VALUES (
  'UUID_AQUI',
  'luis.somarriba.r@gmail.com',
  'Luis Somarriba',
  'approved',
  'admin',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'approved',
  role = 'admin',
  approved_at = NOW(),
  updated_at = NOW();


-- 18. VERIFICACIÓN COMPLETA POST-CREACIÓN
-- ============================================
SELECT
  'Usuario en auth.users' AS verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'luis.somarriba.r@gmail.com'
    )
    THEN '✅ Existe'
    ELSE '❌ No existe'
  END AS resultado
UNION ALL
SELECT
  'Email confirmado' AS verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM auth.users
      WHERE email = 'luis.somarriba.r@gmail.com'
        AND email_confirmed_at IS NOT NULL
    )
    THEN '✅ Confirmado'
    ELSE '❌ No confirmado'
  END AS resultado
UNION ALL
SELECT
  'Perfil existe' AS verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.profiles WHERE email = 'luis.somarriba.r@gmail.com'
    )
    THEN '✅ Existe'
    ELSE '❌ No existe'
  END AS resultado
UNION ALL
SELECT
  'Es admin' AS verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE email = 'luis.somarriba.r@gmail.com'
        AND role = 'admin'
    )
    THEN '✅ Es admin'
    ELSE '❌ No es admin'
  END AS resultado
UNION ALL
SELECT
  'Está aprobado' AS verificacion,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE email = 'luis.somarriba.r@gmail.com'
        AND status = 'approved'
    )
    THEN '✅ Aprobado'
    ELSE '❌ No aprobado'
  END AS resultado;


-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Estos queries son seguros para ejecutar en el SQL Editor de Supabase
-- Los UPDATE/DELETE están comentados para evitar ejecución accidental
-- Siempre verifica antes de ejecutar queries que modifiquen datos
