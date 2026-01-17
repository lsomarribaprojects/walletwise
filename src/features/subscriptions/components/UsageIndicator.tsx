/**
 * UsageIndicator
 * Muestra el uso actual vs límite de una feature
 */

'use client'

import { useFeatureAccess } from '../hooks/useSubscription'
import { TIER_COLORS, type FeatureName } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface UsageIndicatorProps {
  feature: 'transactions' | 'cfo_messages' | 'receipt_scans'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface UsageBarProps {
  used: number
  limit: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function UsageIndicator({
  feature,
  showLabel = true,
  size = 'md',
  className = ''
}: UsageIndicatorProps) {
  const { usage, limit, percentage, isUnlimited, atLimit, currentTier } = useFeatureAccess(feature)

  if (isUnlimited) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className="text-sm text-gray-500">{getFeatureLabel(feature)}:</span>
        )}
        <span className="text-sm font-medium text-green-600">Ilimitado</span>
      </div>
    )
  }

  const color = atLimit ? '#EF4444' : percentage! >= 80 ? '#F59E0B' : TIER_COLORS[currentTier]

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">{getFeatureLabel(feature)}</span>
          <span className={`text-sm font-medium ${atLimit ? 'text-red-600' : 'text-gray-700'}`}>
            {usage} / {limit}
          </span>
        </div>
      )}
      <UsageBar
        used={usage || 0}
        limit={limit as number}
        color={color}
        size={size}
        showText={!showLabel}
      />
    </div>
  )
}

// =====================================================
// BARRA DE PROGRESO
// =====================================================

export function UsageBar({
  used,
  limit,
  color = '#8B5CF6',
  size = 'md',
  showText = false,
  className = ''
}: UsageBarProps) {
  const percentage = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isUnlimited = limit === -1
  const atLimit = !isUnlimited && used >= limit

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-3'

  return (
    <div className={className}>
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: isUnlimited ? '100%' : `${percentage}%`,
            backgroundColor: isUnlimited ? '#10B981' : color
          }}
        />
      </div>
      {showText && (
        <p className={`text-xs mt-1 ${atLimit ? 'text-red-600' : 'text-gray-500'}`}>
          {isUnlimited ? 'Ilimitado' : `${used}/${limit} (${percentage}%)`}
        </p>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTES DE ESTADÍSTICAS
// =====================================================

/**
 * Card compacto de uso para dashboard
 */
export function UsageCard({
  feature,
  className = ''
}: {
  feature: 'transactions' | 'cfo_messages' | 'receipt_scans'
  className?: string
}) {
  const { usage, limit, percentage, isUnlimited, atLimit } = useFeatureAccess(feature)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          {getFeatureIcon(feature)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{getFeatureLabel(feature)}</p>
          <p className="text-xs text-gray-500">Este mes</p>
        </div>
      </div>

      {isUnlimited ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{usage}</span>
          <span className="text-sm text-green-600 font-medium">Ilimitado</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-2xl font-bold ${atLimit ? 'text-red-600' : 'text-gray-900'}`}>
              {usage}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">{limit}</span>
          </div>
          <UsageBar used={usage || 0} limit={limit as number} size="sm" />
          {atLimit && (
            <p className="text-xs text-red-600 mt-2">Límite alcanzado</p>
          )}
          {!atLimit && percentage! >= 80 && (
            <p className="text-xs text-amber-600 mt-2">Cerca del límite</p>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Resumen de uso para página de suscripción
 */
export function UsageSummary({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-gray-900">Uso este mes</h3>
      <div className="space-y-3">
        <UsageIndicator feature="transactions" />
        <UsageIndicator feature="cfo_messages" />
        <UsageIndicator feature="receipt_scans" />
      </div>
    </div>
  )
}

// =====================================================
// HELPERS
// =====================================================

function getFeatureLabel(feature: 'transactions' | 'cfo_messages' | 'receipt_scans'): string {
  switch (feature) {
    case 'transactions': return 'Transacciones'
    case 'cfo_messages': return 'Mensajes CFO'
    case 'receipt_scans': return 'Escaneos'
  }
}

function getFeatureIcon(feature: 'transactions' | 'cfo_messages' | 'receipt_scans') {
  switch (feature) {
    case 'transactions':
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    case 'cfo_messages':
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    case 'receipt_scans':
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default UsageIndicator
