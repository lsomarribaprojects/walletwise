import { createClient } from '@/lib/supabase/client'
import {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetSummary,
  BudgetProgress,
  CategoryBudget,
  BudgetPeriod,
} from '../types'
import { getCategoryColor } from '@/lib/categoryColors'

const supabase = createClient()

// Helpers para calcular rangos de fechas según período
function getPeriodDateRange(
  period: BudgetPeriod,
  startDate?: string
): { start: string; end: string } {
  const now = new Date()
  const start = startDate ? new Date(startDate) : now
  const end = new Date(start)

  switch (period) {
    case 'daily':
      end.setDate(start.getDate() + 1)
      break
    case 'weekly':
      end.setDate(start.getDate() + 7)
      break
    case 'monthly':
      end.setMonth(start.getMonth() + 1)
      break
    case 'quarterly':
      end.setMonth(start.getMonth() + 3)
      break
    case 'annual':
      end.setFullYear(start.getFullYear() + 1)
      break
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

// Calcular gasto en una categoría durante un período
async function calculateSpentForBudget(
  categoryId: string,
  startDate: string,
  endDate: string,
  userId: string
): Promise<number> {
  // Primero obtenemos el nombre de la categoría
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single()

  if (!category) return 0

  // Buscamos transacciones de tipo gasto con esa categoría
  const { data: transactions, error } = await supabase
    .from('transacciones')
    .select('monto')
    .eq('tipo', 'gasto')
    .eq('categoria', category.name)
    .gte('fecha_hora', startDate)
    .lte('fecha_hora', endDate)

  if (error) {
    console.error('Error calculating spent:', error)
    return 0
  }

  return transactions?.reduce((sum, t) => sum + Number(t.monto), 0) || 0
}

// ============ CRUD OPERATIONS ============

export async function fetchBudgets(): Promise<Budget[]> {
  const { data: budgets, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories (
        id,
        name,
        type
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  // Calcular spent para cada presupuesto
  const budgetsWithSpent = await Promise.all(
    (budgets || []).map(async (budget) => {
      const { start, end } = getPeriodDateRange(
        budget.period,
        budget.start_date
      )

      const spent = await calculateSpentForBudget(
        budget.category_id,
        start,
        end,
        budget.user_id
      )

      return {
        ...budget,
        spent,
        category_name: budget.categories?.name || 'Unknown',
        category_color: getCategoryColor(budget.categories?.name),
      }
    })
  )

  return budgetsWithSpent
}

export async function fetchBudget(id: string): Promise<Budget> {
  const { data: budget, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories (
        id,
        name,
        type
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  const { start, end } = getPeriodDateRange(
    budget.period,
    budget.start_date
  )

  const spent = await calculateSpentForBudget(
    budget.category_id,
    start,
    end,
    budget.user_id
  )

  return {
    ...budget,
    spent,
    category_name: budget.categories?.name || 'Unknown',
    category_color: getCategoryColor(budget.categories?.name),
  }
}

export async function createBudget(
  input: CreateBudgetInput
): Promise<Budget> {
  const { start, end } = getPeriodDateRange(input.period, input.start_date)

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      category_id: input.category_id,
      name: input.name,
      amount: input.amount,
      period: input.period,
      start_date: start,
      end_date: input.end_date || end,
      alert_threshold: input.alert_threshold || 80,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return fetchBudget(data.id)
}

export async function updateBudget(
  id: string,
  updates: UpdateBudgetInput
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return fetchBudget(data.id)
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ============ ANALYTICS ============

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const budgets = await fetchBudgets()

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  const percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  const overspentBudgets = budgets.filter(
    (b) => (b.spent || 0) > Number(b.amount)
  ).length

  return {
    totalBudgeted,
    totalSpent,
    percentageUsed,
    activeBudgets: budgets.length,
    overspentBudgets,
  }
}

export async function getBudgetProgress(
  budgetId: string
): Promise<BudgetProgress> {
  const budget = await fetchBudget(budgetId)
  const spent = budget.spent || 0
  const budgetAmount = Number(budget.amount)
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
  const remaining = budgetAmount - spent

  return {
    budgetId,
    spent,
    budget: budgetAmount,
    percentage,
    remaining,
    isOverspent: spent > budgetAmount,
    isNearThreshold: percentage >= budget.alert_threshold,
  }
}

export async function getOverspentBudgets(): Promise<Budget[]> {
  const budgets = await fetchBudgets()
  return budgets.filter((b) => (b.spent || 0) > Number(b.amount))
}

export async function getCategoryBudgets(): Promise<CategoryBudget[]> {
  const budgets = await fetchBudgets()

  // Agrupar por categoría
  const categoryMap = new Map<string, CategoryBudget>()

  budgets.forEach((budget) => {
    const existing = categoryMap.get(budget.category_id)

    if (existing) {
      existing.budgeted += Number(budget.amount)
      existing.spent += budget.spent || 0
    } else {
      categoryMap.set(budget.category_id, {
        category_id: budget.category_id,
        category_name: budget.category_name || 'Unknown',
        category_color: budget.category_color || '#6B7280',
        budgeted: Number(budget.amount),
        spent: budget.spent || 0,
        percentage: 0,
      })
    }
  })

  // Calcular porcentajes
  const result = Array.from(categoryMap.values()).map((cat) => ({
    ...cat,
    percentage: cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0,
  }))

  return result.sort((a, b) => b.budgeted - a.budgeted)
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data || []
}
