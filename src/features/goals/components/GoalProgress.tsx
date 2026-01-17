'use client'

import { useMemo } from 'react'
import { FinancialGoal, GoalProgress as GoalProgressType } from '../types'
import { calculateProgress } from '../services/goalCalculator'

interface GoalProgressProps {
  goal: FinancialGoal
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function GoalProgress({ goal, size = 'md', showDetails = true }: GoalProgressProps) {
  const progress = useMemo(() => calculateProgress(goal), [goal])

  const sizeConfig = {
    sm: { ring: 80, stroke: 6, fontSize: 'text-lg' },
    md: { ring: 120, stroke: 8, fontSize: 'text-2xl' },
    lg: { ring: 160, stroke: 10, fontSize: 'text-3xl' },
  }

  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = radius * Math.PI // Semi-circle
  const offset = circumference - (progress.percentage / 100) * circumference

  // Color based on progress
  const getColor = () => {
    if (progress.percentage >= 100) return '#22C55E' // green
    if (progress.percentage >= 75) return '#3B82F6' // blue
    if (progress.percentage >= 50) return '#F59E0B' // amber
    if (progress.percentage >= 25) return '#F97316' // orange
    return '#EF4444' // red
  }

  const color = goal.color || getColor()

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress */}
      <div className="relative" style={{ width: config.ring, height: config.ring / 2 + 10 }}>
        <svg
          width={config.ring}
          height={config.ring / 2 + 10}
          viewBox={`0 0 ${config.ring} ${config.ring / 2 + 10}`}
        >
          {/* Background arc */}
          <path
            d={`M ${config.stroke / 2} ${config.ring / 2}
                A ${radius} ${radius} 0 0 1 ${config.ring - config.stroke / 2} ${config.ring / 2}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.stroke}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${config.stroke / 2} ${config.ring / 2}
                A ${radius} ${radius} 0 0 1 ${config.ring - config.stroke / 2} ${config.ring / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`${config.fontSize} font-bold`} style={{ color }}>
            {progress.percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-2 text-center space-y-1">
          {/* On track indicator */}
          <div className="flex items-center justify-center gap-1">
            {progress.onTrack ? (
              <>
                <span className="text-green-500">✓</span>
                <span className="text-sm text-green-600">En camino</span>
              </>
            ) : (
              <>
                <span className="text-orange-500">!</span>
                <span className="text-sm text-orange-600">Atrasado</span>
              </>
            )}
          </div>

          {/* Days remaining */}
          {progress.daysRemaining > 0 && (
            <p className="text-xs text-gray-500">
              {progress.daysRemaining} días restantes
            </p>
          )}

          {/* Monthly needed */}
          {progress.monthlyNeeded > 0 && (
            <p className="text-xs text-gray-500">
              ${progress.monthlyNeeded.toLocaleString('es-MX', { maximumFractionDigits: 0 })}/mes necesario
            </p>
          )}
        </div>
      )}
    </div>
  )
}
