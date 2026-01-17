'use client'

import { useState } from 'react'
import { TierGate } from '@/features/subscriptions'
import {
  useCalculatedScore,
  useScoreHistory,
  useCreditScore,
  CreditScoreGauge,
  ScoreFactorsCard,
  ScoreHistoryChart,
  ScoreTipsCard,
  ScoreRangeIndicator,
  type CreateScoreInput
} from '@/features/credit-scores'
import { NeuButton } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'

export default function CreditScorePage() {
  const { t } = useLanguage()
  const { scoreData, isLoading: calculatingScore, recalculate } = useCalculatedScore()
  const { scores: historyScores, statistics, trend, isLoading: loadingHistory } = useScoreHistory(12)
  const { addScore } = useCreditScore()
  const [showSaveModal, setShowSaveModal] = useState(false)

  const handleSaveScore = async () => {
    if (!scoreData) return

    try {
      await addScore({
        score: scoreData.score,
        factors: scoreData.factors,
        source: 'calculated'
      })
      setShowSaveModal(false)
      recalculate()
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }

  if (calculatingScore || loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <TierGate feature="credit_scores" blur>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.creditScore.title}</h1>
              <p className="text-gray-500 mt-1">
                {t.creditScore.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NeuButton variant="secondary" onClick={recalculate}>
                {t.creditScore.simulatePayment}
              </NeuButton>
              {scoreData && (
                <NeuButton variant="primary" onClick={() => setShowSaveModal(true)}>
                  {t.common.save}
                </NeuButton>
              )}
            </div>
          </header>

          {scoreData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Score gauge and range */}
              <div className="lg:col-span-1 space-y-6">
                {/* Main gauge */}
                <div className="bg-neu-bg rounded-xl shadow-neu p-8 flex flex-col items-center">
                  <CreditScoreGauge score={scoreData.score} size="lg" />

                  {/* Trend indicator */}
                  {trend && trend.previous && (
                    <div className="mt-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {trend.direction === 'up' && (
                          <>
                            <span className="text-2xl">📈</span>
                            <span className="text-green-600 font-semibold">
                              +{trend.change} points
                            </span>
                          </>
                        )}
                        {trend.direction === 'down' && (
                          <>
                            <span className="text-2xl">📉</span>
                            <span className="text-red-600 font-semibold">
                              {trend.change} points
                            </span>
                          </>
                        )}
                        {trend.direction === 'stable' && (
                          <>
                            <span className="text-2xl">➡️</span>
                            <span className="text-gray-600 font-semibold">No change</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        vs last recorded score
                      </p>
                    </div>
                  )}
                </div>

                {/* Range indicator */}
                <ScoreRangeIndicator score={scoreData.score} />

                {/* Statistics */}
                {statistics && statistics.monthsTracked > 0 && (
                  <div className="bg-neu-bg rounded-xl shadow-neu p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.creditScore.history}</h3>
                    <div className="space-y-3">
                      <StatRow label="Highest" value={statistics.highest} />
                      <StatRow label="Lowest" value={statistics.lowest} />
                      <StatRow label="Average" value={statistics.average} />
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Tracking for</span>
                        <span className="font-semibold text-gray-900">
                          {statistics.monthsTracked} months
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Factors, history, and tips */}
              <div className="lg:col-span-2 space-y-6">
                {/* Score factors */}
                <ScoreFactorsCard factors={scoreData.factors} />

                {/* Score history chart */}
                {historyScores.length > 0 && (
                  <ScoreHistoryChart scores={historyScores} height={300} />
                )}

                {/* Improvement tips */}
                {scoreData.tips.length > 0 && (
                  <ScoreTipsCard tips={scoreData.tips} maxTips={6} />
                )}

                {/* Disclaimer */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Estimated Score Disclaimer
                      </h4>
                      <p className="text-sm text-blue-800">
                        This is an estimated credit score calculated based on your app data.
                        It is NOT your official FICO or VantageScore. For your actual credit
                        score, check with the credit bureaus or your financial institution.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState onCalculate={recalculate} />
          )}

          {/* Save modal */}
          {showSaveModal && scoreData && (
            <SaveScoreModal
              score={scoreData.score}
              onClose={() => setShowSaveModal(false)}
              onSave={handleSaveScore}
            />
          )}
        </div>
      </div>
    </TierGate>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function EmptyState({ onCalculate }: { onCalculate: () => void }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
      <span className="text-6xl mb-4 block">📊</span>
      <h3 className="font-semibold text-gray-900 mb-2 text-xl">No Credit Score Data</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        We need data from your credit cards and loans to calculate an estimated credit score.
        Add some accounts to get started.
      </p>
      <NeuButton variant="primary" onClick={onCalculate}>
        Calculate My Score
      </NeuButton>
    </div>
  )
}

function SaveScoreModal({
  score,
  onClose,
  onSave
}: {
  score: number
  onClose: () => void
  onSave: () => void
}) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Save Credit Score</h2>

          <div className="mb-6 text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{score}</div>
            <p className="text-gray-500">
              This score will be saved to your history
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              rows={3}
              placeholder="Add any notes about this score..."
            />
          </div>

          <div className="flex gap-3">
            <NeuButton
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </NeuButton>
            <NeuButton
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Score'}
            </NeuButton>
          </div>
        </div>
      </div>
    </div>
  )
}
