/**
 * DebtFreedomProjector
 * Visualización de la proyección hacia libertad financiera
 */

'use client'

import { useMemo, useState } from 'react'
import type { DebtFreedomProjection, DebtMilestone } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface DebtFreedomProjectorProps {
  projection: DebtFreedomProjection
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function DebtFreedomProjector({
  projection,
  className = ''
}: DebtFreedomProjectorProps) {
  const [showAllMilestones, setShowAllMilestones] = useState(false)

  // Calcular tiempo restante en formato legible
  const timeRemaining = useMemo(() => {
    const months = projection.monthsToFreedom
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    if (years === 0) {
      return `${remainingMonths} meses`
    } else if (remainingMonths === 0) {
      return `${years} año${years > 1 ? 's' : ''}`
    }
    return `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`
  }, [projection.monthsToFreedom])

  // Milestones a mostrar
  const visibleMilestones = showAllMilestones
    ? projection.milestones
    : projection.milestones.slice(0, 4)

  if (projection.monthsToFreedom === 0) {
    return (
      <div className={`bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white ${className}`}>
        <div className="text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold mb-2">¡Libre de deudas!</h2>
          <p className="text-green-100">
            Felicitaciones, no tienes deudas activas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header con countdown */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white">
        <p className="text-purple-200 text-sm mb-1">Serás libre de deudas en</p>
        <h2 className="text-3xl font-bold mb-2">{timeRemaining}</h2>
        <p className="text-purple-200">
          Fecha estimada:{' '}
          <span className="text-white font-medium">
            {projection.targetDate.toLocaleDateString('es-MX', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </p>

        {/* Mini barra de progreso */}
        <div className="mt-4">
          <div className="h-2 bg-purple-400/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((projection.totalPaid - projection.totalInterestPaid) / projection.totalDebt) * 100)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <StatBox
          label="Deuda total"
          value={`$${projection.totalDebt.toLocaleString()}`}
          color="text-red-600"
        />
        <StatBox
          label="Interés a pagar"
          value={`$${projection.totalInterestPaid.toLocaleString()}`}
          color="text-amber-600"
        />
        <StatBox
          label="Total a pagar"
          value={`$${projection.totalPaid.toLocaleString()}`}
          color="text-gray-900"
        />
      </div>

      {/* Ahorro potencial */}
      {projection.potentialSavings.interestSaved > 0 && (
        <div className="p-4 bg-green-50 border-b border-green-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-medium text-green-900">
                Con ${projection.potentialSavings.withExtraPayment} extra al mes:
              </p>
              <p className="text-sm text-green-700">
                Ahorras <strong>${projection.potentialSavings.interestSaved.toLocaleString()}</strong> en intereses
                y terminas <strong>{projection.potentialSavings.monthsSaved} meses</strong> antes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline de milestones */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Tu camino a la libertad</h3>

        <div className="space-y-3">
          {visibleMilestones.map((milestone, idx) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              isFirst={idx === 0}
              isLast={idx === visibleMilestones.length - 1}
            />
          ))}
        </div>

        {projection.milestones.length > 4 && (
          <button
            onClick={() => setShowAllMilestones(!showAllMilestones)}
            className="w-full mt-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {showAllMilestones
              ? 'Ver menos'
              : `Ver ${projection.milestones.length - 4} milestones más`
            }
          </button>
        )}
      </div>

      {/* Gráfico mini de proyección */}
      <div className="px-4 pb-4">
        <MiniProjectionChart projection={projection.monthlyProjection} />
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function StatBox({
  label,
  value,
  color
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function MilestoneItem({
  milestone,
  isFirst,
  isLast
}: {
  milestone: DebtMilestone
  isFirst: boolean
  isLast: boolean
}) {
  const getIcon = () => {
    if (milestone.isAchieved) return '✅'
    if (milestone.type === 'debt_paid') return '🎯'
    if (milestone.type === 'percentage') return '📊'
    return '⭐'
  }

  return (
    <div className="flex items-center gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            milestone.isAchieved
              ? 'bg-green-100'
              : 'bg-purple-100'
          }`}
        >
          <span className="text-sm">{getIcon()}</span>
        </div>
        {!isLast && (
          <div className={`w-0.5 h-6 ${
            milestone.isAchieved ? 'bg-green-300' : 'bg-gray-200'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <p className={`font-medium ${
          milestone.isAchieved ? 'text-green-700' : 'text-gray-900'
        }`}>
          {milestone.name}
        </p>
        <p className="text-sm text-gray-500">
          {milestone.isAchieved
            ? '¡Logrado!'
            : `En ${milestone.monthsFromNow} meses (${milestone.projectedDate.toLocaleDateString('es-MX', {
                month: 'short',
                year: 'numeric'
              })})`
          }
        </p>
      </div>
    </div>
  )
}

function MiniProjectionChart({
  projection
}: {
  projection: DebtFreedomProjection['monthlyProjection']
}) {
  if (projection.length === 0) return null

  const maxDebt = projection[0].totalDebt
  const samplePoints = projection.filter((_, idx) =>
    idx % Math.max(1, Math.floor(projection.length / 12)) === 0
  ).slice(0, 12)

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-2">Proyección de deuda</p>
      <div className="h-16 flex items-end justify-between gap-1">
        {samplePoints.map((point, idx) => {
          const height = (point.totalDebt / maxDebt) * 100
          return (
            <div
              key={idx}
              className="flex-1 bg-purple-400 rounded-t transition-all hover:bg-purple-500"
              style={{ height: `${height}%`, minHeight: point.totalDebt > 0 ? '4px' : '0' }}
              title={`Mes ${point.month}: $${point.totalDebt.toLocaleString()}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Hoy</span>
        <span>{projection[projection.length - 1]?.month || 0} meses</span>
      </div>
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default DebtFreedomProjector
