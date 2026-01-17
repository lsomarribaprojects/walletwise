// Tipos para Admin Panel

export interface Category {
  name: string
  color: string
}

export interface UserConfig {
  id: string
  user_id: string
  expense_categories: Category[]
  income_categories: Category[]
  agent_system_prompt: string | null
  calculator_defaults: CalculatorDefaults
  created_at: string
  updated_at: string
}

export interface CalculatorDefaults {
  monthlyRevenue?: number
  fixedCosts?: number
  variableCostPercent?: number
  taxRate?: number
  desiredProfit?: number
}

export type CategoryType = 'expense' | 'income'

// Discount Codes
export interface DiscountCode {
  id: string
  code: string
  description: string | null
  type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  current_uses: number
  min_purchase: number
  valid_from: string
  valid_until: string | null
  applicable_tiers: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type DiscountCodeCreate = Omit<DiscountCode, 'id' | 'created_at' | 'updated_at' | 'current_uses' | 'created_by'>

// Admin Stats
export interface AdminStats {
  totalUsers: number
  paidUsers: number
  conversionRate: number
  activeDiscounts: number
  mrr: number
}

// App Usage
export interface AppUsageLog {
  id: string
  user_id: string
  action: string
  metadata: Record<string, unknown>
  created_at: string
}
