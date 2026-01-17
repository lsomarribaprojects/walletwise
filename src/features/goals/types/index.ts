// Tipos para la feature de metas financieras

export type GoalType =
  | 'savings'
  | 'debt_payoff'
  | 'emergency_fund'
  | 'purchase'
  | 'investment'
  | 'retirement'
  | 'custom'

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export interface Milestone {
  id: string
  name: string
  targetAmount: number
  reachedAt?: string
  icon?: string
}

export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  description?: string
  goal_type: GoalType
  target_amount: number
  current_amount: number
  start_date: string
  target_date?: string
  status: GoalStatus
  priority: number
  icon: string
  color: string
  linked_account_id?: string
  auto_track: boolean
  monthly_contribution?: number
  milestones: Milestone[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface GoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  contribution_date: string
  source?: string
  notes?: string
  created_at: string
}

export interface GoalProgress {
  percentage: number
  daysRemaining: number
  daysElapsed: number
  onTrack: boolean
  projectedCompletion?: string
  monthlyNeeded: number
  nextMilestone?: Milestone
}

export interface GoalFormData {
  name: string
  description?: string
  goal_type: GoalType
  target_amount: number
  target_date?: string
  priority: number
  icon: string
  color: string
  linked_account_id?: string
  auto_track: boolean
  monthly_contribution?: number
}

export interface GoalTypeConfig {
  icon: string
  color: string
  label: string
}

export const GOAL_TYPE_CONFIG: Record<GoalType, GoalTypeConfig> = {
  savings: { icon: '💰', color: '#22C55E', label: 'Ahorro' },
  debt_payoff: { icon: '💳', color: '#EF4444', label: 'Pagar Deuda' },
  emergency_fund: { icon: '🛡️', color: '#3B82F6', label: 'Fondo de Emergencia' },
  purchase: { icon: '🛒', color: '#8B5CF6', label: 'Compra' },
  investment: { icon: '📈', color: '#F59E0B', label: 'Inversión' },
  retirement: { icon: '🏖️', color: '#EC4899', label: 'Jubilación' },
  custom: { icon: '🎯', color: '#6B7280', label: 'Personalizado' },
}

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: '1', name: '25% Alcanzado', targetAmount: 0.25, icon: '🎯' },
  { id: '2', name: '50% Alcanzado', targetAmount: 0.5, icon: '🎯' },
  { id: '3', name: '75% Alcanzado', targetAmount: 0.75, icon: '🎯' },
  { id: '4', name: '100% Completado', targetAmount: 1.0, icon: '🎉' },
]
