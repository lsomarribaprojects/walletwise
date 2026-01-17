/**
 * SubscriptionBadge
 * Muestra el tier actual del usuario
 */

'use client'

import { useSubscription } from '../hooks/useSubscription'
import { TIER_NAMES, TIER_COLORS, type SubscriptionTier } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface SubscriptionBadgeProps {
  tier?: SubscriptionTier
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

// =====================================================
// COMPONENTE
// =====================================================

export function SubscriptionBadge({
  tier: propTier,
  size = 'md',
  showIcon = true,
  className = ''
}: SubscriptionBadgeProps) {
  const { tier: currentTier, isLoading } = useSubscription()
  const tier = propTier || currentTier

  if (isLoading && !propTier) {
    return (
      <span className={`inline-flex items-center gap-1 bg-gray-100 text-gray-400 rounded-full animate-pulse ${getSizeClasses(size)} ${className}`}>
        <span className="w-12 h-3 bg-gray-200 rounded" />
      </span>
    )
  }

  const color = TIER_COLORS[tier]
  const name = TIER_NAMES[tier]
  const icon = getTierIcon(tier)

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${getSizeClasses(size)} ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color: color
      }}
    >
      {showIcon && <span>{icon}</span>}
      <span>{name}</span>
    </span>
  )
}

// =====================================================
// HELPERS
// =====================================================

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs'
    case 'md':
      return 'px-2.5 py-1 text-sm'
    case 'lg':
      return 'px-3 py-1.5 text-base'
  }
}

function getTierIcon(tier: SubscriptionTier): string {
  switch (tier) {
    case 'starter':
      return '⭐'
    case 'pro':
      return '🚀'
    case 'premium':
      return '👑'
  }
}

// =====================================================
// VARIANTES
// =====================================================

/**
 * Badge compacto solo con icono
 */
export function TierIcon({ tier, className = '' }: { tier?: SubscriptionTier; className?: string }) {
  const { tier: currentTier } = useSubscription()
  const activeTier = tier || currentTier

  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${className}`}
      style={{ backgroundColor: `${TIER_COLORS[activeTier]}15` }}
      title={TIER_NAMES[activeTier]}
    >
      {getTierIcon(activeTier)}
    </span>
  )
}

/**
 * Badge con borde para fondos claros
 */
export function SubscriptionBadgeOutline({
  tier: propTier,
  size = 'md',
  className = ''
}: Omit<SubscriptionBadgeProps, 'showIcon'>) {
  const { tier: currentTier } = useSubscription()
  const tier = propTier || currentTier
  const color = TIER_COLORS[tier]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border-2 bg-white ${getSizeClasses(size)} ${className}`}
      style={{
        borderColor: color,
        color: color
      }}
    >
      <span>{getTierIcon(tier)}</span>
      <span>{TIER_NAMES[tier]}</span>
    </span>
  )
}
