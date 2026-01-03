# MCP de Supabase - Comandos a Ejecutar

**Checklist paso a paso para configurar Walletwise usando el MCP de Supabase**

---

## Pre-requisitos

Asegúrate de tener:
- Proyecto de Supabase creado
- MCP de Supabase configurado y conectado
- Credenciales de Supabase en variables de entorno

---

## Fase 1: Exploración (Estado Actual)

### Comando 1: Listar Tablas Existentes

```
list_tables
```

**Propósito:** Ver qué tablas ya existen (si alguna)

**Salida esperada:**
- Si es nueva: Solo tablas del sistema (auth.users, storage.buckets, etc.)
- Si ya tiene datos: Verás tablas de aplicación

---

### Comando 2: Verificar Seguridad

```
get_advisors
type: security
```

**Propósito:** Detectar problemas de seguridad

**Salida esperada:**
- Tablas sin RLS habilitado
- Tablas sin políticas
- Advertencias de seguridad

---

### Comando 3: Ver Logs Recientes

```
get_logs
service: postgres
limit: 50
```

**Propósito:** Detectar errores recientes en la base de datos

---

## Fase 2: Aplicar Migraciones

### Migración 1: Schema Inicial

```
apply_migration
name: "init_walletwise_schema"
query: "
-- Copiar todo el contenido de:
-- supabase/migrations/20260102000001_init_walletwise_schema.sql
"
```

**Qué crea:**
- 8 tablas principales
- 23+ índices
- 7 triggers para updated_at
- Constraints de validación

**Verificación:**
```
list_tables
```

Deberías ver:
- profiles
- admin_config
- accounts
- categories
- transactions
- recurring_expenses
- cfo_conversations
- budgets

---

### Migración 2: Políticas de Seguridad (RLS)

```
apply_migration
name: "enable_rls_policies"
query: "
-- Copiar todo el contenido de:
-- supabase/migrations/20260102000002_enable_rls_policies.sql
"
```

**Qué crea:**
- Habilita RLS en 8 tablas
- Crea 32 políticas de seguridad
- Configura acceso solo a datos propios

**Verificación:**
```
get_advisors
type: security
```

Deberías ver:
- Sin advertencias
- Todas las tablas con RLS enabled
- Todas las tablas con políticas

---

### Migración 3: Funciones Helper

```
apply_migration
name: "helper_functions"
query: "
-- Copiar todo el contenido de:
-- supabase/migrations/20260102000003_helper_functions.sql
"
```

**Qué crea:**
- 9 funciones de utilidad
- Trigger para actualizar balance automáticamente
- Trigger para crear perfil en signup
- Lógica de negocio en la base de datos

**Verificación:**
```
execute_sql
query: "
  SELECT routine_name, routine_type
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_account_balance_on_transaction',
    'create_profile_for_user',
    'get_account_balance',
    'get_user_total_balance',
    'get_monthly_spending_by_category',
    'get_budget_progress',
    'seed_default_categories',
    'calculate_next_due_date',
    'process_due_recurring_expenses'
  )
  ORDER BY routine_name;
"
```

Deberías ver las 9 funciones listadas.

---

### Migración 4: Datos de Prueba (OPCIONAL - Solo desarrollo)

```
apply_migration
name: "seed_data"
query: "
-- Copiar contenido de:
-- supabase/migrations/20260102000004_seed_data.sql
-- (pero está comentado, solo si quieres datos de prueba)
"
```

**Nota:** Omitir en producción. Los usuarios crearán sus propios datos.

---

## Fase 3: Verificación Completa

### Verificación 1: Tablas Creadas

```
list_tables
```

**Checklist:**
- [ ] profiles
- [ ] admin_config
- [ ] accounts
- [ ] categories
- [ ] transactions
- [ ] recurring_expenses
- [ ] cfo_conversations
- [ ] budgets

---

### Verificación 2: Índices

```
execute_sql
query: "
  SELECT
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
"
```

**Deberías ver 23+ índices.**

---

### Verificación 3: Políticas RLS

```
execute_sql
query: "
  SELECT
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename;
"
```

**Deberías ver:**
- accounts: 4 políticas
- admin_config: 4 políticas
- budgets: 4 políticas
- categories: 4 políticas
- cfo_conversations: 3 políticas
- profiles: 3 políticas
- recurring_expenses: 4 políticas
- transactions: 4 políticas

**Total: 30-32 políticas**

---

### Verificación 4: Triggers

```
execute_sql
query: "
  SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
  FROM pg_trigger
  JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
  WHERE tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%'
  ORDER BY table_name, trigger_name;
"
```

**Deberías ver:**
- Triggers de updated_at en 7 tablas
- Trigger de balance en transactions
- Trigger de create_profile en auth.users

---

### Verificación 5: Seguridad Final

```
get_advisors
type: security
```

**Salida esperada:**
```
✅ All tables have RLS enabled
✅ No security warnings
```

**Si hay advertencias, revisa las políticas.**

---

## Fase 4: Pruebas de Integración

### Test 1: Verificar Perfil Automático

**Prerequisito:** Tener un usuario autenticado

```
execute_sql
query: "
  SELECT id, email, created_at
  FROM profiles
  WHERE id = auth.uid();
"
```

**Si el trigger funciona:** Verás tu perfil creado automáticamente al registrarte.

---

### Test 2: Crear Categorías por Defecto

```
execute_sql
query: "
  SELECT seed_default_categories(auth.uid());
"
```

**Luego verificar:**
```
execute_sql
query: "
  SELECT id, name, type, icon, is_default
  FROM categories
  WHERE user_id = auth.uid()
  ORDER BY type, name;
"
```

**Deberías ver:**
- 10 categorías de expense
- 5 categorías de income

---

### Test 3: Crear Cuenta

```
execute_sql
query: "
  INSERT INTO accounts (user_id, name, type, balance, icon, color)
  VALUES (
    auth.uid(),
    'Test Checking Account',
    'checking',
    1000.00,
    '🏦',
    '#4ECDC4'
  )
  RETURNING id, name, balance;
"
```

**Guarda el ID de la cuenta para el siguiente test.**

---

### Test 4: Crear Transacción (Verificar Trigger de Balance)

**Antes:** Balance = 1000.00

```
execute_sql
query: "
  INSERT INTO transactions (
    user_id,
    account_id,
    type,
    amount,
    description,
    transaction_date
  )
  VALUES (
    auth.uid(),
    'ACCOUNT_ID_FROM_PREVIOUS_TEST',
    'expense',
    150.00,
    'Test groceries purchase',
    NOW()
  )
  RETURNING id, amount, type;
"
```

**Luego verificar el balance:**
```
execute_sql
query: "
  SELECT id, name, balance
  FROM accounts
  WHERE user_id = auth.uid();
"
```

**Balance esperado:** 850.00 (1000 - 150)

**✅ Si el balance se actualizó automáticamente, el trigger funciona correctamente.**

---

### Test 5: Verificar RLS (Seguridad)

**Intenta ver datos de otro usuario (debería fallar):**

```
execute_sql
query: "
  SELECT * FROM transactions
  WHERE user_id != auth.uid()
  LIMIT 1;
"
```

**Resultado esperado:**
```
No rows returned (porque RLS bloquea acceso a datos de otros usuarios)
```

**✅ Si no ves datos de otros usuarios, RLS funciona correctamente.**

---

## Fase 5: Monitoreo

### Ver Logs de Auth

```
get_logs
service: auth
limit: 20
```

**Útil para:** Depurar problemas de autenticación

---

### Ver Logs de Postgres

```
get_logs
service: postgres
limit: 20
```

**Útil para:** Depurar queries lentas o errores de BD

---

### Ver Logs de Edge Functions (si las usas)

```
get_logs
service: edge-functions
limit: 20
```

---

## Comandos de Mantenimiento

### Backup: Ver todas las tablas y su estructura

```
execute_sql
query: "
  SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
"
```

---

### Ver tamaño de las tablas

```
execute_sql
query: "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

### Analizar performance de queries

```
execute_sql
query: "
  EXPLAIN ANALYZE
  SELECT t.*, c.name as category_name, a.name as account_name
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN accounts a ON t.account_id = a.id
  WHERE t.user_id = auth.uid()
  ORDER BY t.transaction_date DESC
  LIMIT 50;
"
```

---

## Troubleshooting

### Error: "permission denied for table X"

**Causa:** RLS está bloqueando acceso

**Verificar:**
```
get_advisors
type: security
```

**Solución:** Asegúrate de que las políticas RLS estén correctamente configuradas.

---

### Error: "relation X does not exist"

**Causa:** Migración no fue aplicada o falló

**Verificar:**
```
list_tables
```

**Solución:** Reaplicar la migración correspondiente.

---

### Error: "insert or update on table violates foreign key constraint"

**Causa:** Intentas referenciar un ID que no existe

**Verificar:**
```
execute_sql
query: "SELECT id FROM accounts WHERE id = 'PROBLEMATIC_ID';"
```

**Solución:** Usa IDs válidos que existan en las tablas referenciadas.

---

### Balance no se actualiza automáticamente

**Causa:** Trigger no está funcionando

**Verificar:**
```
execute_sql
query: "
  SELECT tgname, tgenabled
  FROM pg_trigger
  WHERE tgname = 'transaction_update_account_balance';
"
```

**Solución:** Reaplicar migración 3 (helper_functions.sql).

---

## Checklist Final

```
✅ Fase 1: Exploración
  ✅ list_tables ejecutado
  ✅ get_advisors ejecutado
  ✅ get_logs revisado

✅ Fase 2: Migraciones
  ✅ Schema inicial aplicado
  ✅ Políticas RLS aplicadas
  ✅ Funciones helper aplicadas

✅ Fase 3: Verificación
  ✅ 8 tablas creadas
  ✅ 23+ índices creados
  ✅ 30-32 políticas creadas
  ✅ 9 funciones creadas
  ✅ Triggers funcionando

✅ Fase 4: Pruebas
  ✅ Perfil creado automáticamente
  ✅ Categorías por defecto creadas
  ✅ Cuenta de prueba creada
  ✅ Transacción creada
  ✅ Balance actualizado automáticamente
  ✅ RLS bloqueando acceso a datos ajenos

✅ Fase 5: Seguridad
  ✅ get_advisors sin advertencias
  ✅ RLS habilitado en todas las tablas
  ✅ Políticas funcionando correctamente
```

---

## Próximos Pasos

Una vez completado este checklist:

1. **Configurar cliente de Supabase en Next.js**
   - `src/shared/lib/supabase.ts`

2. **Crear servicios para cada feature**
   - Transaction service
   - Account service
   - Category service
   - etc.

3. **Implementar UI con los datos**
   - Dashboard con estadísticas
   - Lista de transacciones
   - Formularios de creación

4. **Testing E2E con Playwright**
   - Flujo completo de usuario
   - Validación visual

---

**Fin del Checklist de Comandos MCP**
