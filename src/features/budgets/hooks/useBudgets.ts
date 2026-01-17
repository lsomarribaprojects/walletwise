import { useEffect } from 'react'
import { useBudgetStore } from '../store/budgetStore'
import {
  fetchBudgets,
  fetchBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
  getBudgetProgress,
  getOverspentBudgets,
} from '../services/budgetService'
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetProgress,
} from '../types'

export function useBudgets() {
  const {
    budgets,
    summary,
    isLoading,
    error,
    setBudgets,
    setSummary,
    setLoading,
    setError,
    addBudget,
    updateBudgetInStore,
    removeBudget,
  } = useBudgetStore()

  useEffect(() => {
    loadBudgets()
    loadSummary()
  }, [])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchBudgets()
      setBudgets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading budgets')
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const data = await getBudgetSummary()
      setSummary(data)
    } catch (err) {
      console.error('Error loading summary:', err)
    }
  }

  const create = async (input: CreateBudgetInput) => {
    try {
      setLoading(true)
      setError(null)
      const newBudget = await createBudget(input)
      addBudget(newBudget)
      await loadSummary()
      return newBudget
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating budget')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, updates: UpdateBudgetInput) => {
    try {
      setLoading(true)
      setError(null)
      const updated = await updateBudget(id, updates)
      updateBudgetInStore(id, updated)
      await loadSummary()
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating budget')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteBudget(id)
      removeBudget(id)
      await loadSummary()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting budget')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    budgets,
    summary,
    isLoading,
    error,
    loadBudgets,
    createBudget: create,
    updateBudget: update,
    deleteBudget: remove,
  }
}

export function useBudget(id: string) {
  const { budgets, isLoading, error } = useBudgetStore()
  const budget = budgets.find((b) => b.id === id)

  return {
    budget,
    isLoading,
    error,
  }
}

export function useBudgetProgress(budgetId: string) {
  const { isLoading, error, setLoading, setError } = useBudgetStore()

  const loadProgress = async (): Promise<BudgetProgress | null> => {
    try {
      setLoading(true)
      setError(null)
      return await getBudgetProgress(budgetId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading progress')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loadProgress,
    isLoading,
    error,
  }
}

export function useOverspentBudgets() {
  const { setLoading, setError } = useBudgetStore()

  const loadOverspent = async () => {
    try {
      setLoading(true)
      setError(null)
      return await getOverspentBudgets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading overspent budgets')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    loadOverspent,
  }
}
