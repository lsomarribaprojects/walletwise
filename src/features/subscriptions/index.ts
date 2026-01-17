/**
 * Feature: Subscriptions
 * Sistema de suscripciones con Stripe
 *
 * @module features/subscriptions
 */

// Tipos
export * from './types'

// Hooks
export { useSubscription, useFeatureAccess, useTierInfo, useSubscriptionStore } from './hooks/useSubscription'

// Servicios
export {
  getSubscriptionInfo,
  getUserSubscription,
  checkFeatureAccess,
  hasMinimumTier,
  incrementUsage,
  getCurrentUsage,
  calculateUsagePercentage,
  isNearLimit,
  isAtLimit,
  formatLimit,
  getUpgradeMessage
} from './services/subscriptionService'

export {
  createCheckoutSession,
  redirectToCheckout,
  createPortalSession,
  redirectToPortal,
  formatPrice,
  calculateYearlySavings,
  getRecommendedTier,
  isStripeConfigured,
  STRIPE_PRICE_IDS
} from './services/stripeService'

// Componentes
export {
  SubscriptionBadge,
  TierIcon,
  SubscriptionBadgeOutline,
  PricingTable,
  UpgradeModal,
  UpgradeBanner,
  TierGate,
  RequiresTier,
  useGate,
  UsageIndicator,
  UsageBar,
  UsageCard,
  UsageSummary
} from './components'

// Store
export { useSubscriptionStore as subscriptionStore } from './store/subscriptionStore'
