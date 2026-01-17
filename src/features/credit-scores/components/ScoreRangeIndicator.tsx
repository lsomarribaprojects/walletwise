/**
 * ScoreRangeIndicator
 * Indicador visual del rango de credit score
 */

'use client'

import { SCORE_RANGES, getScoreRange, type CreditScoreRange } from '../types'

interface ScoreRangeIndicatorProps {
  score: number
  showLabels?: boolean
  className?: string
}

export function ScoreRangeIndicator({ score, showLabels = true, className = '' }: ScoreRangeIndicatorProps) {
  const currentRange = getScoreRange(score)

  // Calcular posición del indicador (de 300 a 850)
  const minScore = 300
  const maxScore = 850
  const position = ((score - minScore) / (maxScore - minScore)) * 100

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Credit Score Ranges</h3>

      {/* Visual indicator */}
      <div className="relative mb-8">
        {/* Color bands */}
        <div className="flex h-8 rounded-lg overflow-hidden">
          {Object.entries(SCORE_RANGES).reverse().map(([key, range]) => {
            const rangeKey = key as CreditScoreRange
            const width = ((range.max - range.min + 1) / (maxScore - minScore)) * 100

            return (
              <div
                key={key}
                className={`relative transition-all ${
                  rangeKey === currentRange ? 'ring-2 ring-gray-900 ring-inset' : ''
                }`}
                style={{
                  width: `${width}%`,
                  backgroundColor: range.color
                }}
              >
                {rangeKey === currentRange && (
                  <div className="absolute inset-0 bg-white opacity-20" />
                )}
              </div>
            )
          })}
        </div>

        {/* Score pointer */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-900 z-10"
          style={{ left: `${position}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded">
              {score}
            </div>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      </div>

      {/* Range labels */}
      {showLabels && (
        <div className="space-y-2">
          {Object.entries(SCORE_RANGES).reverse().map(([key, range]) => {
            const rangeKey = key as CreditScoreRange
            const isCurrent = rangeKey === currentRange

            return (
              <div
                key={key}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-gray-50 ring-2 ring-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: range.color }}
                  />
                  <span className={`font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>
                    {range.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">
                      You are here
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {range.min} - {range.max}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPACT VERSION (Simple bar)
// =====================================================

interface CompactRangeIndicatorProps {
  score: number
}

export function CompactRangeIndicator({ score }: CompactRangeIndicatorProps) {
  const currentRange = getScoreRange(score)
  const minScore = 300
  const maxScore = 850
  const position = ((score - minScore) / (maxScore - minScore)) * 100

  return (
    <div className="relative">
      <div className="flex h-4 rounded-full overflow-hidden">
        {Object.entries(SCORE_RANGES).reverse().map(([key, range]) => {
          const width = ((range.max - range.min + 1) / (maxScore - minScore)) * 100
          return (
            <div
              key={key}
              style={{
                width: `${width}%`,
                backgroundColor: range.color
              }}
            />
          )
        })}
      </div>

      {/* Score marker */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />
    </div>
  )
}
