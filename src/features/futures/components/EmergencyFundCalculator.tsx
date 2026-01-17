/**
 * EmergencyFundCalculator
 * Calculadora y visualización del fondo de emergencia
 */

'use client'

import { useState, useMemo } from 'react'
import type { EmergencyFundCalculation } from '../types'
import {
  calculateEmergencyFund,
  calculateRequiredMonthlySavings,
  getRiskLevelInfo
} from '../services/emergencyFund'

// =====================================================
// TIPOS
// =====================================================

interface EmergencyFundCalculatorProps {
  initialExpenses?: number
  initialSavings?: number
  className?: string
  onCalculate?: (calculation: EmergencyFundCalculation) => void
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function EmergencyFundCalculator({
  initialExpenses = 0,
  initialSavings = 0,
  className = '',
  onCalculate
}: EmergencyFundCalculatorProps) {
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialExpenses)
  const [currentSavings, setCurrentSavings] = useState(initialSavings)
  const [targetMonths, setTargetMonths] = useState(6)
  const [monthlyContribution, setMonthlyContribution] = useState(0)

  const calculation = useMemo(() => {
    if (monthlyExpenses <= 0) return null
    const calc = calculateEmergencyFund(
      monthlyExpenses,
      targetMonths,
      currentSavings,
      monthlyContribution
    )
    onCalculate?.(calc)
    return calc
  }, [monthlyExpenses, targetMonths, currentSavings, monthlyContribution, onCalculate])

  const riskInfo = calculation ? getRiskLevelInfo(calculation.riskLevel) : null

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-2xl">🛡️</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Fondo de Emergencia</h3>
            <p className="text-sm text-gray-500">Tu colchón financiero contra imprevistos</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gastos mensuales
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={monthlyExpenses || ''}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="3,000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ahorros actuales
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={currentSavings || ''}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta (meses de gastos)
          </label>
          <div className="flex gap-2">
            {[3, 6, 9, 12].map((months) => (
              <button
                key={months}
                onClick={() => setTargetMonths(months)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  targetMonths === months
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {months} meses
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aporte mensual al fondo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={monthlyContribution || ''}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="200"
            />
          </div>
        </div>
      </div>

      {/* Resultados */}
      {calculation && (
        <>
          {/* Nivel de riesgo */}
          <div className="px-4 pb-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${riskInfo?.color}15` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{riskInfo?.emoji}</span>
                <div>
                  <p className="font-semibold" style={{ color: riskInfo?.color }}>
                    Riesgo {riskInfo?.label}
                  </p>
                  <p className="text-sm text-gray-600">{riskInfo?.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progreso */}
          <div className="px-4 pb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progreso hacia tu meta</span>
              <span className="font-medium text-gray-900">
                {calculation.percentageComplete.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${calculation.percentageComplete}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>${calculation.currentSavings.toLocaleString()}</span>
              <span>Meta: ${calculation.targetAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 px-4 pb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Te falta</p>
              <p className="text-lg font-bold text-gray-900">
                ${calculation.amountNeeded.toLocaleString()}
              </p>
            </div>
            {calculation.savingsPlan.monthsToGoal > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Tiempo estimado</p>
                <p className="text-lg font-bold text-gray-900">
                  {calculation.savingsPlan.monthsToGoal} meses
                </p>
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="px-4 pb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
            <div className="space-y-2">
              {calculation.savingsPlan.milestones.map((milestone) => (
                <div
                  key={milestone.months}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    milestone.isAchieved ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{milestone.isAchieved ? '✅' : '⭕'}</span>
                    <span className={`text-sm ${
                      milestone.isAchieved ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {milestone.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${milestone.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          {calculation.recommendations.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recomendaciones</p>
              <div className="space-y-2">
                {calculation.recommendations.slice(0, 3).map((rec, idx) => (
                  <p key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {rec}
                  </p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!calculation && (
        <div className="p-8 text-center text-gray-500">
          <p>Ingresa tus gastos mensuales para ver tu análisis</p>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTE WIDGET COMPACTO
// =====================================================

export function EmergencyFundWidget({
  calculation,
  className = ''
}: {
  calculation: EmergencyFundCalculation | null
  className?: string
}) {
  if (!calculation) return null

  const riskInfo = getRiskLevelInfo(calculation.riskLevel)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-medium text-gray-900">Fondo de Emergencia</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${riskInfo.color}15`,
            color: riskInfo.color
          }}
        >
          {riskInfo.label}
        </span>
      </div>

      <div className="mb-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${calculation.percentageComplete}%`,
              backgroundColor: riskInfo.color
            }}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          ${calculation.currentSavings.toLocaleString()}
        </span>
        <span className="text-gray-500">
          de ${calculation.targetAmount.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default EmergencyFundCalculator
