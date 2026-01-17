/**
 * CreditScoreGauge
 * Gauge semicircular grande para mostrar el credit score
 */

'use client'

import { getScoreColor, getScoreRange, getRangeLabel } from '../types'

interface CreditScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

const SIZE_CONFIG = {
  sm: { diameter: 160, strokeWidth: 12, fontSize: '2xl' },
  md: { diameter: 240, strokeWidth: 16, fontSize: '4xl' },
  lg: { diameter: 320, strokeWidth: 20, fontSize: '6xl' }
}

export function CreditScoreGauge({
  score,
  size = 'lg',
  showLabel = true,
  animated = true
}: CreditScoreGaugeProps) {
  const config = SIZE_CONFIG[size]
  const radius = (config.diameter - config.strokeWidth) / 2
  const circumference = Math.PI * radius // Semicircle
  const range = getScoreRange(score)
  const color = getScoreColor(score)

  // Calcular offset para la animación (de 300 a 850)
  const minScore = 300
  const maxScore = 850
  const normalizedScore = Math.min(maxScore, Math.max(minScore, score))
  const percentage = (normalizedScore - minScore) / (maxScore - minScore)
  const offset = circumference * (1 - percentage)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: config.diameter, height: config.diameter / 2 }}>
        {/* Background arc */}
        <svg
          width={config.diameter}
          height={config.diameter / 2}
          viewBox={`0 0 ${config.diameter} ${config.diameter / 2}`}
          className="overflow-visible"
        >
          {/* Gray background arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.diameter / 2} A ${radius} ${radius} 0 0 1 ${
              config.diameter - config.strokeWidth / 2
            } ${config.diameter / 2}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored score arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.diameter / 2} A ${radius} ${radius} 0 0 1 ${
              config.diameter - config.strokeWidth / 2
            } ${config.diameter / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
          />
        </svg>

        {/* Score text */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end"
          style={{ paddingBottom: config.diameter * 0.1 }}
        >
          <div className={`font-bold text-gray-900 text-${config.fontSize}`}>{score}</div>
          <div className="text-sm text-gray-500 mt-1">out of 850</div>
        </div>

        {/* Min/Max labels */}
        <div className="absolute bottom-0 left-0 text-xs text-gray-400">{minScore}</div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-400">{maxScore}</div>
      </div>

      {/* Range label */}
      {showLabel && (
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-gray-900">{getRangeLabel(range)}</span>
        </div>
      )}
    </div>
  )
}

// =====================================================
// MINI VERSION (for cards)
// =====================================================

interface MiniGaugeProps {
  score: number
}

export function MiniCreditScoreGauge({ score }: MiniGaugeProps) {
  const color = getScoreColor(score)
  const range = getScoreRange(score)

  const minScore = 300
  const maxScore = 850
  const percentage = ((score - minScore) / (maxScore - minScore)) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <div className="text-2xl font-bold text-gray-900">{score}</div>
        <div className="text-xs text-gray-500">/ 850</div>
      </div>

      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium text-gray-700">{getRangeLabel(range)}</span>
        </div>
      </div>
    </div>
  )
}
