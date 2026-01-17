/**
 * Servicio de Suscripciones
 * Maneja la lógica de negocio para suscripciones
 */

import { createClient } from '@/lib/supabase/client'
import type {
  SubscriptionTier,
  SubscriptionInfo,
  TierLimits,
  FeatureName,
  TIER_LIMITS,
  UserSubscription
} from '../types'

// =====================================================
// OBTENER INFORMACIÓN
// =====================================================

/**
 * Obtiene la información completa de suscripción del usuario actual
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Llamar a la función de PostgreSQL
  const { data, error } = await supabase.rpc('get_subscription_info', {
    p_user_id: user.id
  })

  if (error) {
    console.error('Error getting subscription info:', error)
    // Retornar starter por defecto
    return {
      tier: 'starter',
      status: 'active',
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      limits: {
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
      usage: {
        transactions: 0,
        cfo_messages: 0,
        receipt_scans: 0
      }
    }
  }

  return data as SubscriptionInfo
}

/**
 * Obtiene la suscripción raw del usuario
 */
export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error getting subscription:', error)
    return null
  }

  return data
}

// =====================================================
// VERIFICAR ACCESO
// =====================================================

/**
 * Verifica si el usuario puede usar una feature específica
 */
export async function checkFeatureAccess(feature: FeatureName): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('check_feature_access', {
    p_user_id: user.id,
    p_feature: feature
  })

  if (error) {
    console.error('Error checking feature access:', error)
    return false
  }

  return data === true
}

/**
 * Verifica si el usuario tiene un tier mínimo
 */
export async function hasMinimumTier(minTier: SubscriptionTier): Promise<boolean> {
  const info = await getSubscriptionInfo()
  if (!info) return false

  const tierOrder: SubscriptionTier[] = ['starter', 'pro', 'premium']
  const currentIndex = tierOrder.indexOf(info.tier)
  const requiredIndex = tierOrder.indexOf(minTier)

  return currentIndex >= requiredIndex
}

/**
 * Obtiene el límite de una feature
 */
export function getFeatureLimit(
  limits: TierLimits,
  feature: FeatureName
): number | boolean {
  return limits[feature]
}

/**
 * Verifica si una feature tiene límite numérico o es booleana
 */
export function isNumericLimit(feature: FeatureName): boolean {
  return ['transactions', 'accounts', 'recurring', 'credit_cards', 'loans', 'cfo_messages', 'receipt_scans'].includes(feature)
}

// =====================================================
// USO DE FEATURES
// =====================================================

/**
 * Incrementa el contador de uso de una feature
 * Retorna true si se pudo incrementar, false si se alcanzó el límite
 */
export async function incrementUsage(feature: FeatureName): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('increment_usage', {
    p_user_id: user.id,
    p_feature: feature
  })

  if (error) {
    console.error('Error incrementing usage:', error)
    return false
  }

  return data === true
}

/**
 * Obtiene el uso actual de features
 */
export async function getCurrentUsage(): Promise<{
  transactions: number
  cfo_messages: number
  receipt_scans: number
} | null> {
  const info = await getSubscriptionInfo()
  return info?.usage || null
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Calcula el porcentaje de uso de una feature
 */
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0 // Ilimitado
  if (limit === 0) return 100 // No disponible
  return Math.min(100, Math.round((used / limit) * 100))
}

/**
 * Verifica si el usuario está cerca del límite (>80%)
 */
export function isNearLimit(used: number, limit: number): boolean {
  if (limit === -1) return false
  return calculateUsagePercentage(used, limit) >= 80
}

/**
 * Verifica si el usuario alcanzó el límite
 */
export function isAtLimit(used: number, limit: number): boolean {
  if (limit === -1) return false
  return used >= limit
}

/**
 * Formatea el límite para mostrar en UI
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Ilimitado'
  if (limit === 0) return 'No disponible'
  return limit.toString()
}

/**
 * Obtiene el mensaje de upgrade para una feature
 */
export function getUpgradeMessage(feature: FeatureName, currentTier: SubscriptionTier): string {
  const messages: Record<FeatureName, Record<SubscriptionTier, string>> = {
    transactions: {
      starter: 'Mejora a Pro para transacciones ilimitadas',
      pro: 'Ya tienes transacciones ilimitadas',
      premium: 'Ya tienes transacciones ilimitadas'
    },
    accounts: {
      starter: 'Mejora a Pro para más cuentas',
      pro: 'Mejora a Premium para cuentas ilimitadas',
      premium: 'Ya tienes cuentas ilimitadas'
    },
    recurring: {
      starter: 'Mejora a Pro para gastos recurrentes ilimitados',
      pro: 'Ya tienes gastos recurrentes ilimitados',
      premium: 'Ya tienes gastos recurrentes ilimitados'
    },
    credit_cards: {
      starter: 'Mejora a Pro para gestionar tarjetas de crédito',
      pro: 'Mejora a Premium para tarjetas ilimitadas',
      premium: 'Ya tienes tarjetas ilimitadas'
    },
    loans: {
      starter: 'Mejora a Pro para gestionar préstamos',
      pro: 'Mejora a Premium para préstamos ilimitados',
      premium: 'Ya tienes préstamos ilimitados'
    },
    cfo_messages: {
      starter: 'Mejora a Pro para más mensajes con el CFO',
      pro: 'Mejora a Premium para mensajes ilimitados',
      premium: 'Ya tienes mensajes ilimitados'
    },
    receipt_scans: {
      starter: 'Mejora a Pro para más escaneos de recibos',
      pro: 'Mejora a Premium para escaneos ilimitados',
      premium: 'Ya tienes escaneos ilimitados'
    },
    futures_module: {
      starter: 'Mejora a Pro para acceder al módulo Futuros',
      pro: 'Ya tienes acceso al módulo Futuros',
      premium: 'Ya tienes acceso al módulo Futuros'
    },
    monte_carlo: {
      starter: 'Mejora a Premium para simulaciones Monte Carlo',
      pro: 'Mejora a Premium para simulaciones Monte Carlo',
      premium: 'Ya tienes acceso a Monte Carlo'
    },
    credit_scores: {
      starter: 'Mejora a Premium para tracking de credit scores',
      pro: 'Mejora a Premium para tracking de credit scores',
      premium: 'Ya tienes acceso a credit scores'
    },
    reports_export: {
      starter: 'Mejora a Pro para exportar reportes',
      pro: 'Ya puedes exportar reportes',
      premium: 'Ya puedes exportar reportes'
    }
  }

  return messages[feature][currentTier]
}
