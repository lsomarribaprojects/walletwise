/**
 * Tipos para el sistema de suscripciones
 */

// =====================================================
// ENUMS Y CONSTANTES
// =====================================================

export type SubscriptionTier = 'starter' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium'
}

export const TIER_PRICES: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
  starter: { monthly: 0, yearly: 0 },
  pro: { monthly: 9.99, yearly: 99.99 },
  premium: { monthly: 19.99, yearly: 199.99 }
}

export const TIER_COLORS: Record<SubscriptionTier, string> = {
  starter: '#6B7280',  // gray
  pro: '#8B5CF6',      // purple
  premium: '#F59E0B'   // amber/gold
}

// =====================================================
// INTERFACES
// =====================================================

export interface TierLimits {
  transactions: number        // -1 = ilimitado
  accounts: number
  recurring: number
  credit_cards: number
  loans: number
  cfo_messages: number
  receipt_scans: number
  futures_module: boolean
  monte_carlo: boolean
  credit_scores: boolean
  reports_export: boolean
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  starter: {
    transactions: 100,
    accounts: 3,
    recurring: 5,
    credit_cards: 0,
    loans: 0,
    cfo_messages: 10,
    receipt_scans: 5,
    futures_module: false,
    monte_carlo: false,
    credit_scores: false,
    reports_export: false
  },
  pro: {
    transactions: -1,
    accounts: 10,
    recurring: -1,
    credit_cards: 5,
    loans: 5,
    cfo_messages: 100,
    receipt_scans: 50,
    futures_module: true,
    monte_carlo: false,
    credit_scores: false,
    reports_export: true
  },
  premium: {
    transactions: -1,
    accounts: -1,
    recurring: -1,
    credit_cards: -1,
    loans: -1,
    cfo_messages: -1,
    receipt_scans: -1,
    futures_module: true,
    monte_carlo: true,
    credit_scores: true,
    reports_export: true
  }
}

export interface SubscriptionUsage {
  transactions: number
  cfo_messages: number
  receipt_scans: number
}

export interface UserSubscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  trial_start: string | null
  trial_end: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  limits: TierLimits
  usage: SubscriptionUsage
}

export interface SubscriptionEvent {
  id: string
  user_id: string
  event_type: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'payment_failed'
  from_tier: SubscriptionTier | null
  to_tier: SubscriptionTier | null
  stripe_event_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// =====================================================
// FEATURES POR TIER
// =====================================================

export type FeatureName =
  | 'transactions'
  | 'accounts'
  | 'recurring'
  | 'credit_cards'
  | 'loans'
  | 'cfo_messages'
  | 'receipt_scans'
  | 'futures_module'
  | 'monte_carlo'
  | 'credit_scores'
  | 'reports_export'

export interface TierFeature {
  name: string
  description: string
  starter: string | boolean
  pro: string | boolean
  premium: string | boolean
}

export const TIER_FEATURES: TierFeature[] = [
  {
    name: 'Transacciones',
    description: 'Registro de ingresos y gastos',
    starter: '100/mes',
    pro: 'Ilimitadas',
    premium: 'Ilimitadas'
  },
  {
    name: 'Cuentas',
    description: 'Cuentas bancarias y de efectivo',
    starter: '3',
    pro: '10',
    premium: 'Ilimitadas'
  },
  {
    name: 'Gastos recurrentes',
    description: 'Suscripciones y pagos automáticos',
    starter: '5',
    pro: 'Ilimitados',
    premium: 'Ilimitados'
  },
  {
    name: 'Tarjetas de crédito',
    description: 'Gestión de deuda y pagos',
    starter: false,
    pro: '5',
    premium: 'Ilimitadas'
  },
  {
    name: 'Préstamos',
    description: 'Tracking de préstamos personales',
    starter: false,
    pro: '5',
    premium: 'Ilimitados'
  },
  {
    name: 'CFO Virtual',
    description: 'Asistente de IA financiero',
    starter: '10 mensajes/mes',
    pro: '100 mensajes/mes',
    premium: 'Ilimitado'
  },
  {
    name: 'Escaneo de recibos',
    description: 'OCR con IA para facturas',
    starter: '5/mes',
    pro: '50/mes',
    premium: 'Ilimitado'
  },
  {
    name: 'Módulo Futuros',
    description: 'Proyecciones y planes de deuda',
    starter: false,
    pro: true,
    premium: true
  },
  {
    name: 'Simulación Monte Carlo',
    description: 'Análisis probabilístico avanzado',
    starter: false,
    pro: false,
    premium: true
  },
  {
    name: 'Credit Scores',
    description: 'Tracking de score crediticio',
    starter: false,
    pro: false,
    premium: true
  },
  {
    name: 'Exportar reportes',
    description: 'PDF y Excel de finanzas',
    starter: false,
    pro: true,
    premium: true
  }
]

// =====================================================
// STRIPE
// =====================================================

export interface CreateCheckoutParams {
  tier: 'pro' | 'premium'
  interval: 'month' | 'year'
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSession {
  sessionId: string
  url: string
}
