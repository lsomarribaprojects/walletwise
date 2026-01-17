/**
 * ScoreFactorsCard
 * Desglose de factores que afectan el credit score
 */

'use client'

import type { ScoreFactors } from '../types'
import { buildScoreFactors } from '../services/scoreCalculator'
import { getImpactColor } from '../types'

interface ScoreFactorsCardProps {
  factors: ScoreFactors
  className?: string
}

export function ScoreFactorsCard({ factors, className = '' }: ScoreFactorsCardProps) {
  const scoreFactors = buildScoreFactors(factors)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Factors</h3>

      <div className="space-y-4">
        {scoreFactors.map((factor) => (
          <div key={factor.name}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 text-sm">{factor.label}</span>
                  <span className="text-xs text-gray-500">({factor.weight}%)</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{factor.description}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <span className="font-semibold text-gray-900">{factor.value}</span>
                <span className="text-gray-500 text-sm">/100</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${factor.value}%`,
                  backgroundColor: getImpactColor(factor.impact)
                }}
              />
            </div>

            {/* Impact label */}
            <div className="flex justify-end mt-1">
              <ImpactBadge impact={factor.impact} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTES INTERNOS
// =====================================================

interface ImpactBadgeProps {
  impact: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'
}

function ImpactBadge({ impact }: ImpactBadgeProps) {
  const config = {
    excellent: { label: 'Excellent', color: 'text-green-600 bg-green-50' },
    good: { label: 'Good', color: 'text-lime-600 bg-lime-50' },
    fair: { label: 'Fair', color: 'text-yellow-600 bg-yellow-50' },
    poor: { label: 'Poor', color: 'text-orange-600 bg-orange-50' },
    very_poor: { label: 'Very Poor', color: 'text-red-600 bg-red-50' }
  }

  const { label, color } = config[impact]

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  )
}

// =====================================================
// COMPACT VERSION
// =====================================================

interface CompactFactorsProps {
  factors: ScoreFactors
}

export function CompactScoreFactors({ factors }: CompactFactorsProps) {
  const scoreFactors = buildScoreFactors(factors)

  return (
    <div className="space-y-3">
      {scoreFactors.map((factor) => (
        <div key={factor.name} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{factor.label}</span>
              <span className="text-sm font-semibold text-gray-900">{factor.value}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${factor.value}%`,
                  backgroundColor: getImpactColor(factor.impact)
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
