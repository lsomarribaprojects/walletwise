/**
 * UpgradeModal
 * Modal para promover upgrade cuando usuario alcanza límite
 */

'use client'

import { useState } from 'react'
import { useSubscription } from '../hooks/useSubscription'
import { redirectToCheckout } from '../services/stripeService'
import { getUpgradeMessage } from '../services/subscriptionService'
import {
  TIER_NAMES,
  TIER_COLORS,
  TIER_PRICES,
  type SubscriptionTier,
  type FeatureName
} from '../types'

// =====================================================
// TIPOS
// =====================================================

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature?: FeatureName
  title?: string
  description?: string
  recommendedTier?: 'pro' | 'premium'
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  title,
  description,
  recommendedTier = 'pro'
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { tier: currentTier } = useSubscription()

  if (!isOpen) return null

  const handleUpgrade = async (tier: 'pro' | 'premium') => {
    setIsLoading(true)
    try {
      await redirectToCheckout(tier, 'month')
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      setIsLoading(false)
    }
  }

  // Determinar mensaje basado en feature o usar custom
  const upgradeMessage = feature ? getUpgradeMessage(feature, currentTier) : null
  const displayTitle = title || (feature ? 'Alcanzaste tu límite' : 'Mejora tu plan')
  const displayDescription = description || upgradeMessage || 'Desbloquea más funcionalidades con un plan superior'

  // Si el usuario ya tiene el tier recomendado, sugerir premium
  const targetTier = currentTier === 'pro' ? 'premium' : recommendedTier

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header con gradiente */}
        <div
          className="px-6 py-8 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${TIER_COLORS[targetTier]}, ${TIER_COLORS[targetTier]}dd)`
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <span className="text-4xl">{targetTier === 'premium' ? '👑' : '🚀'}</span>
          </div>
          <h2 className="text-2xl font-bold">{displayTitle}</h2>
          <p className="text-white/80 mt-2">{displayDescription}</p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Beneficios del tier */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Con {TIER_NAMES[targetTier]} obtienes:
            </h3>
            <ul className="space-y-2">
              {getUpgradeFeatures(targetTier).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Precio */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-600">Precio mensual</span>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  ${TIER_PRICES[targetTier].monthly}
                </span>
                <span className="text-gray-500">/mes</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              O ${TIER_PRICES[targetTier].yearly}/año (ahorra 17%)
            </p>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={() => handleUpgrade(targetTier)}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: TIER_COLORS[targetTier] }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                `Mejorar a ${TIER_NAMES[targetTier]}`
              )}
            </button>

            {/* Si hay premium disponible y no es el target */}
            {targetTier === 'pro' && currentTier === 'starter' && (
              <button
                onClick={() => handleUpgrade('premium')}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
              >
                O ir directo a Premium
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// HELPERS
// =====================================================

function getUpgradeFeatures(tier: 'pro' | 'premium'): string[] {
  if (tier === 'pro') {
    return [
      'Transacciones ilimitadas',
      'Hasta 10 cuentas bancarias',
      '5 tarjetas de crédito',
      '100 mensajes con CFO Virtual/mes',
      'Módulo Futuros (proyecciones)',
      'Exportar reportes PDF/Excel'
    ]
  }

  return [
    'Todo de Pro, más:',
    'Cuentas y tarjetas ilimitadas',
    'CFO Virtual sin límites',
    'Simulación Monte Carlo',
    'Tracking de Credit Score',
    'Soporte prioritario'
  ]
}

// =====================================================
// COMPONENTE SIMPLIFICADO
// =====================================================

/**
 * Banner de upgrade para mostrar en línea
 */
export function UpgradeBanner({
  feature,
  onUpgrade,
  className = ''
}: {
  feature: FeatureName
  onUpgrade?: () => void
  className?: string
}) {
  const { tier } = useSubscription()
  const message = getUpgradeMessage(feature, tier)

  if (tier === 'premium') return null

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-100 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <button
          onClick={onUpgrade}
          className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          Mejorar
        </button>
      </div>
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default UpgradeModal
