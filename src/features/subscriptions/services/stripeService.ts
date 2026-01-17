/**
 * Servicio de Stripe
 * Maneja la integración con Stripe para pagos y suscripciones
 */

import type { CreateCheckoutParams, CheckoutSession, SubscriptionTier } from '../types'

// =====================================================
// CONFIGURACIÓN DE PRECIOS
// =====================================================

/**
 * IDs de precios de Stripe (configurar en .env)
 * Estos se crean en el dashboard de Stripe
 */
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || ''
  },
  premium: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    yearly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || ''
  }
}

// =====================================================
// CHECKOUT
// =====================================================

/**
 * Crea una sesión de checkout de Stripe
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutSession> {
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Error creating checkout session')
  }

  return response.json()
}

/**
 * Redirige al checkout de Stripe
 */
export async function redirectToCheckout(
  tier: 'pro' | 'premium',
  interval: 'month' | 'year' = 'month'
): Promise<void> {
  const session = await createCheckoutSession({
    tier,
    interval,
    successUrl: `${window.location.origin}/settings/subscription?success=true`,
    cancelUrl: `${window.location.origin}/settings/subscription?canceled=true`
  })

  // Redirigir a Stripe
  window.location.href = session.url
}

// =====================================================
// PORTAL DE CLIENTE
// =====================================================

/**
 * Crea una sesión del portal de cliente de Stripe
 */
export async function createPortalSession(): Promise<{ url: string }> {
  const response = await fetch('/api/stripe/create-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Error creating portal session')
  }

  return response.json()
}

/**
 * Redirige al portal de cliente de Stripe
 */
export async function redirectToPortal(): Promise<void> {
  const { url } = await createPortalSession()
  window.location.href = url
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Obtiene el precio formateado
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Calcula el ahorro anual
 */
export function calculateYearlySavings(
  monthlyPrice: number,
  yearlyPrice: number
): { amount: number; percentage: number } {
  const fullYearPrice = monthlyPrice * 12
  const savings = fullYearPrice - yearlyPrice
  const percentage = Math.round((savings / fullYearPrice) * 100)

  return { amount: savings, percentage }
}

/**
 * Obtiene el tier recomendado basado en el uso
 */
export function getRecommendedTier(usage: {
  transactions: number
  accounts: number
  credit_cards: number
  cfo_messages: number
}): SubscriptionTier {
  // Si usa muchas features avanzadas, recomendar Premium
  if (usage.credit_cards > 3 || usage.cfo_messages > 50) {
    return 'premium'
  }

  // Si usa features básicas pero necesita más, recomendar Pro
  if (usage.transactions > 50 || usage.accounts > 2) {
    return 'pro'
  }

  return 'starter'
}

/**
 * Verifica si Stripe está configurado
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    STRIPE_PRICE_IDS.pro.monthly &&
    STRIPE_PRICE_IDS.premium.monthly
  )
}
