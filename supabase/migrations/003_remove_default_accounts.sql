-- ============================================================================
-- MIGRATION: Remove Default Accounts Trigger
-- Date: 2026-01-03
-- Description: Elimina el trigger que crea cuentas hardcodeadas y permite
--              que los usuarios creen sus propias cuentas
-- ============================================================================

-- 1. Eliminar el trigger que crea cuentas por defecto
DROP TRIGGER IF EXISTS on_user_created_accounts ON auth.users;
DROP TRIGGER IF EXISTS create_default_accounts_trigger ON auth.users;

-- 2. Eliminar la función que crea cuentas por defecto
DROP FUNCTION IF EXISTS create_default_accounts();

-- 3. Eliminar las cuentas existentes (las hardcodeadas de Daniel/Diana)
-- NOTA: Solo ejecutar si quieres limpiar datos de prueba
DELETE FROM cuentas WHERE nombre IN (
  'Nubank Daniel',
  'Bancoppel Daniel',
  'Nu credito Diana',
  'Bancoppel Diana'
);

-- 4. Verificar que la tabla cuentas permita nombres dinámicos
-- (Remover el constraint si existe)
ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_nombre_check;

-- 5. Actualizar la tabla para que el nombre sea texto libre
ALTER TABLE cuentas ALTER COLUMN nombre TYPE TEXT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 'Triggers eliminados' as status;
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';

SELECT 'Cuentas restantes:' as status;
SELECT nombre, tipo FROM cuentas;
