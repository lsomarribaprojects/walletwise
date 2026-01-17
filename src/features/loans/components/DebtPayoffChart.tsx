/**
 * DebtPayoffChart
 * Visualización de estrategias de pago de deuda
 */

'use client'

import { useMemo, useState } from 'react'
import type { DebtPayoffPlan, DebtPayoffStrategy } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface DebtPayoffChartProps {
  avalanchePlan: DebtPayoffPlan
  snowballPlan: DebtPayoffPlan
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function DebtPayoffChart({
  avalanchePlan,
  snowballPlan,
  className = ''
}: DebtPayoffChartProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<DebtPayoffStrategy>('avalanche')

  const activePlan = selectedStrategy === 'avalanche' ? avalanchePlan : snowballPlan
  const comparison = useMemo(() => ({
    monthsDiff: Math.abs(avalanchePlan.monthsToDebtFree - snowballPlan.monthsToDebtFree),
    interestDiff: Math.abs(avalanchePlan.totalInterestPaid - snowballPlan.totalInterestPaid),
    winner: avalanchePlan.totalInterestPaid <= snowballPlan.totalInterestPaid ? 'avalanche' : 'snowball'
  }), [avalanchePlan, snowballPlan])

  // Datos para el gráfico
  const chartData = useMemo(() => {
    const maxMonths = Math.max(avalanchePlan.monthsToDebtFree, snowballPlan.monthsToDebtFree)
    const interval = Math.ceil(maxMonths / 12) // Mostrar por año aproximadamente

    return activePlan.monthlyBreakdown
      .filter((_, idx) => idx % interval === 0 || idx === activePlan.monthlyBreakdown.length - 1)
      .map(month => ({
        month: month.month,
        debt: month.totalDebt,
        date: month.date
      }))
  }, [activePlan, avalanchePlan.monthsToDebtFree, snowballPlan.monthsToDebtFree])

  const maxDebt = activePlan.monthlyBreakdown[0]?.totalDebt || 0

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header con selector de estrategia */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Plan de pago de deuda</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedStrategy('avalanche')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStrategy === 'avalanche'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Avalanche
            </button>
            <button
              onClick={() => setSelectedStrategy('snowball')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedStrategy === 'snowball'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Snowball
            </button>
          </div>
        </div>

        {/* Descripción de estrategia */}
        <p className="text-sm text-gray-500">
          {selectedStrategy === 'avalanche'
            ? '📉 Paga primero la deuda con mayor tasa de interés (ahorra más dinero)'
            : '❄️ Paga primero la deuda más pequeña (victorias rápidas para motivación)'
          }
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Libre de deuda en</p>
          <p className="text-xl font-bold text-gray-900">
            {Math.floor(activePlan.monthsToDebtFree / 12)}a {activePlan.monthsToDebtFree % 12}m
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Interés total</p>
          <p className="text-xl font-bold text-red-600">
            ${activePlan.totalInterestPaid.toLocaleString()}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Pago total</p>
          <p className="text-xl font-bold text-gray-900">
            ${activePlan.totalPaid.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Gráfico simple de barras */}
      <div className="p-4">
        <div className="h-48 flex items-end justify-between gap-1">
          {chartData.map((point, idx) => {
            const height = (point.debt / maxDebt) * 100
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className="w-full bg-red-400 rounded-t transition-all duration-300 hover:bg-red-500"
                  style={{ height: `${height}%`, minHeight: point.debt > 0 ? '4px' : '0' }}
                  title={`$${point.debt.toLocaleString()}`}
                />
                <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
                  M{point.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Orden de pago de préstamos */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Orden de pago
        </p>
        <div className="space-y-2">
          {activePlan.loanOrder.map((item, idx) => (
            <div
              key={item.loan.id}
              className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg"
            >
              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium text-gray-600">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.loan.name}</p>
                <p className="text-xs text-gray-500">
                  ${item.loan.current_balance.toLocaleString()} • {(item.loan.interest_rate * 100).toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">
                  Mes {item.payoffMonth}
                </p>
                <p className="text-xs text-gray-500">
                  ${item.interestPaid.toLocaleString()} interés
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparación */}
      {comparison.interestDiff > 0 && (
        <div className="px-4 pb-4">
          <div className={`p-3 rounded-lg ${
            comparison.winner === selectedStrategy ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <p className={`text-sm ${
              comparison.winner === selectedStrategy ? 'text-green-700' : 'text-amber-700'
            }`}>
              {comparison.winner === selectedStrategy ? (
                <>
                  ✅ Esta estrategia te ahorra <strong>${comparison.interestDiff.toLocaleString()}</strong> en intereses
                  {comparison.monthsDiff > 0 && ` y ${comparison.monthsDiff} meses`}
                </>
              ) : (
                <>
                  💡 {comparison.winner === 'avalanche' ? 'Avalanche' : 'Snowball'} te ahorraría{' '}
                  <strong>${comparison.interestDiff.toLocaleString()}</strong> en intereses
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

/**
 * Comparador simple de estrategias
 */
export function StrategyComparison({
  avalanchePlan,
  snowballPlan,
  className = ''
}: {
  avalanchePlan: DebtPayoffPlan
  snowballPlan: DebtPayoffPlan
  className?: string
}) {
  const winner = avalanchePlan.totalInterestPaid <= snowballPlan.totalInterestPaid
    ? 'avalanche'
    : 'snowball'

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <StrategyCard
        name="Avalanche"
        emoji="📉"
        description="Mayor tasa primero"
        months={avalanchePlan.monthsToDebtFree}
        interest={avalanchePlan.totalInterestPaid}
        isWinner={winner === 'avalanche'}
      />
      <StrategyCard
        name="Snowball"
        emoji="❄️"
        description="Menor balance primero"
        months={snowballPlan.monthsToDebtFree}
        interest={snowballPlan.totalInterestPaid}
        isWinner={winner === 'snowball'}
      />
    </div>
  )
}

function StrategyCard({
  name,
  emoji,
  description,
  months,
  interest,
  isWinner
}: {
  name: string
  emoji: string
  description: string
  months: number
  interest: number
  isWinner: boolean
}) {
  return (
    <div className={`p-4 rounded-xl border-2 ${
      isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
    }`}>
      {isWinner && (
        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
          Recomendado
        </span>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{Math.floor(months / 12)}a {months % 12}m</span> hasta libertad
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium text-red-600">${interest.toLocaleString()}</span> en intereses
        </p>
      </div>
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default DebtPayoffChart
