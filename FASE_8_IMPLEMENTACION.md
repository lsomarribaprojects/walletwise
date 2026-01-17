# Fase 8: Sistema de Alertas Proactivas - Implementación Completada

## Resumen

Se ha implementado exitosamente un sistema completo de alertas proactivas que detecta patrones financieros y genera notificaciones automáticas para ayudar a los usuarios a tomar mejores decisiones.

## Estructura Creada

```
src/features/alerts/
├── types/
│   └── index.ts                    # Tipos TypeScript completos
├── services/
│   ├── alertService.ts             # CRUD de alertas
│   └── alertDetectors.ts           # Detectores inteligentes
├── hooks/
│   └── useAlerts.ts                # Hooks de React
├── store/
│   └── alertStore.ts               # Zustand store
├── components/
│   ├── AlertBell.tsx               # Icono de campana con badge
│   ├── AlertCard.tsx               # Card individual de alerta
│   ├── AlertDropdown.tsx           # Dropdown con lista de alertas
│   ├── AlertBanner.tsx             # Banner para alertas críticas
│   └── AlertsPage.tsx              # Página completa de alertas
├── index.ts                        # Exportaciones públicas
└── README.md                       # Documentación completa

supabase/migrations/
└── 009_alerts.sql                  # Migración SQL completa

src/app/api/cron/alerts/
└── route.ts                        # Cron job para detectores

src/shared/types/
└── database.ts                     # Actualizado con tipos de alertas
```

## Características Implementadas

### 1. Base de Datos

#### Tabla: `user_alerts`
- Tipos de alerta: warning, opportunity, milestone, recommendation
- Prioridades: low, medium, high
- Estados: is_read, is_dismissed
- Expiración opcional: expires_at
- Metadata flexible (JSON)
- RLS habilitado

#### Funciones SQL
- `get_unread_alerts_count(user_uuid)` - Conteo de alertas no leídas
- `dismiss_expired_alerts()` - Limpieza automática de expiradas
- `cleanup_old_alerts()` - Eliminar alertas antiguas (90+ días)

### 2. Detectores Automáticos

#### 1. Unusual Spending Detector
Detecta gastos inusuales (>2x promedio en categoría).

**Lógica:**
- Compara gasto del mes actual vs promedio de últimos 3 meses
- Solo alerta si el gasto es >$50 y >2x el promedio
- Prioridad según multiplicador (>3x = high, >2x = medium)

#### 2. High Credit Utilization Detector
Detecta tarjetas con utilización >30%.

**Lógica:**
- Calcula: saldo_actual / limite_credito
- Alerta si >30%
- Prioridad: >70% = high, >50% = medium, >30% = low

#### 3. Upcoming Payments Detector
Detecta pagos próximos (3 días antes).

**Lógica:**
- Revisa fecha_pago de tarjetas activas
- Alerta 3 días antes del vencimiento
- Expira automáticamente en la fecha de pago

#### 4. Budget Milestones Detector
Detecta hitos de presupuesto (25%, 50%, 75%, 100%).

**Lógica:**
- Calcula: gasto_actual / presupuesto
- Alerta en 25%, 50%, 75%, 100%
- Tipo: milestone (<75%), warning (≥75%)

#### 5. Savings Opportunities Detector
Detecta gastos recurrentes sin actividad (>3 meses).

**Lógica:**
- Busca gastos recurrentes sin transacciones en 3 meses
- Calcula ahorro anual potencial
- Solo alerta si ahorro >$100/año

### 3. Componentes UI

#### AlertBell
- Badge animado con contador
- Sizes: sm, md, lg
- Auto-refresh cada 30s

#### AlertDropdown
- Lista de alertas recientes (configurable)
- Acciones inline (marcar leída, descartar)
- Link a página completa
- Cierra al hacer click fuera

#### AlertCard
- Diseño visual por tipo (colores específicos)
- Iconos descriptivos
- Acciones (CTA) opcionales
- Modo compact para dropdowns

#### AlertBanner
- Para alertas de alta prioridad
- Auto-rotación (configurable)
- Navegación entre alertas
- Dismissible

#### AlertsPage
- Vista completa de todas las alertas
- Filtros por tipo y prioridad
- Summary cards con estadísticas
- Acciones bulk (marcar todas, descartar todas)

### 4. Hooks

#### useAlerts(filters?)
Hook principal con todas las funcionalidades.

#### useUnreadCount()
Hook optimizado solo para contador (con polling).

#### useActiveAlerts()
Hook para alertas activas (no descartadas).

#### useAlert(id)
Hook para una alerta específica.

### 5. Store (Zustand)

Estado global sincronizado con:
- Alertas actuales
- Summary
- Contador de no leídas
- Loading/Error states
- Acciones (fetch, mark, dismiss)

### 6. Servicios

#### alertService.ts
CRUD completo para alertas:
- getAlerts, getActiveAlerts
- createAlert, createAlerts (bulk)
- markAsRead, markAllAsRead
- dismissAlert, dismissMany
- getUnreadCount, getAlertsSummary

#### alertDetectors.ts
Lógica de detección:
- runAllDetectors() - Ejecuta todos
- Detectores individuales exportables

## Pasos de Integración

### 1. Aplicar Migración SQL

```bash
# Usando Supabase CLI
supabase db push

# O ejecutar manualmente en Supabase Dashboard
# SQL Editor > Pegar contenido de 009_alerts.sql
```

### 2. Agregar AlertDropdown al Header/Navbar

```tsx
// src/app/(main)/layout.tsx o tu componente de header
import { AlertDropdown } from '@/features/alerts'

export default function MainLayout({ children }) {
  return (
    <div>
      <header>
        <nav>
          {/* ... otros elementos ... */}
          <AlertDropdown maxAlerts={5} />
        </nav>
      </header>
      {children}
    </div>
  )
}
```

### 3. Agregar AlertBanner al Dashboard

```tsx
// src/app/(main)/dashboard/page.tsx
import { AlertBanner } from '@/features/alerts'
import { useAlerts } from '@/features/alerts'

export default function DashboardPage() {
  const { highPriorityAlerts, dismiss } = useAlerts()

  return (
    <div>
      <AlertBanner
        alerts={highPriorityAlerts}
        onDismiss={dismiss}
        maxAlerts={3}
        autoRotate={true}
      />
      {/* Resto del dashboard */}
    </div>
  )
}
```

### 4. Crear Página de Alertas

```tsx
// src/app/(main)/alerts/page.tsx
import { AlertsPage } from '@/features/alerts/components/AlertsPage'

export default function AlertsRoute() {
  return <AlertsPage />
}
```

### 5. Configurar Cron Job

#### Opción A: Vercel Cron

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

#### Opción B: GitHub Actions

```yaml
# .github/workflows/alerts-detector.yml
name: Alert Detectors
on:
  schedule:
    - cron: '0 8 * * *'
jobs:
  run-detectors:
    runs-on: ubuntu-latest
    steps:
      - name: Run Alert Detectors
        run: |
          curl -X POST https://tu-dominio.com/api/cron/alerts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Opción C: Manual (Testing)

```bash
# POST request para ejecutar manualmente
curl -X POST http://localhost:3000/api/cron/alerts
```

### 6. Variables de Entorno (Opcional)

```env
# .env.local
CRON_SECRET=tu-secret-aleatorio-seguro
```

## Testing

### 1. Testing Manual de Detectores

```typescript
// Crear archivo: scripts/test-detectors.ts
import { runAllDetectors, createAlerts } from '@/features/alerts'

async function test() {
  const result = await runAllDetectors()
  console.log('Detectores ejecutados:', result)

  if (result.alerts.length > 0) {
    const created = await createAlerts(result.alerts)
    console.log('Alertas creadas:', created.length)
  }
}

test()
```

### 2. Testing de Componentes

```tsx
// Probar AlertBell
<AlertBell size="md" onClick={() => console.log('Clicked!')} />

// Probar AlertDropdown
<AlertDropdown maxAlerts={5} />

// Probar AlertBanner
<AlertBanner
  alerts={mockHighPriorityAlerts}
  onDismiss={id => console.log('Dismissed:', id)}
/>
```

### 3. Testing de API

```bash
# GET (requiere autenticación si está configurada)
curl http://localhost:3000/api/cron/alerts

# POST (testing)
curl -X POST http://localhost:3000/api/cron/alerts
```

## Personalización

### Ajustar Thresholds de Detectores

```typescript
// src/features/alerts/services/alertDetectors.ts

// Cambiar multiplicador de gasto inusual
const UNUSUAL_SPENDING_MULTIPLIER = 2.5 // Default: 2.0

// Cambiar threshold de utilización de crédito
const HIGH_CREDIT_UTILIZATION_THRESHOLD = 0.4 // Default: 0.3 (30%)

// Cambiar días de anticipación para pagos
const UPCOMING_PAYMENT_DAYS = 5 // Default: 3

// Cambiar hitos de presupuesto
const BUDGET_MILESTONES = [0.5, 0.8, 1.0] // Default: [0.25, 0.5, 0.75, 1.0]
```

### Crear Detector Personalizado

```typescript
// src/features/alerts/services/alertDetectors.ts

async function detectCustomPattern(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  // Tu lógica aquí...

  return alerts
}

// Agregar a runAllDetectors()
const customAlerts = await detectCustomPattern()
results.push(...customAlerts)
```

## Mantenimiento

### Limpieza Periódica

```sql
-- Ejecutar semanalmente (o agregar a cron job)
SELECT cleanup_old_alerts();

-- Descartar alertas expiradas (ejecutar diariamente)
SELECT dismiss_expired_alerts();
```

### Monitoreo

```sql
-- Ver estadísticas de alertas
SELECT
  type,
  priority,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_read = false) as unread
FROM user_alerts
WHERE user_id = 'tu-user-id'
GROUP BY type, priority;

-- Alertas más recientes
SELECT * FROM user_alerts
ORDER BY created_at DESC
LIMIT 10;
```

## Próximos Pasos (Roadmap)

1. **Preferencias de Usuario**: Permitir configurar qué alertas recibir
2. **Notificaciones Push**: Web Push API para alertas críticas
3. **Email Notifications**: Digest diario de alertas
4. **Machine Learning**: Detectores más inteligentes con ML
5. **Snooze**: Posponer alertas temporalmente
6. **Analytics**: Dashboard de alertas históricas

## Soporte

Para preguntas o problemas:
- Ver: `src/features/alerts/README.md`
- Revisar: Tipos en `src/features/alerts/types/index.ts`
- Ejemplos: `src/features/alerts/components/AlertsPage.tsx`

## Conclusión

El sistema de alertas proactivas está completamente implementado y listo para usar. Solo falta:
1. Aplicar la migración SQL
2. Agregar los componentes al layout
3. Configurar el cron job

Todo el código sigue los patrones establecidos del proyecto y está documentado con JSDoc.
