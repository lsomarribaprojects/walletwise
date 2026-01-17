'use client'

import { BudgetSummary } from '../types'
import { NeuCard } from '@/shared/components/ui'

interface BudgetSummaryCardProps {
  summary: BudgetSummary
}

export function BudgetSummaryCard({ summary }: BudgetSummaryCardProps) {
  const remaining = summary.totalBudgeted - summary.totalSpent

  return (
    <NeuCard className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Resumen de Presupuestos
      </h2>

      <div className="space-y-4">
        {/* Total Presupuestado */}
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              Total Presupuestado
            </span>
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${summary.totalBudgeted.toFixed(2)}
          </p>
        </div>

        {/* Total Gastado */}
        <div className="p-4 bg-purple-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">
              Total Gastado
            </span>
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            ${summary.totalSpent.toFixed(2)}
          </p>
        </div>

        {/* Disponible */}
        <div
          className={`p-4 rounded-xl ${
            remaining >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-medium ${
                remaining >= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {remaining >= 0 ? 'Disponible' : 'Sobrepasado'}
            </span>
            <svg
              className={`w-5 h-5 ${
                remaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  remaining >= 0
                    ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                }
              />
            </svg>
          </div>
          <p
            className={`text-2xl font-bold ${
              remaining >= 0 ? 'text-green-900' : 'text-red-900'
            }`}
          >
            ${Math.abs(remaining).toFixed(2)}
          </p>
        </div>

        {/* Progress bar general */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Uso total
            </span>
            <span
              className={`text-sm font-bold ${
                summary.percentageUsed > 100
                  ? 'text-red-600'
                  : summary.percentageUsed > 90
                  ? 'text-orange-600'
                  : summary.percentageUsed > 75
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {summary.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                summary.percentageUsed > 100
                  ? 'bg-red-500'
                  : summary.percentageUsed > 90
                  ? 'bg-orange-500'
                  : summary.percentageUsed > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(summary.percentageUsed, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {summary.activeBudgets}
            </p>
            <p className="text-xs text-gray-600 mt-1">Presupuestos activos</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {summary.overspentBudgets}
            </p>
            <p className="text-xs text-red-700 mt-1">Excedidos</p>
          </div>
        </div>
      </div>
    </NeuCard>
  )
}
