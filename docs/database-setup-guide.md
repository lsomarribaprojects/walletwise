# Walletwise Database Setup Guide

**Guía completa para configurar la base de datos de Walletwise usando Supabase MCP**

---

## Descripción General

Esta guía te llevará a través del proceso de configuración completa de la base de datos PostgreSQL para Walletwise usando el MCP (Model Context Protocol) de Supabase.

### Arquitectura de Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    WALLETWISE DATABASE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   auth.users │◄─────┤   profiles   │                     │
│  └──────────────┘      └──────┬───────┘                     │
│                               │                              │
│        ┌──────────────────────┼──────────────────┐          │
│        │                      │                  │          │
│   ┌────▼─────┐         ┌─────▼────┐      ┌──────▼──────┐   │
│   │ accounts │         │categories│      │admin_config │   │
│   └────┬─────┘         └─────┬────┘      └─────────────┘   │
│        │                     │                              │
│   ┌────▼─────────────────────▼────┐                         │
│   │       transactions            │                         │
│   └───────────────────────────────┘                         │
│                                                              │
│   ┌──────────────────────────────┐                          │
│   │   recurring_expenses         │                          │
│   └──────────────────────────────┘                          │
│                                                              │
│   ┌──────────────────────────────┐                          │
│   │   cfo_conversations          │                          │
│   └──────────────────────────────┘                          │
│                                                              │
│   ┌──────────────────────────────┐                          │
│   │        budgets               │                          │
│   └──────────────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Paso 1: Verificar Estado Actual

Antes de aplicar migraciones, verifica el estado actual de tu base de datos.

### Usando el MCP de Supabase

```typescript
// Lista todas las tablas existentes
list_tables()

// Verifica el estado de seguridad RLS
get_advisors(type: "security")

// Verifica logs recientes para detectar problemas
get_logs(service: "postgres", limit: 50)
```

### Salida Esperada

Si es una base de datos nueva, deberías ver:
- Solo las tablas del sistema de Supabase (auth.users, storage.objects, etc.)
- Sin tablas de aplicación personalizadas
- Posibles advertencias de seguridad (normal en BD nueva)

---

## Paso 2: Aplicar Migraciones

Aplica las migraciones en orden secuencial.

### Migración 1: Schema Inicial

```typescript
// Leer el contenido del archivo de migración
const schema_sql = await read_file('supabase/migrations/20260102000001_init_walletwise_schema.sql');

// Aplicar la migración
apply_migration(
  name: "init_walletwise_schema",
  query: schema_sql
)
```

**Qué hace esta migración:**
- Crea 8 tablas principales
- Establece relaciones entre tablas (foreign keys)
- Crea índices para rendimiento
- Configura triggers para updated_at
- Añade constraints de validación

**Resultado esperado:**
```
✅ Migration applied successfully
✅ Created tables: profiles, admin_config, accounts, categories,
                   transactions, recurring_expenses, cfo_conversations, budgets
✅ Created 15+ indexes
✅ Created 7 triggers
```

### Migración 2: Row Level Security (RLS)

```typescript
// Leer el contenido del archivo de políticas
const rls_sql = await read_file('supabase/migrations/20260102000002_enable_rls_policies.sql');

// Aplicar las políticas de seguridad
apply_migration(
  name: "enable_rls_policies",
  query: rls_sql
)
```

**Qué hace esta migración:**
- Habilita RLS en todas las tablas
- Crea políticas de SELECT, INSERT, UPDATE, DELETE
- Asegura que usuarios solo vean sus propios datos
- Implementa principio de mínimo privilegio

**Resultado esperado:**
```
✅ RLS enabled on 8 tables
✅ Created 32 security policies
✅ Users can only access their own data
```

### Migración 3: Funciones Helper

```typescript
// Leer funciones auxiliares
const functions_sql = await read_file('supabase/migrations/20260102000003_helper_functions.sql');

// Aplicar las funciones
apply_migration(
  name: "helper_functions",
  query: functions_sql
)
```

**Qué hace esta migración:**
- Trigger automático para actualizar balance de cuentas
- Función para crear perfil automáticamente al registrarse
- Funciones para obtener balances y estadísticas
- Función para procesar gastos recurrentes
- Función para crear categorías por defecto

**Resultado esperado:**
```
✅ Created 9 helper functions
✅ Created 2 automated triggers
✅ Business logic encapsulated in database
```

### Migración 4: Datos de Prueba (OPCIONAL)

```typescript
// Solo en desarrollo
const seed_sql = await read_file('supabase/migrations/20260102000004_seed_data.sql');

apply_migration(
  name: "seed_data",
  query: seed_sql
)
```

**Nota:** Esta migración está comentada por defecto. Solo úsala en desarrollo.

---

## Paso 3: Verificar Configuración

Después de aplicar las migraciones, verifica que todo esté correcto.

### Verificación 1: Tablas Creadas

```typescript
list_tables()
```

**Deberías ver:**
```
✅ profiles
✅ admin_config
✅ accounts
✅ categories
✅ transactions
✅ recurring_expenses
✅ cfo_conversations
✅ budgets
```

### Verificación 2: Seguridad RLS

```typescript
get_advisors(type: "security")
```

**Salida esperada:**
```
✅ All tables have RLS enabled
✅ All tables have appropriate policies
✅ No security warnings
```

**Si ves advertencias:**
```
⚠️ Table 'X' has RLS disabled
⚠️ Table 'X' is publicly readable
```
→ Revisa la migración de RLS y aplícala nuevamente.

### Verificación 3: Probar Funciones

```typescript
// Probar que las funciones existan
execute_sql(`
  SELECT routine_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  ORDER BY routine_name;
`)
```

**Deberías ver:**
```
✅ calculate_next_due_date
✅ create_profile_for_user
✅ get_account_balance
✅ get_budget_progress
✅ get_monthly_spending_by_category
✅ get_user_total_balance
✅ process_due_recurring_expenses
✅ seed_default_categories
✅ update_account_balance_on_transaction
```

---

## Paso 4: Prueba de Integración

Realiza pruebas para asegurar que todo funciona.

### Test 1: Crear Usuario y Perfil

```typescript
// Este test asume que tienes un usuario de prueba
// El perfil se debería crear automáticamente via trigger

execute_sql(`
  SELECT id, email, created_at
  FROM profiles
  WHERE id = auth.uid();
`)
```

### Test 2: Crear Categorías por Defecto

```typescript
// Llamar función para crear categorías
execute_sql(`
  SELECT seed_default_categories(auth.uid());
`)

// Verificar que se crearon
execute_sql(`
  SELECT id, name, type, icon, color
  FROM categories
  WHERE user_id = auth.uid()
  ORDER BY type, name;
`)
```

**Deberías ver:**
- 10 categorías de gastos (expense)
- 5 categorías de ingresos (income)

### Test 3: Crear Cuenta y Transacción

```typescript
// Crear cuenta
execute_sql(`
  INSERT INTO accounts (user_id, name, type, balance)
  VALUES (auth.uid(), 'Test Account', 'checking', 1000.00)
  RETURNING id, name, balance;
`)

// El balance inicial es 1000.00

// Crear transacción de gasto
execute_sql(`
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
    'ACCOUNT_ID_FROM_ABOVE',
    'expense',
    50.00,
    'Test purchase',
    NOW()
  )
  RETURNING *;
`)

// Verificar que el balance se actualizó automáticamente
execute_sql(`
  SELECT id, name, balance
  FROM accounts
  WHERE user_id = auth.uid();
`)
```

**Resultado esperado:**
```
Balance antes: 1000.00
Balance después: 950.00 (1000 - 50)
✅ Trigger funcionando correctamente
```

---

## Paso 5: Configurar Edge Functions (Opcional)

Para procesar gastos recurrentes automáticamente, puedes crear una Edge Function.

### Crear Edge Function

```typescript
// En supabase/functions/process-recurring/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .rpc('process_due_recurring_expenses')

  return new Response(
    JSON.stringify({ data, error }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### Programar con Cron

```bash
# En el dashboard de Supabase, crea un cron job:
# Database > Cron Jobs > New Job

0 0 * * * -- Ejecutar diariamente a medianoche
```

---

## Estructura de Tablas Detallada

### profiles
```sql
- id (UUID, PK, FK → auth.users)
- email (TEXT)
- full_name (TEXT)
- avatar_url (TEXT)
- timezone (TEXT, default: 'UTC')
- currency_code (TEXT, default: 'USD')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### accounts
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (TEXT)
- type (ENUM: checking, savings, credit_card, cash, investment, other)
- balance (DECIMAL)
- currency_code (TEXT)
- icon (TEXT)
- color (TEXT)
- is_active (BOOLEAN)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### categories
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (TEXT)
- type (ENUM: income, expense)
- icon (TEXT)
- color (TEXT)
- parent_id (UUID, FK → categories, nullable)
- is_default (BOOLEAN)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### transactions
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- account_id (UUID, FK → accounts, nullable)
- category_id (UUID, FK → categories, nullable)
- type (ENUM: income, expense)
- amount (DECIMAL, > 0)
- currency_code (TEXT)
- description (TEXT)
- notes (TEXT)
- transaction_date (TIMESTAMPTZ)
- is_recurring (BOOLEAN)
- recurring_expense_id (UUID, nullable)
- tags (TEXT[])
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### recurring_expenses
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- account_id (UUID, FK → accounts, nullable)
- category_id (UUID, FK → categories, nullable)
- name (TEXT)
- amount (DECIMAL, > 0)
- currency_code (TEXT)
- frequency (ENUM: daily, weekly, biweekly, monthly, quarterly, semiannual, annual)
- start_date (DATE)
- end_date (DATE, nullable)
- next_due_date (DATE)
- is_active (BOOLEAN)
- auto_create (BOOLEAN)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### cfo_conversations
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- session_id (TEXT)
- role (ENUM: user, assistant, system)
- content (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### budgets
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- category_id (UUID, FK → categories)
- name (TEXT)
- amount (DECIMAL, > 0)
- currency_code (TEXT)
- period (ENUM: daily, weekly, monthly, quarterly, annual)
- start_date (DATE)
- end_date (DATE, nullable)
- alert_threshold (DECIMAL, 0-100)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### admin_config
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- config_key (TEXT)
- config_value (JSONB)
- is_encrypted (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- UNIQUE(user_id, config_key)
```

---

## Índices Creados

### Performance Indexes
```sql
✅ idx_profiles_email
✅ idx_accounts_user_id
✅ idx_accounts_user_active
✅ idx_categories_user_id
✅ idx_categories_user_type
✅ idx_categories_parent_id
✅ idx_transactions_user_id
✅ idx_transactions_account_id
✅ idx_transactions_category_id
✅ idx_transactions_date
✅ idx_transactions_user_date
✅ idx_transactions_type
✅ idx_transactions_recurring
✅ idx_recurring_user_id
✅ idx_recurring_active
✅ idx_recurring_next_due
✅ idx_cfo_conversations_user_id
✅ idx_cfo_conversations_session
✅ idx_cfo_conversations_user_session
✅ idx_budgets_user_id
✅ idx_budgets_category_id
✅ idx_budgets_active
✅ idx_admin_config_user_key
```

---

## Políticas de Seguridad RLS

Todas las tablas tienen el siguiente patrón de políticas:

```
✅ [table]_select_own   - Los usuarios solo ven sus propios datos
✅ [table]_insert_own   - Los usuarios solo pueden insertar con su user_id
✅ [table]_update_own   - Los usuarios solo pueden actualizar sus datos
✅ [table]_delete_own   - Los usuarios solo pueden eliminar sus datos
```

**Principio de Seguridad:**
- Todas las queries verifican `auth.uid() = user_id`
- Sin autenticación → Sin acceso a datos
- Usuarios solo acceden a sus propios registros
- No hay acceso cruzado entre usuarios

---

## Troubleshooting

### Problema: "RLS Policy Violation"

**Causa:** Intentas acceder a datos sin autenticación o de otro usuario.

**Solución:**
```typescript
// Asegúrate de estar autenticado
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  // Usuario no autenticado
}
```

### Problema: "Balance no se actualiza automáticamente"

**Causa:** Trigger no está funcionando correctamente.

**Verificar:**
```typescript
execute_sql(`
  SELECT * FROM pg_trigger
  WHERE tgname = 'transaction_update_account_balance';
`)
```

**Solución:** Reaplicar migración 3 (helper_functions)

### Problema: "Foreign key violation"

**Causa:** Intentas crear una transacción con account_id o category_id que no existe.

**Solución:**
```typescript
// Verifica que la cuenta existe
execute_sql(`
  SELECT id FROM accounts
  WHERE id = 'ACCOUNT_ID' AND user_id = auth.uid();
`)
```

---

## Comandos Útiles del MCP

### Ver logs de errores
```typescript
get_logs(service: "postgres", level: "error", limit: 20)
```

### Ver estructura de una tabla
```typescript
execute_sql(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'transactions'
  ORDER BY ordinal_position;
`)
```

### Ver todas las políticas RLS
```typescript
execute_sql(`
  SELECT schemaname, tablename, policyname, cmd, qual
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
`)
```

### Ver todos los índices
```typescript
execute_sql(`
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
`)
```

---

## Checklist de Configuración Completa

```
☐ Paso 1: Verificar estado actual
  ☐ Ejecutar list_tables()
  ☐ Ejecutar get_advisors(type: "security")

☐ Paso 2: Aplicar migraciones
  ☐ Aplicar 20260102000001_init_walletwise_schema.sql
  ☐ Aplicar 20260102000002_enable_rls_policies.sql
  ☐ Aplicar 20260102000003_helper_functions.sql
  ☐ (Opcional) Aplicar 20260102000004_seed_data.sql

☐ Paso 3: Verificar configuración
  ☐ Verificar que todas las tablas existen
  ☐ Verificar que RLS está habilitado
  ☐ Verificar que las funciones fueron creadas

☐ Paso 4: Pruebas
  ☐ Crear perfil de usuario
  ☐ Crear categorías por defecto
  ☐ Crear cuenta de prueba
  ☐ Crear transacción de prueba
  ☐ Verificar actualización automática de balance

☐ Paso 5: Seguridad
  ☐ Ejecutar get_advisors(type: "security")
  ☐ Verificar que no hay advertencias
  ☐ Confirmar que RLS funciona correctamente
```

---

## Próximos Pasos

Una vez configurada la base de datos:

1. **Configurar cliente Supabase en Next.js**
   - Ver `src/shared/lib/supabase.ts`

2. **Crear servicios para cada feature**
   - `src/features/transactions/services/transaction-service.ts`
   - `src/features/accounts/services/account-service.ts`
   - etc.

3. **Implementar componentes de UI**
   - Usar los servicios para fetch/mutate datos
   - Implementar optimistic updates con Zustand

4. **Testing**
   - Tests unitarios para servicios
   - Tests de integración para flujos completos
   - Playwright para E2E

---

**Fin de la Guía de Configuración de Base de Datos**

Para más información, consulta:
- `.claude/prompts/supabase-mcp-baas.md` - Guía del MCP de Supabase
- `CLAUDE.md` - Filosofía y arquitectura del proyecto
