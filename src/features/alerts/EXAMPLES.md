# Ejemplos de Uso - Sistema de Alertas

## Casos de Uso Comunes

### 1. Agregar AlertDropdown al Header

```tsx
// src/components/Header.tsx
'use client'

import { AlertDropdown } from '@/features/alerts'
import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Walletwise
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/transactions">Transacciones</Link>

          {/* AlertDropdown */}
          <AlertDropdown maxAlerts={5} />

          <Link href="/profile">Perfil</Link>
        </div>
      </nav>
    </header>
  )
}
```

### 2. AlertBanner en Dashboard

```tsx
// src/app/(main)/dashboard/page.tsx
'use client'

import { AlertBanner, useAlerts } from '@/features/alerts'

export default function DashboardPage() {
  const { highPriorityAlerts, dismiss } = useAlerts()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Banner de alertas críticas */}
      {highPriorityAlerts.length > 0 && (
        <div className="mb-6">
          <AlertBanner
            alerts={highPriorityAlerts}
            onDismiss={dismiss}
            maxAlerts={3}
            autoRotate={true}
            rotateInterval={5000}
          />
        </div>
      )}

      {/* Resto del dashboard */}
      <h1>Dashboard</h1>
      {/* ... */}
    </div>
  )
}
```

### 3. Página Completa de Alertas

```tsx
// src/app/(main)/alerts/page.tsx
import { AlertsPage } from '@/features/alerts/components/AlertsPage'

export const metadata = {
  title: 'Alertas | Walletwise',
  description: 'Gestiona tus notificaciones y alertas financieras'
}

export default function AlertsRoute() {
  return <AlertsPage />
}
```

### 4. Lista Custom de Alertas

```tsx
// src/components/CustomAlertsList.tsx
'use client'

import { useAlerts, AlertCard } from '@/features/alerts'

export function CustomAlertsList() {
  const {
    alerts,
    isLoading,
    markRead,
    dismiss
  } = useAlerts({
    is_dismissed: false,
    type: 'warning' // Solo advertencias
  })

  if (isLoading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Advertencias Activas</h2>

      {alerts.length === 0 ? (
        <p className="text-gray-500">No hay advertencias</p>
      ) : (
        alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onRead={markRead}
            onDismiss={dismiss}
          />
        ))
      )}
    </div>
  )
}
```

### 5. Badge de Contador Simple

```tsx
// src/components/AlertsBadge.tsx
'use client'

import { useUnreadCount } from '@/features/alerts'
import Link from 'next/link'

export function AlertsBadge() {
  const { count, hasUnread } = useUnreadCount()

  return (
    <Link
      href="/alerts"
      className="relative inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
    >
      Alertas

      {hasUnread && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
```

### 6. Crear Alerta Manualmente

```tsx
// src/app/actions/createCustomAlert.ts
'use server'

import { createAlert } from '@/features/alerts'

export async function createCustomAlert() {
  await createAlert({
    type: 'recommendation',
    priority: 'medium',
    title: 'Revisa tus gastos',
    message: 'Has gastado más de lo habitual este mes.',
    action_label: 'Ver gastos',
    action_href: '/transactions',
    metadata: {
      custom_field: 'valor'
    }
  })
}
```

### 7. Ejecutar Detectores Manualmente

```tsx
// src/app/actions/runDetectors.ts
'use server'

import { runAllDetectors, createAlerts } from '@/features/alerts'

export async function runDetectorsManually() {
  try {
    const result = await runAllDetectors()

    if (result.alerts.length > 0) {
      await createAlerts(result.alerts)
    }

    return {
      success: true,
      alertsCreated: result.alerts.length
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    }
  }
}
```

### 8. Widget de Alertas en Sidebar

```tsx
// src/components/AlertsWidget.tsx
'use client'

import { useAlerts, AlertCard } from '@/features/alerts'

export function AlertsWidget() {
  const { unreadAlerts, markRead, dismiss } = useAlerts()

  // Mostrar solo las 3 más recientes
  const recentAlerts = unreadAlerts.slice(0, 3)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Alertas Recientes</h3>
        {unreadAlerts.length > 3 && (
          <a href="/alerts" className="text-sm text-purple-600 hover:underline">
            Ver todas ({unreadAlerts.length})
          </a>
        )}
      </div>

      {recentAlerts.length === 0 ? (
        <p className="text-sm text-gray-500">No hay alertas nuevas</p>
      ) : (
        <div className="space-y-2">
          {recentAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={markRead}
              onDismiss={dismiss}
              compact
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### 9. Filtrar Alertas por Tipo

```tsx
// src/components/OpportunityAlerts.tsx
'use client'

import { useAlerts, AlertCard } from '@/features/alerts'

export function OpportunityAlerts() {
  const { opportunityAlerts, markRead, dismiss } = useAlerts()

  return (
    <div>
      <h2>Oportunidades de Ahorro</h2>

      {opportunityAlerts.map(alert => (
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

### 10. Alert Store (Estado Global)

```tsx
// src/components/GlobalAlertManager.tsx
'use client'

import { useEffect } from 'react'
import { useAlertStore } from '@/features/alerts'

export function GlobalAlertManager() {
  const {
    unreadCount,
    fetchUnreadCount,
    refresh
  } = useAlertStore()

  // Actualizar cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Alertas:</span>
        <span className="font-bold text-purple-600">{unreadCount}</span>
        <button
          onClick={refresh}
          className="ml-2 text-sm text-blue-600 hover:underline"
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
```

## Snippets SQL Útiles

### Crear Alerta de Prueba

```sql
-- Insertar alerta de prueba
INSERT INTO user_alerts (user_id, type, priority, title, message, action_label, action_href)
VALUES (
  'tu-user-id-aqui',
  'warning',
  'high',
  'Alerta de Prueba',
  'Esta es una alerta de prueba para verificar que el sistema funciona correctamente.',
  'Ver detalles',
  '/dashboard'
);
```

### Ver Alertas de un Usuario

```sql
-- Ver todas las alertas de un usuario
SELECT
  id,
  type,
  priority,
  title,
  is_read,
  is_dismissed,
  created_at
FROM user_alerts
WHERE user_id = 'tu-user-id-aqui'
ORDER BY created_at DESC;
```

### Estadísticas de Alertas

```sql
-- Estadísticas por tipo y prioridad
SELECT
  type,
  priority,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE is_dismissed = true) as dismissed
FROM user_alerts
WHERE user_id = 'tu-user-id-aqui'
GROUP BY type, priority
ORDER BY type, priority;
```

### Limpiar Alertas de Prueba

```sql
-- Eliminar todas las alertas de prueba
DELETE FROM user_alerts
WHERE user_id = 'tu-user-id-aqui';
```

## Configuración de Vercel Cron

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup-alerts",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

## Testing con curl

```bash
# Ejecutar detectores manualmente
curl -X POST http://localhost:3000/api/cron/alerts

# Con autenticación
curl -X POST http://localhost:3000/api/cron/alerts \
  -H "Authorization: Bearer tu-cron-secret"

# Ver respuesta formateada
curl -X POST http://localhost:3000/api/cron/alerts | jq
```

## Personalización de Detectores

```typescript
// src/features/alerts/services/customDetector.ts
import { createClient } from '@/lib/supabase/client'
import type { CreateAlertInput } from '../types'

export async function detectLargeTransactions(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  // Buscar transacciones grandes (>$1000)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gt('amount', 1000)
    .gte('transaction_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (transactions && transactions.length > 0) {
    alerts.push({
      type: 'warning',
      priority: 'medium',
      title: 'Transacciones grandes detectadas',
      message: `Has realizado ${transactions.length} transacción(es) mayor(es) a $1,000 en los últimos 7 días.`,
      action_label: 'Ver transacciones',
      action_href: '/transactions'
    })
  }

  return alerts
}

// Agregar a runAllDetectors() en alertDetectors.ts
```

## Tips de Rendimiento

### 1. Lazy Loading de Alertas

```tsx
import dynamic from 'next/dynamic'

const AlertDropdown = dynamic(
  () => import('@/features/alerts').then(mod => mod.AlertDropdown),
  { ssr: false }
)
```

### 2. Debounce de Acciones

```tsx
import { useCallback } from 'react'
import { debounce } from 'lodash'

export function AlertsList() {
  const { markRead } = useAlerts()

  const debouncedMarkRead = useCallback(
    debounce((id: string) => markRead(id), 500),
    [markRead]
  )

  // Usar debouncedMarkRead en lugar de markRead
}
```

### 3. Memoización de Alertas Filtradas

```tsx
import { useMemo } from 'react'
import { useAlerts } from '@/features/alerts'

export function MemoizedAlertsList() {
  const { alerts } = useAlerts()

  const highPriorityWarnings = useMemo(
    () => alerts.filter(a =>
      a.type === 'warning' && a.priority === 'high'
    ),
    [alerts]
  )

  return (
    // Render highPriorityWarnings
  )
}
```
