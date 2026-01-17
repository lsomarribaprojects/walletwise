import { create } from 'zustand'
import { FinancialGoal, GoalStatus, GoalContribution } from '../types'
import {
  fetchGoals,
  fetchGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalStatus,
  addContribution,
  getContributions,
} from '../services/goalService'
import { GoalFormData } from '../types'

interface GoalState {
  goals: FinancialGoal[]
  selectedGoal: FinancialGoal | null
  contributions: GoalContribution[]
  isLoading: boolean
  error: string | null
  filter: GoalStatus | 'all'

  // Actions
  setFilter: (filter: GoalStatus | 'all') => void
  loadGoals: () => Promise<void>
  loadGoal: (id: string) => Promise<void>
  loadContributions: (goalId: string) => Promise<void>
  create: (data: GoalFormData) => Promise<FinancialGoal>
  update: (id: string, data: Partial<GoalFormData>) => Promise<void>
  remove: (id: string) => Promise<void>
  changeStatus: (id: string, status: GoalStatus) => Promise<void>
  contribute: (
    goalId: string,
    amount: number,
    date?: string,
    source?: string,
    notes?: string
  ) => Promise<void>
  clearSelectedGoal: () => void
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  selectedGoal: null,
  contributions: [],
  isLoading: false,
  error: null,
  filter: 'all',

  setFilter: (filter) => set({ filter }),

  loadGoals: async () => {
    set({ isLoading: true, error: null })
    try {
      const filter = get().filter
      const goals = await fetchGoals(filter === 'all' ? undefined : filter)
      set({ goals, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading goals',
        isLoading: false,
      })
    }
  },

  loadGoal: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const goal = await fetchGoal(id)
      set({ selectedGoal: goal, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading goal',
        isLoading: false,
      })
    }
  },

  loadContributions: async (goalId) => {
    try {
      const contributions = await getContributions(goalId)
      set({ contributions })
    } catch (error) {
      console.error('Error loading contributions:', error)
    }
  },

  create: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newGoal = await createGoal(data)
      set((state) => ({
        goals: [newGoal, ...state.goals],
        isLoading: false,
      }))
      return newGoal
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error creating goal',
        isLoading: false,
      })
      throw error
    }
  },

  update: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const updatedGoal = await updateGoal(id, data)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        selectedGoal:
          state.selectedGoal?.id === id ? updatedGoal : state.selectedGoal,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error updating goal',
        isLoading: false,
      })
      throw error
    }
  },

  remove: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteGoal(id)
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        selectedGoal: state.selectedGoal?.id === id ? null : state.selectedGoal,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error deleting goal',
        isLoading: false,
      })
      throw error
    }
  },

  changeStatus: async (id, status) => {
    set({ isLoading: true, error: null })
    try {
      const updatedGoal = await updateGoalStatus(id, status)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
        selectedGoal:
          state.selectedGoal?.id === id ? updatedGoal : state.selectedGoal,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error updating status',
        isLoading: false,
      })
      throw error
    }
  },

  contribute: async (goalId, amount, date, source, notes) => {
    try {
      await addContribution(goalId, amount, date, source, notes)
      // Reload goal to get updated current_amount
      const updatedGoal = await fetchGoal(goalId)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
        selectedGoal:
          state.selectedGoal?.id === goalId ? updatedGoal : state.selectedGoal,
      }))
      // Reload contributions if viewing goal
      if (get().selectedGoal?.id === goalId) {
        const contributions = await getContributions(goalId)
        set({ contributions })
      }
    } catch (error) {
      console.error('Error adding contribution:', error)
      throw error
    }
  },

  clearSelectedGoal: () => set({ selectedGoal: null, contributions: [] }),
}))
