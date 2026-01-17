'use client'

import { useState } from 'react'
import { Budget, BudgetPeriod } from '../types'
import { BudgetCard } from './BudgetCard'
import { NeuButton } from '@/shared/components/ui'

interface BudgetListProps {
  budgets: Budget[]
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod | 'all'>('all')

  const filteredBudgets =
    selectedPeriod === 'all'
      ? budgets
      : budgets.filter((b) => b.period === selectedPeriod)

  const periods: Array<{ value: BudgetPeriod | 'all'; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'daily', label: 'Diarios' },
    { value: 'weekly', label: 'Semanales' },
    { value: 'monthly', label: 'Mensuales' },
    { value: 'quarterly', label: 'Trimestrales' },
    { value: 'annual', label: 'Anuales' },
  ]

  return (
    <div>
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === period.value
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 shadow-neu hover:shadow-neu-inset'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Lista de presupuestos */}
      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay presupuestos
          </h3>
          <p className="text-gray-500">
            {selectedPeriod === 'all'
              ? 'Crea tu primer presupuesto para empezar a controlar tus finanzas'
              : `No tienes presupuestos ${periods.find((p) => p.value === selectedPeriod)?.label.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
