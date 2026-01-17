'use client'

import { useState, useCallback } from 'react'
import { useGoals, useGoalMutations } from '@/features/goals/hooks/useGoals'
import { useGoalStore } from '@/features/goals/store/goalStore'
import {
  GoalList,
  GoalForm,
  GoalSummaryCard,
  GoalDetailModal,
  FinancialGoal,
  GoalFormData,
  GoalStatus,
} from '@/features/goals'
import { NeuButton, NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'

export default function GoalsPage() {
  const { t } = useLanguage()
  const { goals, allGoals, isLoading, error, filter, setFilter, refresh } = useGoals()
  const { selectedGoal, contributions, loadGoal, loadContributions, clearSelectedGoal } = useGoalStore()
  const { createGoal, updateGoal, deleteGoal, updateStatus, addContribution, isLoading: mutating } = useGoalMutations()

  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)

  const handleGoalClick = useCallback(async (goal: FinancialGoal) => {
    await loadGoal(goal.id)
    await loadContributions(goal.id)
  }, [loadGoal, loadContributions])

  const handleCreateGoal = async (data: GoalFormData) => {
    await createGoal(data)
    setShowForm(false)
    refresh()
  }

  const handleUpdateGoal = async (data: GoalFormData) => {
    if (!editingGoal) return
    await updateGoal(editingGoal.id, data)
    setEditingGoal(null)
    refresh()
  }

  const handleContribute = async (amount: number, date: string, source?: string, notes?: string) => {
    if (!selectedGoal) return
    await addContribution(selectedGoal.id, amount, date, source, notes)
    refresh()
  }

  const handlePause = async () => {
    if (!selectedGoal) return
    await updateStatus(selectedGoal.id, 'paused')
    clearSelectedGoal()
    refresh()
  }

  const handleResume = async () => {
    if (!selectedGoal) return
    await updateStatus(selectedGoal.id, 'active')
    refresh()
  }

  const handleDelete = async () => {
    if (!selectedGoal) return
    await deleteGoal(selectedGoal.id)
    clearSelectedGoal()
    refresh()
  }

  const handleEdit = () => {
    if (!selectedGoal) return
    setEditingGoal(selectedGoal)
    clearSelectedGoal()
  }

  const handleFilterChange = (newFilter: GoalStatus | 'all') => {
    setFilter(newFilter)
  }

  if (error) {
    return (
      <div className="p-6">
        <NeuCard className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <NeuButton variant="secondary" onClick={refresh} className="mt-4">
            {t.common.retry}
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t.goals.title}</h1>
          <p className="text-gray-500 text-sm">{t.goals.subtitle}</p>
        </div>
        <NeuButton variant="primary" onClick={() => setShowForm(true)}>
          + {t.goals.addGoal}
        </NeuButton>
      </div>

      {/* Summary card */}
      {allGoals.length > 0 && (
        <GoalSummaryCard goals={allGoals} />
      )}

      {/* Goals list */}
      {isLoading && goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">{t.common.loading}</p>
        </div>
      ) : (
        <GoalList
          goals={goals}
          onGoalClick={handleGoalClick}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Create/Edit Form Modal */}
      {(showForm || editingGoal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neu-bg rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingGoal ? t.goals.editGoal : t.goals.addGoal}
            </h2>
            <GoalForm
              initialData={editingGoal || undefined}
              onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
              onCancel={() => {
                setShowForm(false)
                setEditingGoal(null)
              }}
              isLoading={mutating}
            />
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          contributions={contributions}
          onClose={clearSelectedGoal}
          onContribute={handleContribute}
          onPause={handlePause}
          onResume={handleResume}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isLoading={mutating}
        />
      )}
    </div>
  )
}
