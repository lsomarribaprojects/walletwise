/**
 * Hook de Suscripciones
 * Acceso simplificado al estado de suscripción
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useSubscriptionStore } from '../store/subscriptionStore'
import type { SubscriptionTier, FeatureName, TierLimits } from '../types'
import { TIER_LIMITS, TIER_NAMES, TIER_PRICES } from '../types'

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useSubscription() {
  const {
    subscription,
    isLoading,
    error,
    fetchSubscription,
    getTier,
    canUseFeature,
    isAtLimit,
    getUsagePercentage
  } = useSubscriptionStore()

  // Cargar suscripción al montar
  useEffect(() => {
    if (!subscription) {
      fetchSubscription()
    }
  }, [subscription, fetchSubscription])

  // Refrescar suscripción
  const refresh = useCallback(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    // Estado
    subscription,
    tier: getTier(),
    isLoading,
    error,

    // Acciones
    refresh,

    // Verificaciones
    canUseFeature,
    isAtLimit,
    getUsagePercentage,

    // Helpers
    isPro: getTier() === 'pro' || getTier() === 'premium',
    isPremium: getTier() === 'premium',
    isStarter: getTier() === 'starter'
  }
}

// =====================================================
// HOOK PARA VERIFICAR ACCESO A FEATURE
// =====================================================

export function useFeatureAccess(feature: FeatureName) {
  const { subscription, canUseFeature, isAtLimit, getUsagePercentage, tier } = useSubscription()

  const limit = subscription?.limits[feature]
  const isBoolean = typeof limit === 'boolean'
  const isUnlimited = limit === -1
  const isBlocked = isBoolean ? !limit : limit === 0

  // Para features con contador
  const usage = !isBoolean && feature in (subscription?.usage || {})
    ? subscription?.usage[feature as keyof typeof subscription.usage]
    : undefined

  return {
    // Estado de acceso
    hasAccess: canUseFeature(feature),
    isBlocked,
    isUnlimited,

    // Para features con límites
    limit: isBoolean ? null : limit,
    usage,
    percentage: isBoolean ? null : getUsagePercentage(feature as 'transactions' | 'cfo_messages' | 'receipt_scans'),
    atLimit: isBoolean ? false : isAtLimit(feature as 'transactions' | 'cfo_messages' | 'receipt_scans'),

    // Info para upgrade
    currentTier: tier,
    requiredTier: getRequiredTier(feature),
    needsUpgrade: !canUseFeature(feature)
  }
}

// =====================================================
// HOOK PARA INFORMACIÓN DE TIERS
// =====================================================

export function useTierInfo(tier: SubscriptionTier = 'starter') {
  return {
    name: TIER_NAMES[tier],
    limits: TIER_LIMITS[tier],
    prices: TIER_PRICES[tier],
    features: getFeatureList(tier)
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Obtiene el tier mínimo requerido para una feature
 */
function getRequiredTier(feature: FeatureName): SubscriptionTier {
  const starterLimits = TIER_LIMITS.starter
  const proLimits = TIER_LIMITS.pro

  const starterValue = starterLimits[feature]
  const proValue = proLimits[feature]

  // Si starter tiene acceso (valor > 0 o true)
  if ((typeof starterValue === 'boolean' && starterValue) ||
      (typeof starterValue === 'number' && starterValue > 0)) {
    return 'starter'
  }

  // Si pro tiene acceso
  if ((typeof proValue === 'boolean' && proValue) ||
      (typeof proValue === 'number' && proValue !== 0)) {
    return 'pro'
  }

  // Solo premium tiene acceso
  return 'premium'
}

/**
 * Lista de features disponibles por tier
 */
function getFeatureList(tier: SubscriptionTier): string[] {
  const limits = TIER_LIMITS[tier]
  const features: string[] = []

  if (limits.transactions === -1) {
    features.push('Transacciones ilimitadas')
  } else {
    features.push(`${limits.transactions} transacciones/mes`)
  }

  if (limits.accounts === -1) {
    features.push('Cuentas ilimitadas')
  } else {
    features.push(`${limits.accounts} cuentas`)
  }

  if (limits.credit_cards > 0 || limits.credit_cards === -1) {
    features.push(limits.credit_cards === -1 ? 'Tarjetas ilimitadas' : `${limits.credit_cards} tarjetas de crédito`)
  }

  if (limits.loans > 0 || limits.loans === -1) {
    features.push(limits.loans === -1 ? 'Préstamos ilimitados' : `${limits.loans} préstamos`)
  }

  if (limits.cfo_messages === -1) {
    features.push('CFO Virtual ilimitado')
  } else {
    features.push(`${limits.cfo_messages} mensajes CFO/mes`)
  }

  if (limits.futures_module) {
    features.push('Módulo Futuros')
  }

  if (limits.monte_carlo) {
    features.push('Simulación Monte Carlo')
  }

  if (limits.credit_scores) {
    features.push('Tracking de Credit Score')
  }

  if (limits.reports_export) {
    features.push('Exportar reportes')
  }

  return features
}

// =====================================================
// EXPORTS
// =====================================================

export { useSubscriptionStore } from '../store/subscriptionStore'
