# Fase 8: Sistema de Alertas Proactivas - Checklist de Integración

## Resumen de Archivos Creados

### Base de Datos
- [x] `supabase/migrations/009_alerts.sql` - Migración SQL completa

### Feature Alerts
- [x] `src/features/alerts/types/index.ts` - Tipos TypeScript
- [x] `src/features/alerts/services/alertService.ts` - CRUD de alertas
- [x] `src/features/alerts/services/alertDetectors.ts` - Detectores inteligentes
- [x] `src/features/alerts/hooks/useAlerts.ts` - Hooks de React
- [x] `src/features/alerts/store/alertStore.ts` - Zustand store
- [x] `src/features/alerts/components/AlertBell.tsx` - Icono con badge
- [x] `src/features/alerts/components/AlertCard.tsx` - Card de alerta
- [x] `src/features/alerts/components/AlertDropdown.tsx` - Dropdown de alertas
- [x] `src/features/alerts/components/AlertBanner.tsx` - Banner crítico
- [x] `src/features/alerts/components/AlertsPage.tsx` - Página completa
- [x] `src/features/alerts/index.ts` - Exportaciones públicas
- [x] `src/features/alerts/README.md` - Documentación

### API
- [x] `src/app/api/cron/alerts/route.ts` - Cron job para detectores

### Tipos Compartidos
- [x] `src/shared/types/database.ts` - Actualizado con tipos de alertas

### Documentación
- [x] `FASE_8_IMPLEMENTACION.md` - Guía de implementación completa
- [x] `FASE_8_CHECKLIST.md` - Este archivo

---

## Checklist de Integración

### 1. Base de Datos

#### 1.1 Aplicar Migración SQL
- [ ] Abrir Supabase Dashboard
- [ ] Ir a SQL Editor
- [ ] Ejecutar el contenido de `supabase/migrations/009_alerts.sql`
- [ ] Verificar que se crearon:
  - [ ] Tabla `user_alerts`
  - [ ] Enums `alert_type` y `alert_priority`
  - [ ] Funciones SQL (get_unread_alerts_count, dismiss_expired_alerts, cleanup_old_alerts)
  - [ ] Políticas RLS
  - [ ] Índices

**Comando alternativo (si tienes Supabase CLI):**
```bash
supabase db push
```

#### 1.2 Verificar Configuración
```sql
-- Verificar tabla existe
SELECT * FROM user_alerts LIMIT 1;

-- Verificar funciones existen
SELECT get_unread_alerts_count('00000000-0000-0000-0000-000000000000');
```

### 2. Integración en Layout/Header

#### 2.1 Agregar AlertDropdown al Header
- [ ] Abrir tu archivo de layout principal (ej: `src/app/(main)/layout.tsx`)
- [ ] Importar: `import { AlertDropdown } from '@/features/alerts'`
- [ ] Agregar componente en el header/navbar
- [ ] Verificar que aparece el icono de campana

**Ejemplo de código:**
```tsx
import { AlertDropdown } from '@/features/alerts'

export default function MainLayout({ children }) {
  return (
    <div>
      <header className="...">
        <nav className="...">
          {/* ... otros elementos ... */}
          <AlertDropdown maxAlerts={5} />
        </nav>
      </header>
      {children}
    </div>
  )
}
```

### 3. Integración en Dashboard

#### 3.1 Agregar AlertBanner al Dashboard
- [ ] Abrir `src/app/(main)/dashboard/page.tsx`
- [ ] Importar: `import { AlertBanner, useAlerts } from '@/features/alerts'`
- [ ] Usar el hook para obtener alertas de alta prioridad
- [ ] Agregar componente AlertBanner antes del contenido principal

**Ejemplo de código:**
```tsx
'use client'

import { AlertBanner, useAlerts } from '@/features/alerts'

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

#### 4.1 Crear Ruta de Alertas
- [ ] Crear archivo: `src/app/(main)/alerts/page.tsx`
- [ ] Importar y usar `AlertsPage`
- [ ] Verificar que la ruta `/alerts` funciona

**Contenido del archivo:**
```tsx
import { AlertsPage } from '@/features/alerts/components/AlertsPage'

export const metadata = {
  title: 'Alertas | Walletwise',
  description: 'Gestiona tus alertas financieras'
}

export default function AlertsRoute() {
  return <AlertsPage />
}
```

### 5. Configurar Cron Job

Elige UNA de las siguientes opciones:

#### Opción A: Vercel Cron (Recomendado para Vercel)
- [ ] Crear/editar `vercel.json` en la raíz del proyecto
- [ ] Agregar configuración de cron
- [ ] Hacer deploy a Vercel
- [ ] Verificar en Dashboard > Cron Jobs

**Contenido de vercel.json:**
```json
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
- [ ] Crear archivo: `.github/workflows/alerts-detector.yml`
- [ ] Configurar secret CRON_SECRET en GitHub
- [ ] Verificar que corre según schedule

#### Opción C: Servicio Externo (EasyCron, etc.)
- [ ] Configurar cron en servicio externo
- [ ] Apuntar a: `POST https://tu-dominio.com/api/cron/alerts`
- [ ] Configurar header de autorización si es necesario

### 6. Variables de Entorno (Opcional)

Si quieres proteger el endpoint del cron:

- [ ] Agregar a `.env.local`:
```env
CRON_SECRET=tu-secret-aleatorio-muy-seguro-aqui
```
- [ ] Agregar a Vercel Environment Variables (si usas Vercel)
- [ ] Reiniciar servidor de desarrollo

### 7. Testing

#### 7.1 Testing Manual de UI
- [ ] Navegar a la aplicación
- [ ] Verificar que aparece AlertBell en el header
- [ ] Click en AlertBell para ver dropdown
- [ ] Navegar a `/alerts` y verificar página completa

#### 7.2 Testing de Detectores
- [ ] Ejecutar manualmente:
```bash
curl -X POST http://localhost:3000/api/cron/alerts
```
- [ ] Revisar logs de consola
- [ ] Verificar que se crearon alertas en la base de datos:
```sql
SELECT * FROM user_alerts ORDER BY created_at DESC LIMIT 10;
```

#### 7.3 Testing de Funcionalidades
- [ ] Crear una alerta manualmente (desde SQL o código)
- [ ] Verificar que aparece en el dropdown
- [ ] Marcar como leída
- [ ] Descartar alerta
- [ ] Verificar contador de alertas

### 8. Optimizaciones Opcionales

#### 8.1 Ajustar Thresholds
- [ ] Revisar `src/features/alerts/services/alertDetectors.ts`
- [ ] Ajustar constantes según tus necesidades:
  - UNUSUAL_SPENDING_MULTIPLIER
  - HIGH_CREDIT_UTILIZATION_THRESHOLD
  - UPCOMING_PAYMENT_DAYS
  - BUDGET_MILESTONES

#### 8.2 Agregar Link de Navegación
- [ ] Agregar link a `/alerts` en el menú principal
- [ ] Agregar badge con contador de alertas

### 9. Monitoreo y Mantenimiento

#### 9.1 Configurar Limpieza Periódica
- [ ] Agregar tarea semanal para ejecutar `cleanup_old_alerts()`
- [ ] Agregar tarea diaria para ejecutar `dismiss_expired_alerts()`

#### 9.2 Revisar Estadísticas
```sql
-- Ver alertas por tipo
SELECT type, COUNT(*) FROM user_alerts GROUP BY type;

-- Ver alertas de alta prioridad no leídas
SELECT * FROM user_alerts
WHERE priority = 'high' AND is_read = false
ORDER BY created_at DESC;
```

---

## Verificación Final

### Checklist de Verificación
- [ ] ✅ Migración SQL aplicada correctamente
- [ ] ✅ AlertDropdown visible en header
- [ ] ✅ AlertBanner funciona en dashboard (si hay alertas de alta prioridad)
- [ ] ✅ Página `/alerts` accesible y funcional
- [ ] ✅ Cron job configurado y ejecutándose
- [ ] ✅ Detectores generando alertas correctamente
- [ ] ✅ Usuarios pueden marcar alertas como leídas
- [ ] ✅ Usuarios pueden descartar alertas
- [ ] ✅ Contador de alertas actualiza correctamente

### Tests de Escenarios

1. **Escenario: Gasto Inusual**
   - [ ] Crear transacciones que superen 2x el promedio en una categoría
   - [ ] Ejecutar detectores
   - [ ] Verificar que se genera alerta de tipo "warning"

2. **Escenario: Alta Utilización de Crédito**
   - [ ] Crear tarjeta de crédito con utilización >30%
   - [ ] Ejecutar detectores
   - [ ] Verificar alerta de "warning"

3. **Escenario: Pago Próximo**
   - [ ] Crear tarjeta con fecha_pago en 2 días
   - [ ] Ejecutar detectores
   - [ ] Verificar alerta de "warning" con prioridad "high"

4. **Escenario: Hito de Presupuesto**
   - [ ] Crear presupuesto y transacciones que alcancen 50%
   - [ ] Ejecutar detectores
   - [ ] Verificar alerta de tipo "milestone"

---

## Soporte y Recursos

### Documentación
- `src/features/alerts/README.md` - Documentación completa de la feature
- `FASE_8_IMPLEMENTACION.md` - Guía de implementación detallada

### Ejemplos de Uso
- Ver `src/features/alerts/components/AlertsPage.tsx` para ejemplo completo

### Troubleshooting

**Problema: No aparecen alertas**
- Verificar que la migración SQL se aplicó correctamente
- Ejecutar detectores manualmente: `POST /api/cron/alerts`
- Revisar logs de consola del navegador y del servidor

**Problema: Contador de alertas no actualiza**
- El hook `useUnreadCount` hace polling cada 30s
- Refresh manual: navegar a otra página y volver
- Verificar que RLS está configurado correctamente

**Problema: Cron job no ejecuta**
- Verificar configuración en Vercel Dashboard
- Revisar logs del cron job
- Probar endpoint manualmente con curl

---

## Próximos Pasos (Post-Implementación)

1. [ ] Recopilar feedback de usuarios sobre alertas
2. [ ] Ajustar thresholds según comportamiento real
3. [ ] Implementar preferencias de usuario (qué alertas recibir)
4. [ ] Agregar notificaciones push (web push)
5. [ ] Implementar digest de alertas por email
6. [ ] Agregar analytics de alertas (cuáles se leen, cuáles se descartan)

---

**Última Actualización:** 2026-01-15
**Versión:** 1.0.0
**Estado:** ✅ Implementación Completa
