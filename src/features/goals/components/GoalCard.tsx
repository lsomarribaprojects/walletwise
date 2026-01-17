'use client'

import { FinancialGoal, GOAL_TYPE_CONFIG } from '../types'
import { GoalProgress } from './GoalProgress'
import { NeuCard } from '@/shared/components/ui'

interface GoalCardProps {
  goal: FinancialGoal
  onClick?: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const typeConfig = GOAL_TYPE_CONFIG[goal.goal_type]
  const progress = (goal.current_amount / goal.target_amount) * 100

  const getStatusBadge = () => {
    switch (goal.status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
            Completada
          </span>
        )
      case 'paused':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
            Pausada
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
            Cancelada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div onClick={onClick} className="cursor-pointer">
      <NeuCard
        className={`transition-transform hover:scale-[1.02] ${
          goal.status !== 'active' ? 'opacity-70' : ''
        }`}
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            {goal.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{goal.name}</h3>
            <p className="text-xs text-gray-500">{typeConfig.label}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress */}
      <div className="flex justify-center mb-4">
        <GoalProgress goal={goal} size="sm" showDetails={false} />
      </div>

      {/* Amounts */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Actual</span>
          <span className="font-semibold" style={{ color: goal.color }}>
            ${goal.current_amount.toLocaleString('es-MX')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Meta</span>
          <span className="font-medium text-gray-700">
            ${goal.target_amount.toLocaleString('es-MX')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>
      </div>

      {/* Priority stars */}
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= goal.priority ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>

      {/* Target date */}
      {goal.target_date && (
        <p className="mt-2 text-xs text-gray-400">
          Fecha objetivo: {new Date(goal.target_date).toLocaleDateString('es-MX')}
        </p>
      )}
      </NeuCard>
    </div>
  )
}
