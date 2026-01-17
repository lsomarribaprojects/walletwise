# Feature: Sistema de Alertas Proactivas

Sistema inteligente de alertas que detecta patrones financieros y genera notificaciones automáticas para ayudar a los usuarios a tomar mejores decisiones.

## Características

### 1. Tipos de Alertas

#### Warning (Advertencias)
- Gasto inusual detectado (>2x promedio en categoría)
- Alta utilización de crédito (>30%)
- Pagos próximos a vencer (3 días antes)
- Límite de presupuesto cercano (75%, 100%)

#### Opportunity (Oportunidades)
- Oportunidades de ahorro detectadas
- Suscripciones no utilizadas
- Mejores prácticas financieras

#### Milestone (Hitos)
- Meta de presupuesto alcanzada (25%, 50%, 75%)
- Logros financieros

#### Recommendation (Recomendaciones)
- Sugerencias basadas en patrones
- Optimizaciones de gastos

### 2. Sistema de Prioridades

- **High**: Alertas críticas que requieren atención inmediata
- **Medium**: Alertas importantes pero no urgentes
- **Low**: Información y hitos alcanzados

### 3. Detectores Automáticos

#### Unusual Spending Detector
Detecta cuando el gasto en una categoría supera 2x el promedio de los últimos 3 meses.

```typescript
// Configuración
const UNUSUAL_SPENDING_MULTIPLIER = 2.0
const LOOKBACK_MONTHS = 3
```

#### High Credit Utilization Detector
Detecta tarjetas con utilización de crédito >30%.

```typescript
// Configuración
const HIGH_CREDIT_UTILIZATION_THRESHOLD = 0.3 // 30%
```

#### Upcoming Payments Detector
Detecta pagos de tarjetas próximos a vencer.

```typescript
// Configuración
const UPCOMING_PAYMENT_DAYS = 3 // 3 días antes
```

#### Budget Milestones Detector
Detecta cuando se alcanzan hitos de presupuesto.

```typescript
// Hitos
const BUDGET_MILESTONES = [0.25, 0.5, 0.75, 1.0] // 25%, 50%, 75%, 100%
```

#### Savings Opportunities Detector
Detecta gastos recurrentes sin actividad reciente (>3 meses).

```typescript
// Configuración
const LOOKBACK_MONTHS = 3
const MIN_SAVINGS_AMOUNT = 100 // $100/año
```

## Uso

### 1. Componentes UI

#### AlertBell
Icono de campana con badge de contador.

```tsx
import { AlertBell } from '@/features/alerts'

function Header() {
  return (
    <AlertBell onClick={() => console.log('Abrir alertas')} />
  )
}
```

#### AlertDropdown
Dropdown completo con lista de alertas.

```tsx
import { AlertDropdown } from '@/features/alerts'

function Header() {
  return (
    <AlertDropdown maxAlerts={5} />
  )
}
```

#### AlertBanner
Banner para alertas de alta prioridad.

```tsx
import { AlertBanner } from '@/features/alerts'
import { useAlerts } from '@/features/alerts'

function DashboardLayout() {
  const { highPriorityAlerts, dismiss } = useAlerts()

  return (
    <div>
      <AlertBanner
        alerts={highPriorityAlerts}
        onDismiss={dismiss}
        maxAlerts={3}
      />
      {/* Contenido... */}
    </div>
  )
}
```

#### AlertCard
Card individual de alerta.

```tsx
import { AlertCard } from '@/features/alerts'

function AlertsList() {
  const { alerts, markRead, dismiss } = useAlerts()

  return (
    <div>
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onRead={markRead}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
}
```

### 2. Hooks

#### useAlerts
Hook principal para gestionar alertas.

```tsx
import { useAlerts } from '@/features/alerts'

function AlertsPage() {
  const {
    alerts,
    unreadAlerts,
    highPriorityAlerts,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    dismiss,
    refresh
  } = useAlerts()

  return (
    // Tu UI...
  )
}
```

#### useUnreadCount
Hook optimizado para obtener solo el contador.

```tsx
import { useUnreadCount } from '@/features/alerts'

function NotificationBadge() {
  const { count, hasUnread } = useUnreadCount()

  return hasUnread ? <Badge>{count}</Badge> : null
}
```

### 3. Servicios

#### Crear Alerta Manualmente

```typescript
import { createAlert } from '@/features/alerts'

await createAlert({
  type: 'warning',
  priority: 'high',
  title: 'Límite de presupuesto alcanzado',
  message: 'Has gastado el 100% de tu presupuesto de "Entretenimiento".',
  action_label: 'Ver presupuestos',
  action_href: '/budgets',
  metadata: {
    budget_id: 'uuid',
    category_name: 'Entretenimiento'
  }
})
```

#### Ejecutar Detectores

```typescript
import { runAllDetectors } from '@/features/alerts'
import { createAlerts } from '@/features/alerts'

// Ejecutar detectores
const result = await runAllDetectors()

// Crear las alertas detectadas
if (result.alerts.length > 0) {
  await createAlerts(result.alerts)
}
```

### 4. Cron Job / Server Action

Ejecutar detectores diariamente:

```typescript
// src/app/api/cron/alerts/route.ts
import { runAllDetectors, createAlerts } from '@/features/alerts'

export async function GET() {
  try {
    const result = await runAllDetectors()

    if (result.alerts.length > 0) {
      await createAlerts(result.alerts)
    }

    return Response.json({
      success: true,
      alerts_created: result.alerts.length
    })
  } catch (error) {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## Base de Datos

### Tabla: user_alerts

```sql
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type alert_type NOT NULL, -- 'warning' | 'opportunity' | 'milestone' | 'recommendation'
  priority alert_priority NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_href TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Funciones Helper

- `get_unread_alerts_count(user_uuid)` - Obtener conteo de alertas no leídas
- `dismiss_expired_alerts()` - Marcar alertas expiradas como descartadas
- `cleanup_old_alerts()` - Eliminar alertas antiguas (90+ días)

## Integración con Dashboard

```tsx
// src/app/(main)/dashboard/page.tsx
import { AlertBanner, useAlerts } from '@/features/alerts'

export default function DashboardPage() {
  const { highPriorityAlerts, dismiss } = useAlerts()

  return (
    <div>
      {/* Banner de alertas críticas */}
      <AlertBanner
        alerts={highPriorityAlerts}
        onDismiss={dismiss}
        maxAlerts={3}
        autoRotate={true}
      />

      {/* Resto del dashboard... */}
    </div>
  )
}
```

## Configuración Recomendada

### Cron Job
Ejecutar detectores diariamente a las 8:00 AM:

```bash
# Vercel Cron (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Polling en Cliente
Actualizar contador cada 30 segundos (ya implementado en `useUnreadCount`).

## Mejores Prácticas

1. **No crear alertas duplicadas**: Verificar si ya existe una alerta similar antes de crear
2. **Expiración apropiada**: Usar `expires_at` para alertas con fecha límite
3. **Metadata rica**: Incluir toda la información relevante en `metadata`
4. **Prioridades correctas**: Usar `high` solo para alertas críticas
5. **Limpieza periódica**: Ejecutar `cleanup_old_alerts()` semanalmente

## Roadmap

- [ ] Preferencias de alertas por usuario
- [ ] Notificaciones push (web push)
- [ ] Alertas por email
- [ ] Machine Learning para detectores más inteligentes
- [ ] Snooze de alertas
- [ ] Categorías personalizadas de alertas
