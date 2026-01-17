/**
 * TierGate
 * Componente que bloquea contenido basado en tier de suscripción
 */

'use client'

import { useState, type ReactNode } from 'react'
import { useFeatureAccess } from '../hooks/useSubscription'
import { UpgradeModal } from './UpgradeModal'
import { TIER_NAMES, TIER_COLORS, type FeatureName, type SubscriptionTier } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface TierGateProps {
  children: ReactNode
  feature: FeatureName
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  blur?: boolean
  message?: string
}

interface RequiresTierProps {
  children: ReactNode
  tier: SubscriptionTier
  fallback?: ReactNode
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

/**
 * Bloquea contenido si el usuario no tiene acceso a una feature
 */
export function TierGate({
  children,
  feature,
  fallback,
  showUpgradePrompt = true,
  blur = false,
  message
}: TierGateProps) {
  const [showModal, setShowModal] = useState(false)
  const { hasAccess, needsUpgrade, requiredTier, currentTier, atLimit } = useFeatureAccess(feature)

  // Si tiene acceso, mostrar contenido
  if (hasAccess && !atLimit) {
    return <>{children}</>
  }

  // Fallback personalizado
  if (fallback) {
    return <>{fallback}</>
  }

  // Mensaje por defecto
  const defaultMessage = atLimit
    ? 'Has alcanzado el límite de uso para esta feature'
    : `Esta feature requiere ${TIER_NAMES[requiredTier]}`

  return (
    <>
      <div className="relative">
        {/* Contenido con blur opcional */}
        {blur ? (
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <LockedOverlay
                message={message || defaultMessage}
                requiredTier={requiredTier}
                onUpgrade={showUpgradePrompt ? () => setShowModal(true) : undefined}
              />
            </div>
          </div>
        ) : (
          <LockedCard
            message={message || defaultMessage}
            requiredTier={requiredTier}
            onUpgrade={showUpgradePrompt ? () => setShowModal(true) : undefined}
          />
        )}
      </div>

      {/* Modal de upgrade */}
      {showUpgradePrompt && (
        <UpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          recommendedTier={requiredTier === 'premium' ? 'premium' : 'pro'}
        />
      )}
    </>
  )
}

/**
 * Requiere un tier mínimo para mostrar contenido
 */
export function RequiresTier({ children, tier, fallback }: RequiresTierProps) {
  const { currentTier } = useFeatureAccess('transactions') // Usamos cualquier feature para obtener currentTier

  const tierOrder: SubscriptionTier[] = ['starter', 'pro', 'premium']
  const currentIndex = tierOrder.indexOf(currentTier)
  const requiredIndex = tierOrder.indexOf(tier)

  if (currentIndex >= requiredIndex) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <LockedCard
      message={`Requiere ${TIER_NAMES[tier]} o superior`}
      requiredTier={tier}
    />
  )
}

// =====================================================
// COMPONENTES INTERNOS
// =====================================================

interface LockedProps {
  message: string
  requiredTier: SubscriptionTier
  onUpgrade?: () => void
}

function LockedCard({ message, requiredTier, onUpgrade }: LockedProps) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ backgroundColor: `${TIER_COLORS[requiredTier]}15` }}
      >
        <svg
          className="w-6 h-6"
          style={{ color: TIER_COLORS[requiredTier] }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <p className="text-gray-600 mb-4">{message}</p>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
          style={{ backgroundColor: TIER_COLORS[requiredTier] }}
        >
          Desbloquear con {TIER_NAMES[requiredTier]}
        </button>
      )}
    </div>
  )
}

function LockedOverlay({ message, requiredTier, onUpgrade }: LockedProps) {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg text-center max-w-sm">
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3"
        style={{ backgroundColor: `${TIER_COLORS[requiredTier]}15` }}
      >
        <svg
          className="w-5 h-5"
          style={{ color: TIER_COLORS[requiredTier] }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <p className="text-gray-700 text-sm mb-3">{message}</p>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="px-3 py-1.5 rounded-lg font-medium text-white text-sm transition-colors"
          style={{ backgroundColor: TIER_COLORS[requiredTier] }}
        >
          Desbloquear
        </button>
      )}
    </div>
  )
}

// =====================================================
// HOOK PARA USO PROGRAMÁTICO
// =====================================================

/**
 * Hook para verificar acceso antes de una acción
 */
export function useGate(feature: FeatureName) {
  const [showModal, setShowModal] = useState(false)
  const access = useFeatureAccess(feature)

  const checkAccess = (): boolean => {
    if (!access.hasAccess || access.atLimit) {
      setShowModal(true)
      return false
    }
    return true
  }

  const GateModal = () => (
    <UpgradeModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      feature={feature}
      recommendedTier={access.requiredTier === 'premium' ? 'premium' : 'pro'}
    />
  )

  return {
    ...access,
    checkAccess,
    GateModal
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default TierGate
