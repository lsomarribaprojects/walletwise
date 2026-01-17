/**
 * ScoreTipsCard
 * Tips personalizados para mejorar el credit score
 */

'use client'

import type { ScoreTip } from '../types'

interface ScoreTipsCardProps {
  tips: ScoreTip[]
  maxTips?: number
  className?: string
}

export function ScoreTipsCard({ tips, maxTips = 5, className = '' }: ScoreTipsCardProps) {
  const displayTips = tips.slice(0, maxTips)

  if (displayTips.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ways to Improve</h3>
        <span className="text-sm text-gray-500">{displayTips.length} tips</span>
      </div>

      <div className="space-y-4">
        {displayTips.map((tip) => (
          <TipItem key={tip.id} tip={tip} />
        ))}
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTES INTERNOS
// =====================================================

interface TipItemProps {
  tip: ScoreTip
}

function TipItem({ tip }: TipItemProps) {
  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <ImpactIcon impact={tip.impact} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-medium text-gray-900 text-sm">{tip.title}</h4>
          <ImpactBadge impact={tip.impact} />
        </div>
        <p className="text-sm text-gray-600">{tip.description}</p>
        {tip.actionable && (
          <div className="mt-2">
            <span className="text-xs text-blue-600 font-medium">Action recommended</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactIcon({ impact }: { impact: ScoreTip['impact'] }) {
  const config = {
    high: { icon: '🔴', bg: 'bg-red-100' },
    medium: { icon: '🟡', bg: 'bg-yellow-100' },
    low: { icon: '🟢', bg: 'bg-green-100' }
  }

  const { icon, bg } = config[impact]

  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-sm`}>
      {icon}
    </div>
  )
}

function ImpactBadge({ impact }: { impact: ScoreTip['impact'] }) {
  const config = {
    high: { label: 'High Impact', color: 'text-red-700 bg-red-50 border-red-200' },
    medium: { label: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    low: { label: 'Low', color: 'text-green-700 bg-green-50 border-green-200' }
  }

  const { label, color } = config[impact]

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${color} flex-shrink-0`}
    >
      {label}
    </span>
  )
}

// =====================================================
// COMPACT VERSION
// =====================================================

interface CompactTipsProps {
  tips: ScoreTip[]
  maxTips?: number
}

export function CompactScoreTips({ tips, maxTips = 3 }: CompactTipsProps) {
  const displayTips = tips.slice(0, maxTips)

  return (
    <div className="space-y-3">
      {displayTips.map((tip) => (
        <div key={tip.id} className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{tip.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tip.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
