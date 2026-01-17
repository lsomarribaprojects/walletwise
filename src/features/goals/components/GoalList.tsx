'use client'

import { FinancialGoal, GoalStatus } from '../types'
import { GoalCard } from './GoalCard'

interface GoalListProps {
  goals: FinancialGoal[]
  onGoalClick?: (goal: FinancialGoal) => void
  filter?: GoalStatus | 'all'
  onFilterChange?: (filter: GoalStatus | 'all') => void
}

const FILTERS: { value: GoalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'paused', label: 'Pausadas' },
]

export function GoalList({
  goals,
  onGoalClick,
  filter = 'all',
  onFilterChange,
}: GoalListProps) {
  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      {onFilterChange && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${filter === f.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-neu-bg shadow-neu-sm text-gray-600 hover:shadow-neu'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Goals grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => onGoalClick?.(goal)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No hay metas {filter !== 'all' ? `${FILTERS.find(f => f.value === filter)?.label.toLowerCase()}` : ''}
          </h3>
          <p className="text-gray-500 text-sm">
            Crea tu primera meta para comenzar a ahorrar
          </p>
        </div>
      )}
    </div>
  )
}
