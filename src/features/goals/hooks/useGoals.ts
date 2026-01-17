'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useGoalStore } from '../store/goalStore'
import { calculateProgress, calculateGoalStats } from '../services/goalCalculator'
import { GoalStatus, GoalFormData, FinancialGoal } from '../types'

/**
 * Hook para listar metas con filtros
 */
export function useGoals(status?: GoalStatus | 'all') {
  const {
    goals,
    isLoading,
    error,
    filter,
    setFilter,
    loadGoals,
  } = useGoalStore()

  useEffect(() => {
    if (status && status !== filter) {
      setFilter(status)
    }
  }, [status, filter, setFilter])

  useEffect(() => {
    loadGoals()
  }, [filter, loadGoals])

  const filteredGoals = useMemo(() => {
    if (filter === 'all') return goals
    return goals.filter((g) => g.status === filter)
  }, [goals, filter])

  const stats = useMemo(() => calculateGoalStats(goals), [goals])

  return {
    goals: filteredGoals,
    allGoals: goals,
    isLoading,
    error,
    filter,
    setFilter,
    stats,
    refresh: loadGoals,
  }
}

/**
 * Hook para una meta específica con progreso
 */
export function useGoal(id: string | null) {
  const {
    selectedGoal,
    contributions,
    isLoading,
    error,
    loadGoal,
    loadContributions,
    clearSelectedGoal,
  } = useGoalStore()

  useEffect(() => {
    if (id) {
      loadGoal(id)
      loadContributions(id)
    } else {
      clearSelectedGoal()
    }
    return () => clearSelectedGoal()
  }, [id, loadGoal, loadContributions, clearSelectedGoal])

  const progress = useMemo(() => {
    if (!selectedGoal) return null
    return calculateProgress(selectedGoal)
  }, [selectedGoal])

  return {
    goal: selectedGoal,
    contributions,
    progress,
    isLoading,
    error,
    refresh: () => id && loadGoal(id),
  }
}

/**
 * Hook para mutaciones de metas
 */
export function useGoalMutations() {
  const {
    create,
    update,
    remove,
    changeStatus,
    contribute,
    isLoading,
  } = useGoalStore()

  const createGoal = useCallback(async (data: GoalFormData) => {
    return await create(data)
  }, [create])

  const updateGoal = useCallback(async (id: string, data: Partial<GoalFormData>) => {
    await update(id, data)
  }, [update])

  const deleteGoal = useCallback(async (id: string) => {
    await remove(id)
  }, [remove])

  const updateStatus = useCallback(async (id: string, status: GoalStatus) => {
    await changeStatus(id, status)
  }, [changeStatus])

  const addContribution = useCallback(
    async (
      goalId: string,
      amount: number,
      date?: string,
      source?: string,
      notes?: string
    ) => {
      await contribute(goalId, amount, date, source, notes)
    },
    [contribute]
  )

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    updateStatus,
    addContribution,
    isLoading,
  }
}

/**
 * Hook para calcular progreso de una meta inline
 */
export function useGoalProgress(goal: FinancialGoal | null) {
  return useMemo(() => {
    if (!goal) return null
    return calculateProgress(goal)
  }, [goal])
}
