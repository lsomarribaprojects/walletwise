/**
 * PricingTable
 * Tabla comparativa de planes de suscripción
 */

'use client'

import { useState } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { redirectToCheckout } from '../services/stripeService'
import {
  TIER_NAMES,
  TIER_PRICES,
  TIER_COLORS,
  TIER_FEATURES,
  type SubscriptionTier
} from '../types'

// =====================================================
// TIPOS
// =====================================================

interface PricingTableProps {
  onUpgrade?: (tier: 'pro' | 'premium') => void
  highlightTier?: SubscriptionTier
  showCurrentBadge?: boolean
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PricingTable({
  onUpgrade,
  highlightTier = 'pro',
  showCurrentBadge = true,
  className = ''
}: PricingTableProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const { tier: currentTier, isLoading } = useSubscription()

  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    if (onUpgrade) {
      onUpgrade(tier)
      return
    }

    setLoadingTier(tier)
    try {
      await redirectToCheckout(tier, interval)
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      setLoadingTier(null)
    }
  }

  const tiers: SubscriptionTier[] = ['starter', 'pro', 'premium']

  return (
    <div className={`w-full ${className}`}>
      {/* Toggle mensual/anual */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              interval === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              interval === 'year'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="ml-1 text-xs text-green-600 font-semibold">-17%</span>
          </button>
        </div>
      </div>

      {/* Cards de precios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((tier) => {
          const isHighlighted = tier === highlightTier
          const isCurrent = tier === currentTier
          const price = interval === 'month'
            ? TIER_PRICES[tier].monthly
            : TIER_PRICES[tier].yearly
          const monthlyEquivalent = interval === 'year'
            ? (TIER_PRICES[tier].yearly / 12).toFixed(2)
            : null

          return (
            <div
              key={tier}
              className={`relative rounded-2xl border-2 p-6 ${
                isHighlighted
                  ? 'border-purple-500 shadow-lg shadow-purple-100'
                  : 'border-gray-200'
              }`}
            >
              {/* Badge popular */}
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}

              {/* Badge current */}
              {showCurrentBadge && isCurrent && !isLoading && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Tu plan
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                  style={{ backgroundColor: `${TIER_COLORS[tier]}15` }}
                >
                  <span className="text-2xl">{getTierEmoji(tier)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{TIER_NAMES[tier]}</h3>
                <p className="text-sm text-gray-500 mt-1">{getTierDescription(tier)}</p>
              </div>

              {/* Precio */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    ${price === 0 ? '0' : price.toFixed(2)}
                  </span>
                  <span className="text-gray-500 ml-1">
                    /{interval === 'month' ? 'mes' : 'año'}
                  </span>
                </div>
                {monthlyEquivalent && price > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    ${monthlyEquivalent}/mes facturado anualmente
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <div className="mb-6">
                {tier === 'starter' ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    Plan gratuito
                  </button>
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg font-medium bg-green-100 text-green-700 cursor-not-allowed"
                  >
                    Plan actual
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier as 'pro' | 'premium')}
                    disabled={loadingTier === tier}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isHighlighted
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {loadingTier === tier ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Procesando...
                      </span>
                    ) : (
                      `Mejorar a ${TIER_NAMES[tier]}`
                    )}
                  </button>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {TIER_FEATURES.map((feature, idx) => {
                  const value = feature[tier]
                  const isAvailable = value !== false

                  return (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 text-sm ${
                        isAvailable ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        {isAvailable ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                      <span>
                        {feature.name}
                        {typeof value === 'string' && (
                          <span className="text-gray-500 ml-1">({value})</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
// HELPERS
// =====================================================

function getTierEmoji(tier: SubscriptionTier): string {
  switch (tier) {
    case 'starter': return '⭐'
    case 'pro': return '🚀'
    case 'premium': return '👑'
  }
}

function getTierDescription(tier: SubscriptionTier): string {
  switch (tier) {
    case 'starter': return 'Para empezar a organizar tus finanzas'
    case 'pro': return 'Para tomar control total de tu dinero'
    case 'premium': return 'Para maximizar tu patrimonio'
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default PricingTable
