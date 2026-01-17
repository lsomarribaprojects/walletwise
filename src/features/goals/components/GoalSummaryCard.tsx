'use client'

import { useMemo } from 'react'
import { FinancialGoal } from '../types'
import { calculateGoalStats } from '../services/goalCalculator'
import { NeuCard } from '@/shared/components/ui'

interface GoalSummaryCardProps {
  goals: FinancialGoal[]
}

export function GoalSummaryCard({ goals }: GoalSummaryCardProps) {
  const stats = useMemo(() => calculateGoalStats(goals), [goals])

  return (
    <NeuCard className="p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Resumen de Metas
      </h3>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <p className="text-2xl font-bold text-blue-600">{stats.activeGoals}</p>
          <p className="text-xs text-gray-500">Metas Activas</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-2xl font-bold text-green-600">{stats.completedGoals}</p>
          <p className="text-xs text-gray-500">Completadas</p>
        </div>
      </div>

      {/* Total progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Progreso Total</span>
          <span className="font-semibold text-gray-700">
            {stats.totalProgress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(stats.totalProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ahorrado</span>
          <span className="font-semibold text-green-600">
            ${stats.totalCurrent.toLocaleString('es-MX')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Objetivo Total</span>
          <span className="font-medium text-gray-700">
            ${stats.totalTarget.toLocaleString('es-MX')}
          </span>
        </div>
      </div>

      {/* Nearest completion */}
      {stats.nearestCompletion && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Mas cerca de completar:</p>
          <div className="flex items-center gap-2">
            <span className="text-lg">{stats.nearestCompletion.icon}</span>
            <span className="text-sm font-medium text-gray-700">
              {stats.nearestCompletion.name}
            </span>
          </div>
        </div>
      )}
    </NeuCard>
  )
}
