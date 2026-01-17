import { create } from 'zustand'
import { Budget, BudgetSummary } from '../types'

interface BudgetStore {
  budgets: Budget[]
  summary: BudgetSummary | null
  selectedPeriod: string
  isLoading: boolean
  error: string | null

  // Actions
  setBudgets: (budgets: Budget[]) => void
  setSummary: (summary: BudgetSummary) => void
  setSelectedPeriod: (period: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addBudget: (budget: Budget) => void
  updateBudgetInStore: (id: string, updates: Partial<Budget>) => void
  removeBudget: (id: string) => void
  reset: () => void
}

const initialState = {
  budgets: [],
  summary: null,
  selectedPeriod: 'all',
  isLoading: false,
  error: null,
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  ...initialState,

  setBudgets: (budgets) => set({ budgets }),

  setSummary: (summary) => set({ summary }),

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  addBudget: (budget) =>
    set((state) => ({
      budgets: [budget, ...state.budgets],
    })),

  updateBudgetInStore: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  removeBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  reset: () => set(initialState),
}))
