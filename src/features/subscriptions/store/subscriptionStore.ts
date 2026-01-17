/**
 * Store de Suscripciones
 * Maneja el estado global de suscripciones con Zustand
 */

import { create } from 'zustand'
import type { SubscriptionInfo, SubscriptionTier } from '../types'
import { getSubscriptionInfo } from '../services/subscriptionService'

// =====================================================
// TIPOS DEL STORE
// =====================================================

interface SubscriptionState {
  // Estado
  subscription: SubscriptionInfo | null
  isLoading: boolean
  error: string | null
  lastFetched: Date | null

  // Acciones
  fetchSubscription: () => Promise<void>
  setSubscription: (subscription: SubscriptionInfo | null) => void
  clearSubscription: () => void

  // Getters computados
  getTier: () => SubscriptionTier
  canUseFeature: (feature: keyof SubscriptionInfo['limits']) => boolean
  isAtLimit: (feature: 'transactions' | 'cfo_messages' | 'receipt_scans') => boolean
  getUsagePercentage: (feature: 'transactions' | 'cfo_messages' | 'receipt_scans') => number
}

// =====================================================
// STORE
// =====================================================

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Estado inicial
  subscription: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Acciones
  fetchSubscription: async () => {
    set({ isLoading: true, error: null })

    try {
      const subscription = await getSubscriptionInfo()
      set({
        subscription,
        isLoading: false,
        lastFetched: new Date()
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading subscription',
        isLoading: false
      })
    }
  },

  setSubscription: (subscription) => {
    set({ subscription, lastFetched: new Date() })
  },

  clearSubscription: () => {
    set({
      subscription: null,
      isLoading: false,
      error: null,
      lastFetched: null
    })
  },

  // Getters
  getTier: () => {
    const { subscription } = get()
    return subscription?.tier || 'starter'
  },

  canUseFeature: (feature) => {
    const { subscription } = get()
    if (!subscription) return false

    const limit = subscription.limits[feature]

    // Features booleanas
    if (typeof limit === 'boolean') {
      return limit
    }

    // Features con límites numéricos
    if (limit === -1) return true // Ilimitado
    if (limit === 0) return false // No disponible

    // Verificar uso para features con contador
    const usageFeatures = ['transactions', 'cfo_messages', 'receipt_scans'] as const
    if (usageFeatures.includes(feature as typeof usageFeatures[number])) {
      const usage = subscription.usage[feature as keyof typeof subscription.usage]
      return usage < limit
    }

    return true
  },

  isAtLimit: (feature) => {
    const { subscription } = get()
    if (!subscription) return false

    const limit = subscription.limits[feature]
    if (typeof limit === 'boolean' || limit === -1) return false

    const usage = subscription.usage[feature]
    return usage >= limit
  },

  getUsagePercentage: (feature) => {
    const { subscription } = get()
    if (!subscription) return 0

    const limit = subscription.limits[feature]
    if (typeof limit === 'boolean' || limit === -1) return 0
    if (limit === 0) return 100

    const usage = subscription.usage[feature]
    return Math.min(100, Math.round((usage / limit) * 100))
  }
}))

// =====================================================
// SELECTORES
// =====================================================

export const selectSubscription = (state: SubscriptionState) => state.subscription
export const selectTier = (state: SubscriptionState) => state.getTier()
export const selectIsLoading = (state: SubscriptionState) => state.isLoading
export const selectError = (state: SubscriptionState) => state.error
