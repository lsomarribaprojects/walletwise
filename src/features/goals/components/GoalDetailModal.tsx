'use client'

import { useState } from 'react'
import { FinancialGoal, GoalContribution, GOAL_TYPE_CONFIG } from '../types'
import { GoalProgress } from './GoalProgress'
import { GoalMilestones } from './GoalMilestones'
import { GoalContributionForm } from './GoalContributionForm'
import { NeuButton, NeuCard } from '@/shared/components/ui'
import { useGoalProgress } from '../hooks/useGoals'

interface GoalDetailModalProps {
  goal: FinancialGoal
  contributions: GoalContribution[]
  onClose: () => void
  onContribute: (amount: number, date: string, source?: string, notes?: string) => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onDelete: () => Promise<void>
  onEdit: () => void
  isLoading?: boolean
}

export function GoalDetailModal({
  goal,
  contributions,
  onClose,
  onContribute,
  onPause,
  onResume,
  onDelete,
  onEdit,
  isLoading,
}: GoalDetailModalProps) {
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const progress = useGoalProgress(goal)
  const typeConfig = GOAL_TYPE_CONFIG[goal.goal_type]

  const handleContribute = async (amount: number, date: string, source?: string, notes?: string) => {
    await onContribute(amount, date, source, notes)
    setShowContributionForm(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neu-bg rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${goal.color}20` }}
              >
                {goal.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{goal.name}</h2>
                <p className="text-sm text-gray-500">{typeConfig.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {showContributionForm ? (
            <GoalContributionForm
              goalName={goal.name}
              onSubmit={handleContribute}
              onCancel={() => setShowContributionForm(false)}
              isLoading={isLoading}
            />
          ) : showDeleteConfirm ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                ¿Estas seguro de que deseas eliminar esta meta?
              </p>
              <p className="text-sm text-gray-500">
                Esta accion no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <NeuButton
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </NeuButton>
                <NeuButton
                  variant="primary"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </NeuButton>
              </div>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex justify-center">
                <GoalProgress goal={goal} size="lg" />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <NeuCard size="sm" variant="inset" className="text-center">
                  <p className="text-sm text-gray-500">Actual</p>
                  <p className="text-xl font-bold" style={{ color: goal.color }}>
                    ${goal.current_amount.toLocaleString('es-MX')}
                  </p>
                </NeuCard>
                <NeuCard size="sm" variant="inset" className="text-center">
                  <p className="text-sm text-gray-500">Meta</p>
                  <p className="text-xl font-bold text-gray-700">
                    ${goal.target_amount.toLocaleString('es-MX')}
                  </p>
                </NeuCard>
              </div>

              {/* Projected completion */}
              {progress?.projectedCompletion && goal.status === 'active' && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Fecha estimada de completacion:</span>{' '}
                    {new Date(progress.projectedCompletion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <GoalMilestones
                  milestones={goal.milestones}
                  currentAmount={goal.current_amount}
                  targetAmount={goal.target_amount}
                />
              )}

              {/* Recent contributions */}
              {contributions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Contribuciones Recientes
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {contributions.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            +${c.amount.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(c.contribution_date).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                        {c.source && (
                          <span className="text-xs text-gray-400">{c.source}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {goal.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Descripcion
                  </h4>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              )}

              {/* Actions */}
              {goal.status === 'active' && (
                <div className="space-y-3">
                  <NeuButton
                    variant="primary"
                    onClick={() => setShowContributionForm(true)}
                    className="w-full"
                  >
                    + Agregar Contribucion
                  </NeuButton>
                  <div className="flex gap-3">
                    <NeuButton
                      variant="secondary"
                      onClick={onEdit}
                      className="flex-1"
                    >
                      Editar
                    </NeuButton>
                    <NeuButton
                      variant="secondary"
                      onClick={onPause}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Pausar
                    </NeuButton>
                  </div>
                </div>
              )}

              {goal.status === 'paused' && (
                <div className="flex gap-3">
                  <NeuButton
                    variant="primary"
                    onClick={onResume}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Reanudar
                  </NeuButton>
                  <NeuButton
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 !text-red-500"
                  >
                    Eliminar
                  </NeuButton>
                </div>
              )}

              {goal.status === 'completed' && (
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <span className="text-4xl">🎉</span>
                  <p className="text-green-600 font-medium mt-2">
                    ¡Meta completada!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
