import { createClient } from '@/lib/supabase/client'
import {
  FinancialGoal,
  GoalFormData,
  GoalContribution,
  GoalStatus,
  Milestone,
  DEFAULT_MILESTONES,
} from '../types'
import { checkMilestones } from './goalCalculator'

const supabase = createClient()

// ============ CRUD OPERATIONS ============

/**
 * Obtiene todas las metas del usuario
 */
export async function fetchGoals(status?: GoalStatus): Promise<FinancialGoal[]> {
  let query = supabase
    .from('financial_goals')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  return (data || []).map((goal) => ({
    ...goal,
    milestones: goal.milestones || [],
  }))
}

/**
 * Obtiene una meta específica
 */
export async function fetchGoal(id: string): Promise<FinancialGoal> {
  const { data, error } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    milestones: data.milestones || [],
  }
}

/**
 * Crea una nueva meta
 */
export async function createGoal(input: GoalFormData): Promise<FinancialGoal> {
  // Generar milestones por defecto basados en el target_amount
  const milestones = DEFAULT_MILESTONES.map((m) => ({
    ...m,
    targetAmount: input.target_amount * m.targetAmount,
  }))

  const { data, error } = await supabase
    .from('financial_goals')
    .insert({
      name: input.name,
      description: input.description,
      goal_type: input.goal_type,
      target_amount: input.target_amount,
      target_date: input.target_date,
      priority: input.priority,
      icon: input.icon,
      color: input.color,
      linked_account_id: input.linked_account_id,
      auto_track: input.auto_track,
      monthly_contribution: input.monthly_contribution,
      milestones,
      status: 'active',
      current_amount: 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return fetchGoal(data.id)
}

/**
 * Actualiza una meta existente
 */
export async function updateGoal(
  id: string,
  updates: Partial<GoalFormData>
): Promise<FinancialGoal> {
  const { data, error } = await supabase
    .from('financial_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return fetchGoal(data.id)
}

/**
 * Elimina una meta (soft delete: marca como cancelled)
 */
export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_goals')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Cambia el status de una meta
 */
export async function updateGoalStatus(
  id: string,
  status: GoalStatus
): Promise<FinancialGoal> {
  const { data, error } = await supabase
    .from('financial_goals')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return fetchGoal(data.id)
}

// ============ CONTRIBUTIONS ============

/**
 * Agrega una contribución a una meta
 */
export async function addContribution(
  goalId: string,
  amount: number,
  contributionDate?: string,
  source?: string,
  notes?: string
): Promise<GoalContribution> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: goalId,
      amount,
      contribution_date: contributionDate || new Date().toISOString().split('T')[0],
      source,
      notes,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // El trigger automáticamente actualiza current_amount
  // Verificar milestones
  await updateMilestones(goalId)

  return data
}

/**
 * Obtiene todas las contribuciones de una meta
 */
export async function getContributions(goalId: string): Promise<GoalContribution[]> {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contribution_date', { ascending: false })

  if (error) throw new Error(error.message)

  return data || []
}

/**
 * Elimina una contribución
 */
export async function deleteContribution(
  id: string,
  goalId: string,
  amount: number
): Promise<void> {
  // Primero eliminar la contribución
  const { error: deleteError } = await supabase
    .from('goal_contributions')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(deleteError.message)

  // Actualizar manualmente el current_amount (restar la contribución eliminada)
  const { error: updateError } = await supabase.rpc('update_goal_amount', {
    goal_uuid: goalId,
    amount_delta: -amount,
  })

  if (updateError) {
    // Si no existe la función RPC, hacerlo manualmente
    const goal = await fetchGoal(goalId)
    await supabase
      .from('financial_goals')
      .update({
        current_amount: Math.max(0, goal.current_amount - amount),
      })
      .eq('id', goalId)
  }

  // Actualizar milestones
  await updateMilestones(goalId)
}

// ============ PROGRESS & ANALYTICS ============

/**
 * Actualiza el progreso de una meta con auto-tracking
 */
export async function updateProgress(goalId: string): Promise<void> {
  const goal = await fetchGoal(goalId)

  if (!goal.auto_track || !goal.linked_account_id) return

  // Obtener balance actual de la cuenta vinculada
  const { data: account, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', goal.linked_account_id)
    .single()

  if (error) {
    console.error('Error fetching linked account:', error)
    return
  }

  // Actualizar current_amount con el balance de la cuenta
  await supabase
    .from('financial_goals')
    .update({
      current_amount: Number(account.balance),
    })
    .eq('id', goalId)

  // Verificar milestones
  await updateMilestones(goalId)
}

/**
 * Verifica y actualiza los milestones alcanzados
 */
async function updateMilestones(goalId: string): Promise<void> {
  const goal = await fetchGoal(goalId)
  const updatedMilestones = checkMilestones(goal)

  await supabase
    .from('financial_goals')
    .update({
      milestones: updatedMilestones,
    })
    .eq('id', goalId)
}

/**
 * Obtiene el progreso usando la función SQL
 */
export async function getGoalProgressFromDB(goalId: string) {
  const { data, error } = await supabase.rpc('get_goal_progress', {
    goal_uuid: goalId,
  })

  if (error) {
    console.error('Error fetching goal progress:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Obtiene estadísticas agregadas de metas
 */
export async function getGoalStats() {
  const goals = await fetchGoals('active')

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  return {
    totalGoals: goals.length,
    totalTarget,
    totalCurrent,
    totalProgress,
  }
}
