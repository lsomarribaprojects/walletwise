/**
 * Tipos para el Sistema de Alertas Proactivas
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Tipo de alerta
 */
export type AlertType = 'warning' | 'opportunity' | 'milestone' | 'recommendation'

/**
 * Prioridad de la alerta
 */
export type AlertPriority = 'low' | 'medium' | 'high'

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Alerta del sistema
 */
export interface Alert {
  id: string
  user_id: string
  type: AlertType
  priority: AlertPriority

  // Contenido
  title: string
  message: string

  // Acción opcional (CTA)
  action_label: string | null
  action_href: string | null

  // Estado
  is_read: boolean
  is_dismissed: boolean

  // Expiración opcional
  expires_at: string | null

  // Metadata adicional
  metadata: AlertMetadata

  // Timestamps
  created_at: string
}

/**
 * Metadata flexible para diferentes tipos de alertas
 */
export interface AlertMetadata {
  // Para alertas de gasto inusual
  category_id?: string
  category_name?: string
  amount?: number
  average?: number
  multiplier?: number

  // Para alertas de utilización de crédito
  credit_card_id?: string
  credit_card_name?: string
  utilization_percentage?: number
  current_balance?: number
  credit_limit?: number

  // Para alertas de pagos próximos
  due_date?: string
  payment_amount?: number
  days_until_due?: number

  // Para alertas de hitos
  goal_percentage?: number
  budget_id?: string
  budget_name?: string

  // Para alertas de libertad financiera
  pattern_description?: string
  impact_amount?: number

  // Para alertas de oportunidades de ahorro
  potential_savings?: number
  subscription_ids?: string[]

  // Genérico
  [key: string]: unknown
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input para crear una nueva alerta
 */
export interface CreateAlertInput {
  type: AlertType
  priority?: AlertPriority
  title: string
  message: string
  action_label?: string
  action_href?: string
  expires_at?: string
  metadata?: AlertMetadata
}

/**
 * Input para actualizar una alerta
 */
export interface UpdateAlertInput {
  is_read?: boolean
  is_dismissed?: boolean
}

// ============================================================================
// FILTROS Y CONSULTAS
// ============================================================================

/**
 * Filtros para consultar alertas
 */
export interface AlertFilters {
  type?: AlertType
  priority?: AlertPriority
  is_read?: boolean
  is_dismissed?: boolean
  include_expired?: boolean
}

/**
 * Resumen de alertas
 */
export interface AlertsSummary {
  total_unread: number
  by_type: {
    warning: number
    opportunity: number
    milestone: number
    recommendation: number
  }
  by_priority: {
    low: number
    medium: number
    high: number
  }
  latest_alert: Alert | null
}

// ============================================================================
// DETECTOR TYPES
// ============================================================================

/**
 * Resultado de un detector de alertas
 */
export interface DetectionResult {
  alerts: CreateAlertInput[]
  detected_at: string
  detector_name: string
}

/**
 * Configuración de un detector
 */
export interface DetectorConfig {
  enabled: boolean
  threshold?: number
  lookback_days?: number
  min_transactions?: number
}

/**
 * Configuración de todos los detectores
 */
export interface AlertDetectorConfigs {
  unusual_spending: DetectorConfig
  high_credit_utilization: DetectorConfig
  upcoming_payments: DetectorConfig
  budget_milestones: DetectorConfig
  financial_freedom_patterns: DetectorConfig
  savings_opportunities: DetectorConfig
}
