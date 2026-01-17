# Walletwise - Product Overview

## Resumen Ejecutivo

**Walletwise** es una aplicación SaaS de gestión financiera personal inteligente que combina el tracking tradicional de finanzas con un **CFO Virtual potenciado por IA** (Google Gemini 2.5). Permite a los usuarios tomar control de sus finanzas personales con insights personalizados y planes de acción concretos.

---

## Qué Hace la App (Estado Actual)

### 1. Dashboard Financiero Completo

| Feature | Descripción |
|---------|-------------|
| **KPIs en tiempo real** | Ingresos, gastos, balance neto, total de transacciones |
| **Gráfico de tendencias** | Visualización temporal de ingresos vs gastos |
| **Distribución por categoría** | Pie/donut chart de gastos por categoría |
| **Health Score** | Indicador de salud financiera |
| **Balance proyectado** | Proyección considerando gastos comprometidos |

### 2. Gestión de Transacciones

| Feature | Descripción |
|---------|-------------|
| **CRUD completo** | Crear, leer, actualizar, eliminar transacciones |
| **3 tipos** | Ingreso, Gasto, Transferencia entre cuentas |
| **Categorización** | Categorías predefinidas con colores |
| **Filtros temporales** | Hoy, semana, mes, trimestre, año, todo |
| **Tabla interactiva** | Ordenable, searchable, editable |

### 3. Múltiples Cuentas

| Feature | Descripción |
|---------|-------------|
| **5 tipos de cuenta** | Débito, Crédito, Efectivo, Ahorro, Inversión |
| **Balances individuales** | Balance calculado por cuenta |
| **Colores personalizados** | UI distingue cada cuenta visualmente |
| **Transferencias** | Mover dinero entre cuentas |

### 4. Gastos Recurrentes

| Feature | Descripción |
|---------|-------------|
| **Mensuales** | Netflix, Spotify, gimnasio, etc. |
| **Anuales** | Seguros, dominios, suscripciones anuales |
| **Auto-procesamiento** | Crea transacciones automáticamente en fecha |
| **Gestión de compromisos** | Ve cuánto tienes comprometido vs disponible |

### 5. Tarjetas de Crédito y Deuda

| Feature | Descripción |
|---------|-------------|
| **CRUD de tarjetas** | Agregar múltiples tarjetas con APR, límite, saldo |
| **Métricas de deuda** | Deuda total, utilización, tasa promedio ponderada |
| **Intereses proyectados** | Calcula cuánto pagas en intereses mensualmente |
| **2 estrategias de pago** | Avalancha (mayor APR primero) vs Bola de Nieve (menor saldo primero) |
| **Plan de pago detallado** | Mes a mes, cuánto pagar a cada tarjeta |
| **Comparador** | Muestra cuál estrategia ahorra más dinero |
| **Indicadores de salud** | Utilización: Excellent (<10%), Good (10-30%), Warning (30-50%), Danger (>50%) |

### 6. CFO Virtual (Agente IA)

| Feature | Descripción |
|---------|-------------|
| **Chat conversacional** | Interfaz de chat con historial |
| **Modelo Gemini 2.5 Flash** | IA rápida y precisa |
| **Context awareness** | Ve tus transacciones, gastos, deuda en tiempo real |
| **Streaming responses** | Respuestas en tiempo real (SSE) |
| **Análisis de recibos** | Sube foto de ticket, IA extrae datos |
| **Historial persistente** | Conversaciones guardadas en BD |
| **Múltiples acciones** | Think, Analyze, Calculate, Recommend, Alert |

### 7. Sistema de Usuarios

| Feature | Descripción |
|---------|-------------|
| **Auth email/password** | Supabase Auth integrado |
| **Sistema de aprobación** | Admin aprueba nuevos usuarios |
| **Roles** | User y Admin |
| **Perfil** | Nombre, email, timezone, moneda |

### 8. Panel Administrativo

| Feature | Descripción |
|---------|-------------|
| **Gestión de usuarios** | Aprobar/rechazar, ver lista |
| **Gestión de categorías** | Crear categorías personalizadas |
| **Configuración del Agent** | Editar prompts del CFO |

### 9. Internacionalización

| Feature | Descripción |
|---------|-------------|
| **2 idiomas** | Español e Inglés |
| **Cambio dinámico** | Selector en UI |

---

## Dolores que Resuelve

| Dolor del Usuario | Cómo lo Resuelve Walletwise |
|-------------------|------------------------------|
| "No sé en qué se me va el dinero" | Dashboard con KPIs y distribución por categoría |
| "Olvido pagar servicios" | Gastos recurrentes con auto-procesamiento |
| "Tengo varias tarjetas y no sé cómo salir de deuda" | Planes de pago con 2 estrategias + comparador |
| "No entiendo conceptos financieros" | CFO Virtual explica en lenguaje simple |
| "Pierdo tickets y recibos" | Escáner con IA que extrae datos automáticamente |
| "No puedo proyectar mi situación" | Balance proyectado con gastos comprometidos |
| "Manejo varias cuentas" | Overview consolidado con balances por cuenta |
| "Quiero mejorar mi situación pero no sé cómo" | Recomendaciones personalizadas del CFO |

---

## Mejoras Planificadas

### Prioridad 1: Sistema de Módulos/Tiers (Monetización Futura)

**Objetivo:** Estructurar la app en módulos que el usuario desbloquea según su plan de pago.

| Tier | Nombre | Módulos | Precio Futuro |
|------|--------|---------|---------------|
| 1 | **Budget Basics** | Dashboard, Transacciones, Cuentas, Recurrentes, CFO básico | FREE |
| 2 | **Debt Crusher** | + Tarjetas de crédito, Credit Scores, Planes de deuda, Presupuestos | $9.99/mes |
| 3 | **Wealth Builder** | + Metas financieras, Inversiones, Patrimonio neto, Proyecciones | $19.99/mes |

**Implementación:**
- Nueva tabla `user_tier_config` con suscripción y módulos habilitados
- Componente `ModuleGate` que bloquea features según tier
- UI de upgrade con Stripe integration ready
- El usuario elige su nivel de compromiso financiero

### Prioridad 2: Credit Scores (FICO, VantageScore, Experian)

**Objetivo:** Permitir al usuario trackear su score crediticio y que la IA aprenda de su evolución.

| Feature | Descripción |
|---------|-------------|
| **3 tipos de score** | FICO (300-850), VantageScore (300-850), Experian PLUS (330-830) |
| **Entrada manual** | Usuario ingresa su score periódicamente |
| **Historial** | Gráfico de evolución en el tiempo |
| **Factores** | Usuario puede registrar: utilización, hard inquiries, edad de crédito |
| **Tendencia** | Improving, Stable, Declining basado en historial |
| **Integración CFO** | La IA ve el score y da recomendaciones para mejorarlo |
| **Correlaciones** | "Tu score subió cuando bajaste utilización al 30%" |

**Nueva tabla:** `credit_scores` con historial mensual

### Prioridad 3: Presupuestos (Budget) - Tabla Existe, Falta UI

**Objetivo:** Activar la funcionalidad de presupuestos que ya tiene schema en BD.

| Feature | Descripción |
|---------|-------------|
| **Presupuesto por categoría** | "Máximo $500/mes en Comida" |
| **Períodos** | Diario, semanal, mensual, trimestral, anual |
| **Alertas** | Notificar cuando alcance 80% del límite |
| **Visualización** | Barra de progreso por categoría |
| **Integración CFO** | "Vas al 85% de tu presupuesto de entretenimiento" |

### Prioridad 4: Metas Financieras

**Objetivo:** Permitir al usuario definir objetivos y trackear progreso.

| Feature | Descripción |
|---------|-------------|
| **Tipos de meta** | Fondo emergencia, Viaje, Casa, Retiro, Libre deuda |
| **Target amount** | Monto objetivo |
| **Deadline** | Fecha límite opcional |
| **Contribuciones** | Trackear depósitos hacia la meta |
| **Progreso visual** | Gauge o barra de progreso |
| **Proyección** | "A este ritmo, llegarás en 8 meses" |

**Nueva tabla:** `financial_goals`

### Prioridad 5: Notificaciones y Alertas

**Objetivo:** Sistema proactivo de avisos.

| Tipo | Trigger |
|------|---------|
| **Fecha de pago** | 3 días antes de fecha de pago de tarjeta |
| **Presupuesto** | Al alcanzar 80%, 100% del límite |
| **Gasto inusual** | Transacción 2x mayor al promedio de categoría |
| **Meta alcanzada** | Cuando llega al 100% |
| **Score mejoró** | Cuando sube más de 10 puntos |
| **Utilización alta** | Si supera 30% de utilización |

**Implementación:** Push notifications, email, in-app

### Prioridad 6: Reportes Exportables

**Objetivo:** Generar documentos descargables.

| Reporte | Contenido |
|---------|-----------|
| **Resumen mensual** | KPIs, top gastos, comparativa mes anterior |
| **Estado de deuda** | Todas las tarjetas, plan de pago, proyección |
| **Año fiscal** | Resumen anual para taxes |

**Formatos:** PDF, Excel/CSV

---

## Cosas Pendientes (Backlog Técnico)

### Bugs y Deuda Técnica

| Issue | Descripción | Status |
|-------|-------------|--------|
| CFO usaba USD en vez de MXN | Fix aplicado en commit `9839c83` | DONE |
| Tabla `budgets` sin UI | Schema existe pero no hay componentes | PENDIENTE |
| Sin paginación en transacciones | Carga todo sin límite | PENDIENTE |
| Sin tests E2E | Playwright configurado pero sin tests | PENDIENTE |
| Validación de fechas en recurrentes | No valida coherencia fecha_corte vs fecha_pago | PENDIENTE |

### Features Incompletas

| Feature | Estado | Pendiente |
|---------|--------|-----------|
| Presupuestos | Schema en BD | UI completa, alertas |
| Reportes | Ruta existe `/finances/reports` | Generación de PDFs |
| Onboarding | Wizard básico | Flujo completo con tier selection |
| Admin categorías | Componente existe | CRUD completo funcional |

### Infraestructura

| Item | Estado | Pendiente |
|------|--------|-----------|
| Tests unitarios | Jest configurado | Escribir tests para services |
| Tests E2E | Playwright MCP listo | Escribir flujos críticos |
| CI/CD | No configurado | GitHub Actions |
| Monitoring | No configurado | Sentry, LogRocket |
| Rate limiting API | No implementado | Proteger endpoints del agent |

---

## Stack Tecnológico

```yaml
Frontend:
  - Next.js 16 (App Router + Turbopack)
  - React 19
  - TypeScript 5.7
  - Tailwind CSS 3.4
  - Zustand (State Management)
  - Chart.js + react-chartjs-2
  - Lucide React (Icons)

Backend:
  - Supabase (PostgreSQL + Auth + RLS)
  - API Routes de Next.js
  - Server-Sent Events (Streaming)

AI/ML:
  - Google Gemini 2.5 Flash
  - Vercel AI SDK
  - Vision para análisis de recibos

Tooling:
  - ESLint + Prettier
  - Jest + React Testing Library
  - Zod (Validación)
```

---

## Modelo de Datos Actual

```
profiles          → Usuarios con roles y aprobación
accounts          → Cuentas bancarias del usuario
categories        → Categorías de ingreso/gasto
transactions      → Transacciones financieras
recurring_expenses→ Gastos mensuales/anuales
budgets           → Presupuestos por categoría (sin UI)
credit_cards      → Tarjetas de crédito
credit_card_payments → Historial de pagos
cfo_conversations → Historial del chat con IA
admin_config      → Configuraciones del sistema
```

---

## Roadmap Resumido

### Fase 1: Completar Core (Actual)
- [x] Dashboard con KPIs
- [x] CRUD Transacciones
- [x] Múltiples cuentas
- [x] Gastos recurrentes
- [x] Tarjetas de crédito
- [x] CFO Virtual
- [ ] Presupuestos UI
- [ ] Tests básicos

### Fase 2: Credit Intelligence
- [ ] Sistema de tiers/módulos
- [ ] Credit Scores tracking
- [ ] Integración CFO + scores
- [ ] Correlaciones automáticas

### Fase 3: Goals & Alerts
- [ ] Metas financieras
- [ ] Sistema de notificaciones
- [ ] Reportes exportables
- [ ] Dashboard móvil optimizado

### Fase 4: Monetización
- [ ] Integración Stripe
- [ ] Planes de pago
- [ ] Feature gating por tier
- [ ] Trials y promos

### Fase 5: Scale
- [ ] Conexión bancaria (Plaid/Belvo)
- [ ] PWA offline
- [ ] Multi-currency
- [ ] API pública

---

## Métricas de Éxito (Propuestas)

| Métrica | Target |
|---------|--------|
| **Retención D7** | >40% usuarios activos a los 7 días |
| **Transacciones/usuario** | >20 por mes promedio |
| **CFO engagement** | >5 conversaciones por usuario/mes |
| **Conversión Free→Pro** | >5% |
| **NPS** | >50 |

---

*Documento generado: 2026-01-15*
*Versión: 1.0*
