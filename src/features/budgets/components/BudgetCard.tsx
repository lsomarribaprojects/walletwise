'use client'

import { Budget } from '../types'
import { NeuCard } from '@/shared/components/ui'
import { CircularGauge } from './CircularGauge'
import { BudgetProgressBar } from './BudgetProgressBar'

interface BudgetCardProps {
  budget: Budget
  onEdit?: (budget: Budget) => void
  onDelete?: (id: string) => void
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const spent = budget.spent || 0
  const budgetAmount = Number(budget.amount)
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
  const remaining = budgetAmount - spent

  const periodLabels = {
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual',
  }

  return (
    <NeuCard className="p-6 hover:shadow-neu-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: budget.category_color }}
            />
            <h3 className="font-semibold text-gray-800 text-lg">
              {budget.name}
            </h3>
          </div>
          <p className="text-sm text-gray-500">{budget.category_name}</p>
          <p className="text-xs text-gray-400 mt-1">
            Período: {periodLabels[budget.period]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar presupuesto"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
                  onDelete(budget.id)
                }
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar presupuesto"
            >
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mb-6">
        <CircularGauge percentage={percentage} />
      </div>

      <BudgetProgressBar spent={spent} budget={budgetAmount} className="mb-4" />

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Presupuesto</p>
          <p className="text-lg font-semibold text-gray-800">
            ${budgetAmount.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">
            {remaining >= 0 ? 'Disponible' : 'Excedido'}
          </p>
          <p
            className={`text-lg font-semibold ${
              remaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${Math.abs(remaining).toFixed(2)}
          </p>
        </div>
      </div>

      {percentage >= budget.alert_threshold && percentage < 100 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              Cerca del límite
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Has alcanzado el {percentage.toFixed(0)}% de tu presupuesto
            </p>
          </div>
        </div>
      )}
    </NeuCard>
  )
}
