// Tipos para la feature de presupuestos

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface Budget {
  id: string
  user_id: string
  category_id: string
  name: string
  amount: number
  currency_code: string
  period: BudgetPeriod
  start_date: string
  end_date: string | null
  alert_threshold: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Datos calculados
  spent?: number
  category_name?: string
  category_color?: string
}

export interface CreateBudgetInput {
  category_id: string
  name: string
  amount: number
  period: BudgetPeriod
  start_date: string
  end_date?: string | null
  alert_threshold?: number
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  period?: BudgetPeriod
  start_date?: string
  end_date?: string | null
  alert_threshold?: number
  is_active?: boolean
}

export interface BudgetSummary {
  totalBudgeted: number
  totalSpent: number
  percentageUsed: number
  activeBudgets: number
  overspentBudgets: number
}

export interface BudgetProgress {
  budgetId: string
  spent: number
  budget: number
  percentage: number
  remaining: number
  isOverspent: boolean
  isNearThreshold: boolean
}

export interface CategoryBudget {
  category_id: string
  category_name: string
  category_color: string
  budgeted: number
  spent: number
  percentage: number
}
