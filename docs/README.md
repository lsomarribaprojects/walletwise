# Walletwise Documentation

**Documentación completa del proyecto Walletwise**

---

## Navegación Rápida

### Para Empezar
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Verificación Post-Migración](#verificación)

### Referencia
- [Esquema de Base de Datos](#esquema)
- [Tipos TypeScript](#typescript-types)
- [Comandos MCP](#comandos-mcp)

---

## Resumen Ejecutivo

### ¿Qué es Walletwise?

Walletwise es una aplicación SaaS de gestión financiera personal inteligente que permite:

- Rastrear gastos e ingresos
- Gestionar múltiples cuentas bancarias
- Crear y monitorear presupuestos
- Automatizar gastos recurrentes
- Recibir insights financieros del agente CFO AI

### Stack Tecnológico

```
Frontend:  Next.js 16 + React 19 + TypeScript + Tailwind CSS 3.4
Backend:   Supabase (PostgreSQL + Auth + Storage)
AI:        OpenAI GPT-4 (agente CFO)
Testing:   Playwright + Jest
State:     Zustand
Validación: Zod
```

### Arquitectura

**Feature-First Architecture** - Cada feature es independiente y autocontenida.

```
src/
├── app/              # Next.js App Router
├── features/         # Features organizadas por funcionalidad
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   ├── accounts/
│   ├── budgets/
│   └── cfo-agent/
└── shared/           # Código reutilizable
    ├── components/
    ├── hooks/
    ├── lib/
    ├── types/
    └── utils/
```

---

## Configuración de Base de Datos

### Archivos de Documentación

1. **[database-summary.md](./database-summary.md)**
   - Resumen ejecutivo completo
   - Estado del proyecto
   - Métricas y decisiones de diseño

2. **[database-setup-guide.md](./database-setup-guide.md)**
   - Guía paso a paso completa
   - Arquitectura detallada
   - Troubleshooting

3. **[mcp-commands-checklist.md](./mcp-commands-checklist.md)**
   - Checklist de comandos MCP
   - 5 fases de configuración
   - Verificaciones paso a paso

4. **[database-schema-diagram.md](./database-schema-diagram.md)**
   - Diagramas visuales (Mermaid)
   - ERD completo
   - Flujos de datos

5. **[post-migration-verification.sql](./post-migration-verification.sql)**
   - Script de verificación completo
   - 13 secciones de tests
   - Health check final

### Archivos de Migración

```
supabase/migrations/
├── 20260102000001_init_walletwise_schema.sql     # Schema inicial (8 tablas)
├── 20260102000002_enable_rls_policies.sql        # Seguridad RLS (32 políticas)
├── 20260102000003_helper_functions.sql           # Funciones de negocio (9 funciones)
└── 20260102000004_seed_data.sql                  # Datos de prueba (opcional)
```

### Quick Start

**5 pasos para configurar la base de datos:**

```bash
# 1. Verificar estado actual
list_tables
get_advisors(type: "security")

# 2. Aplicar migraciones
apply_migration(name: "init_walletwise_schema", query: "...")
apply_migration(name: "enable_rls_policies", query: "...")
apply_migration(name: "helper_functions", query: "...")

# 3. Verificar configuración
list_tables                     # Debe mostrar 8 tablas
get_advisors(type: "security")  # Sin advertencias

# 4. Crear categorías por defecto
execute_sql("SELECT seed_default_categories(auth.uid());")

# 5. Ejecutar verificación completa
# Ejecutar post-migration-verification.sql sección por sección
```

**Tiempo estimado:** 10-15 minutos

---

## Esquema

### Tablas Principales (8)

#### 1. profiles
**Propósito:** Perfiles de usuario extendidos

**Campos clave:**
- `id` - UUID (FK → auth.users)
- `email` - Email del usuario
- `full_name` - Nombre completo
- `timezone` - Zona horaria (default: UTC)
- `currency_code` - Moneda predeterminada (default: USD)

**RLS:** Usuarios solo ven su propio perfil

---

#### 2. accounts
**Propósito:** Cuentas bancarias y billeteras

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `name` - Nombre de la cuenta
- `type` - checking | savings | credit_card | cash | investment | other
- `balance` - Balance actual (auto-actualizado)
- `is_active` - Cuenta activa/inactiva

**Características:**
- Balance se actualiza automáticamente via trigger
- Soporte para múltiples monedas
- Iconos y colores personalizables

**RLS:** Usuarios solo ven sus propias cuentas

---

#### 3. categories
**Propósito:** Categorías de transacciones (income/expense)

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `name` - Nombre de la categoría
- `type` - income | expense
- `parent_id` - FK → categories (para jerarquía)
- `is_default` - Categoría por defecto del sistema

**Características:**
- Soporte para subcategorías (parent_id)
- 15 categorías por defecto (10 expense, 5 income)
- Iconos y colores personalizables

**RLS:** Usuarios solo ven sus propias categorías

---

#### 4. transactions
**Propósito:** Transacciones financieras (ingresos y gastos)

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `account_id` - FK → accounts (nullable)
- `category_id` - FK → categories (nullable)
- `type` - income | expense
- `amount` - Monto (DECIMAL, debe ser > 0)
- `description` - Descripción
- `transaction_date` - Fecha de la transacción
- `is_recurring` - Indica si fue generada por gasto recurrente
- `tags` - Array de etiquetas

**Características:**
- Actualiza balance de cuenta automáticamente
- Soporte para etiquetas (tags)
- Relación con gastos recurrentes

**RLS:** Usuarios solo ven sus propias transacciones

---

#### 5. recurring_expenses
**Propósito:** Gastos recurrentes automatizados

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `account_id` - FK → accounts (nullable)
- `category_id` - FK → categories (nullable)
- `name` - Nombre del gasto recurrente
- `amount` - Monto
- `frequency` - daily | weekly | biweekly | monthly | quarterly | semiannual | annual
- `start_date` - Fecha de inicio
- `end_date` - Fecha de fin (nullable)
- `next_due_date` - Próxima fecha de ejecución
- `auto_create` - Crear transacción automáticamente

**Características:**
- Genera transacciones automáticamente
- Calcula próxima fecha de vencimiento
- Se puede activar/desactivar

**RLS:** Usuarios solo ven sus propios gastos recurrentes

---

#### 6. budgets
**Propósito:** Presupuestos por categoría

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `category_id` - FK → categories
- `name` - Nombre del presupuesto
- `amount` - Monto del presupuesto
- `period` - daily | weekly | monthly | quarterly | annual
- `start_date` - Fecha de inicio
- `end_date` - Fecha de fin (nullable)
- `alert_threshold` - % para alertas (default: 80%)

**Características:**
- Función `get_budget_progress()` para tracking
- Alertas cuando se excede threshold
- Comparación automática con gastos reales

**RLS:** Usuarios solo ven sus propios presupuestos

---

#### 7. cfo_conversations
**Propósito:** Historial de chat con agente CFO

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `session_id` - ID de sesión de chat
- `role` - user | assistant | system
- `content` - Contenido del mensaje
- `metadata` - JSONB para datos adicionales

**Características:**
- Almacena conversaciones completas
- Agrupadas por session_id
- Metadata para contexto adicional

**RLS:** Usuarios solo ven sus propias conversaciones

---

#### 8. admin_config
**Propósito:** Configuración de admin y API keys

**Campos clave:**
- `id` - UUID
- `user_id` - FK → profiles
- `config_key` - Clave de configuración
- `config_value` - Valor (JSONB)
- `is_encrypted` - Indica si está encriptado

**Características:**
- Almacena configuraciones por usuario
- Soporte para encriptación
- Flexible (JSONB)

**RLS:** Usuarios solo ven su propia configuración

---

### Funciones de Base de Datos (9)

#### Triggers (Auto-ejecutadas)

1. **`create_profile_for_user()`**
   - Dispara: INSERT en auth.users
   - Crea perfil automáticamente al registrarse

2. **`update_account_balance_on_transaction()`**
   - Dispara: INSERT/UPDATE/DELETE en transactions
   - Actualiza balance de cuenta automáticamente

3. **`update_updated_at_column()`**
   - Dispara: UPDATE en cualquier tabla
   - Actualiza campo updated_at

#### Funciones de Utilidad

4. **`get_account_balance(account_uuid)`**
   - Retorna: DECIMAL
   - Obtiene balance actual de una cuenta

5. **`get_user_total_balance(user_uuid)`**
   - Retorna: DECIMAL
   - Suma de balances de todas las cuentas activas

6. **`calculate_next_due_date(current_date, frequency)`**
   - Retorna: DATE
   - Calcula próxima fecha de vencimiento

#### Funciones de Negocio

7. **`seed_default_categories(user_uuid)`**
   - Retorna: VOID
   - Crea 15 categorías por defecto

8. **`get_monthly_spending_by_category(user_uuid, year, month)`**
   - Retorna: TABLE
   - Estadísticas de gastos por categoría

9. **`get_budget_progress(budget_uuid)`**
   - Retorna: TABLE
   - Progreso de presupuesto vs gasto real

10. **`process_due_recurring_expenses()`**
    - Retorna: TABLE
    - Crea transacciones para gastos recurrentes vencidos

---

### Seguridad (RLS)

**32 políticas de seguridad** implementadas.

**Patrón estándar:**
```sql
-- SELECT: Ver solo sus propios datos
CREATE POLICY [table]_select_own ON [table]
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Insertar solo con su user_id
CREATE POLICY [table]_insert_own ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Actualizar solo sus propios datos
CREATE POLICY [table]_update_own ON [table]
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Eliminar solo sus propios datos
CREATE POLICY [table]_delete_own ON [table]
  FOR DELETE USING (auth.uid() = user_id);
```

**Resultado:** Zero-trust security. Usuarios nunca pueden acceder a datos de otros usuarios.

---

### Índices de Performance (23+)

**Críticos para rendimiento:**

```sql
-- Transacciones por usuario y fecha (query más común)
idx_transactions_user_date

-- Cuentas activas por usuario
idx_accounts_user_active

-- Gastos recurrentes próximos a vencer
idx_recurring_next_due

-- Historial de chat por usuario y sesión
idx_cfo_conversations_user_session
```

**Todos los foreign keys tienen índices** para optimizar JOINs.

---

## TypeScript Types

### Archivo Principal

**`src/shared/types/database.ts`**

Contiene:
- Tipos para todas las tablas
- Tipos de Insert/Update
- Tipos de relaciones (joins)
- Tipos de funciones de BD
- Database interface para Supabase

### Ejemplo de Uso

```typescript
import { supabase } from '@/shared/lib/supabase';
import type { TransactionInsert, TransactionWithRelations } from '@/shared/types/database';

// Type-safe insert
const newTransaction: TransactionInsert = {
  user_id: userId,
  account_id: accountId,
  type: 'expense',
  amount: 50.00,
  description: 'Groceries',
  transaction_date: new Date().toISOString()
};

// Type-safe query with relations
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    account:accounts(*),
    category:categories(*)
  `)
  .returns<TransactionWithRelations[]>();
```

---

## Comandos MCP

### Exploración

```typescript
// Ver todas las tablas
list_tables()

// Verificar seguridad
get_advisors(type: "security")

// Ver logs de errores
get_logs(service: "postgres", level: "error", limit: 20)
```

### Migraciones

```typescript
// Aplicar migración
apply_migration(
  name: "migration_name",
  query: "SQL CODE HERE"
)
```

### Queries

```typescript
// Ejecutar SQL
execute_sql(
  query: "SELECT * FROM transactions WHERE user_id = auth.uid();"
)
```

### Funciones

```typescript
// Llamar función de BD
execute_sql(
  query: "SELECT seed_default_categories(auth.uid());"
)
```

**Guía completa:** [mcp-commands-checklist.md](./mcp-commands-checklist.md)

---

## Verificación

### Script de Verificación

**Archivo:** [post-migration-verification.sql](./post-migration-verification.sql)

**13 secciones de verificación:**

1. Table Verification
2. Schema Verification
3. Index Verification
4. RLS Verification
5. Trigger Verification
6. Function Verification
7. Security Verification
8. Performance Verification
9. Data Integrity Verification
10. Functional Testing
11. Trigger Testing
12. RLS Testing
13. Final Summary

### Health Check Rápido

```sql
SELECT
  'Tables' as check_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as result,
  8 as expected
UNION ALL
SELECT
  'RLS Policies',
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
  30
UNION ALL
SELECT
  'Functions',
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'),
  10;
```

**Todo debe coincidir con expected.**

---

## Diagramas

### ERD (Entity Relationship Diagram)

**Archivo:** [database-schema-diagram.md](./database-schema-diagram.md)

Incluye:
- ERD completo con Mermaid
- Diagramas de flujo de datos
- Diagramas de secuencia
- Diagramas de seguridad
- Mindmap de índices

**Vista en:** GitHub, VS Code, Mermaid Live Editor

---

## Próximos Pasos

### 1. Aplicar Migraciones

Sigue [mcp-commands-checklist.md](./mcp-commands-checklist.md)

### 2. Configurar Cliente Supabase

```typescript
// src/shared/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 3. Crear Servicios

```typescript
// src/features/transactions/services/transaction-service.ts
export const transactionService = {
  async getAll() { /* ... */ },
  async create() { /* ... */ },
  async update() { /* ... */ },
  async delete() { /* ... */ }
};
```

### 4. Implementar UI

```typescript
// src/features/transactions/components/transaction-list.tsx
export function TransactionList() {
  const { data, error } = useTransactions();
  // ...
}
```

### 5. Testing

```typescript
// src/features/transactions/services/transaction-service.test.ts
describe('TransactionService', () => {
  it('should create transaction and update balance', async () => {
    // ...
  });
});
```

---

## Troubleshooting

### Problemas Comunes

#### "permission denied for table X"
**Causa:** RLS bloqueando acceso
**Solución:** Verificar autenticación y políticas RLS

#### "balance not updating"
**Causa:** Trigger no funciona
**Solución:** Reaplicar migración 3

#### "foreign key violation"
**Causa:** ID referenciado no existe
**Solución:** Verificar que account_id y category_id existan

**Guía completa:** Ver sección Troubleshooting en [database-setup-guide.md](./database-setup-guide.md)

---

## Recursos Adicionales

### Documentación Oficial

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)

### Archivos del Proyecto

- `CLAUDE.md` - Filosofía y arquitectura del proyecto
- `.claude/prompts/supabase-mcp-baas.md` - Guía del MCP de Supabase
- `package.json` - Scripts y dependencias

### Contacto y Soporte

Para problemas o preguntas:
1. Consulta esta documentación
2. Revisa los archivos de migración
3. Ejecuta post-migration-verification.sql
4. Revisa logs con `get_logs()`

---

## Checklist de Estado

```
✅ Migraciones creadas (4 archivos)
✅ Documentación completa (6 archivos)
✅ TypeScript types generados
✅ Diagramas visuales creados
✅ Script de verificación preparado
✅ Listo para aplicar con MCP

⏳ Pendiente: Aplicar migraciones
⏳ Pendiente: Configurar cliente Supabase
⏳ Pendiente: Crear servicios
⏳ Pendiente: Implementar UI
⏳ Pendiente: Testing E2E
```

---

## Versión

**Documentación:** v1.0
**Fecha:** 2026-01-02
**Autor:** Agente Administrador de Supabase
**Estado:** Ready to deploy

---

**Fin de la Documentación de Walletwise**

Para comenzar, lee [database-summary.md](./database-summary.md) y luego sigue [mcp-commands-checklist.md](./mcp-commands-checklist.md).
