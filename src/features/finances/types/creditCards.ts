// types/creditCards.ts
// Tipos para gestión de tarjetas de crédito y asesoría de deuda

// Tarjeta de Crédito
export interface CreditCard {
  id: string
  user_id?: string

  // Info básica
  nombre: string
  banco?: string | null
  ultimos_digitos?: string | null

  // Tasas y límites
  tasa_interes_anual: number // APR como porcentaje (45.00 = 45%)
  limite_credito: number
  saldo_actual: number // Deuda actual

  // Fechas (día del mes 1-31)
  fecha_corte?: number | null
  fecha_pago?: number | null

  // Pagos
  pago_minimo?: number | null
  pago_no_intereses?: number | null

  // Metadata
  color?: string | null
  activa: boolean
  created_at?: string
  updated_at?: string
}

// Input para crear/actualizar tarjeta
export interface CreditCardInput {
  nombre: string
  banco?: string
  ultimos_digitos?: string
  tasa_interes_anual: number
  limite_credito: number
  saldo_actual?: number
  fecha_corte?: number
  fecha_pago?: number
  pago_minimo?: number
  pago_no_intereses?: number
  color?: string
}

// Historial de pagos
export interface CreditCardPayment {
  id: string
  user_id?: string
  credit_card_id: string
  monto: number
  fecha_pago: string
  monto_capital?: number | null
  monto_intereses?: number | null
  saldo_anterior?: number | null
  saldo_nuevo?: number | null
  notas?: string | null
  created_at?: string
}

// Estrategias de pago de deuda
export type DebtPaymentStrategy = 'avalancha' | 'bola_de_nieve'

// Item individual del plan de pago
export interface DebtPaymentPlanItem {
  tarjeta_id: string
  nombre: string
  banco?: string | null
  saldo_actual: number
  tasa_interes: number
  pago_sugerido: number
  orden_pago: number
  meses_para_liquidar: number
  intereses_proyectados: number
}

// Resumen del plan de pago
export interface DebtPaymentSummary {
  deuda_total: number
  pago_mensual_total: number
  meses_totales: number
  intereses_totales: number
  ahorro_vs_minimos: number
}

// Plan de pago completo
export interface DebtPaymentPlan {
  estrategia: DebtPaymentStrategy
  tarjetas: DebtPaymentPlanItem[]
  resumen: DebtPaymentSummary
}

// Métricas agregadas de tarjetas
export interface CreditCardMetrics {
  deuda_total: number
  limite_total: number
  utilizacion_promedio: number // Porcentaje (0-100)
  tasa_promedio_ponderada: number // APR ponderado por saldo
  pago_minimo_total: number
  intereses_mensuales_proyectados: number
  num_tarjetas: number
}

// Comparación de estrategias
export interface StrategyComparison {
  avalancha: DebtPaymentPlan
  bola_de_nieve: DebtPaymentPlan
  recomendacion: string
  ahorro_avalancha: number
}

// Colores disponibles para tarjetas
export const CREDIT_CARD_COLORS = [
  { value: '#9333EA', label: 'Morado' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6366F1', label: 'Indigo' },
] as const

// Bancos principales de Estados Unidos
export const COMMON_BANKS = [
  'Chase',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Capital One',
  'U.S. Bank',
  'PNC Bank',
  'TD Bank',
  'Truist',
  'Goldman Sachs (Marcus)',
  'American Express',
  'Discover',
  'Synchrony',
  'Barclays US',
  'USAA',
  'Navy Federal',
  'Ally Bank',
  'Charles Schwab',
  'Otro',
] as const
