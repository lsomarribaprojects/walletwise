/**
 * Feature: Alerts
 * Sistema de Alertas Proactivas
 *
 * @description
 * Sistema inteligente que detecta patrones financieros y genera alertas
 * automáticas para ayudar al usuario a tomar mejores decisiones.
 *
 * @features
 * - Detección de gastos inusuales (>2x promedio)
 * - Alertas de alta utilización de crédito (>30%)
 * - Recordatorios de pagos próximos (3 días antes)
 * - Hitos de presupuesto (25%, 50%, 75%, 100%)
 * - Oportunidades de ahorro detectadas
 * - Sistema de prioridades (low, medium, high)
 * - Notificaciones en tiempo real
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  Alert,
  AlertType,
  AlertPriority,
  AlertMetadata,
  CreateAlertInput,
  UpdateAlertInput,
  AlertFilters,
  AlertsSummary,
  DetectionResult,
  DetectorConfig,
  AlertDetectorConfigs
} from './types'

// ============================================================================
// SERVICES
// ============================================================================

export {
  getAlerts,
  getActiveAlerts,
  getAlertById,
  createAlert,
  createAlerts,
  updateAlert,
  markAsRead,
  markManyAsRead,
  markAllAsRead,
  dismissAlert,
  dismissMany,
  getUnreadCount,
  getAlertsSummary,
  deleteAlert,
  cleanupOldAlerts
} from './services/alertService'

export {
  runAllDetectors
} from './services/alertDetectors'

// ============================================================================
// HOOKS
// ============================================================================

export {
  useAlerts,
  useActiveAlerts,
  useUnreadCount,
  useAlert
} from './hooks/useAlerts'

// ============================================================================
// STORE
// ============================================================================

export {
  useAlertStore,
  selectAlerts,
  selectUnreadCount,
  selectSummary,
  selectIsLoading,
  selectError,
  selectHasUnread
} from './store/alertStore'

// ============================================================================
// COMPONENTS
// ============================================================================

export { AlertBell } from './components/AlertBell'
export { AlertCard } from './components/AlertCard'
export { AlertDropdown } from './components/AlertDropdown'
export { AlertBanner } from './components/AlertBanner'
