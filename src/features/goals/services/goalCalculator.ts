import { FinancialGoal, GoalProgress, Milestone } from '../types'

/**
 * Calcula el progreso detallado de una meta financiera
 */
export function calculateProgress(goal: FinancialGoal): GoalProgress {
  const now = new Date()
  const startDate = new Date(goal.start_date)
  const targetDate = goal.target_date ? new Date(goal.target_date) : null

  // Calcular días
  const daysElapsed = Math.max(
    0,
    Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const daysRemaining = targetDate
    ? Math.max(
        0,
        Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      )
    : 0

  // Calcular porcentaje
  const percentage =
    goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0

  // Calcular monto mensual necesario
  const monthlyNeeded = calculateMonthlyNeeded(goal)

  // Determinar si está en track
  const onTrack = isOnTrack(goal)

  // Proyectar fecha de completación
  const projectedCompletion = projectCompletionDate(goal)

  // Obtener siguiente milestone
  const nextMilestone = getNextMilestone(goal)

  return {
    percentage: Math.min(100, percentage),
    daysRemaining,
    daysElapsed,
    onTrack,
    projectedCompletion: projectedCompletion?.toISOString().split('T')[0],
    monthlyNeeded,
    nextMilestone: nextMilestone || undefined,
  }
}

/**
 * Calcula cuánto se necesita aportar mensualmente para alcanzar la meta
 */
export function calculateMonthlyNeeded(goal: FinancialGoal): number {
  if (goal.current_amount >= goal.target_amount) return 0

  const remaining = goal.target_amount - goal.current_amount

  if (!goal.target_date) {
    // Si no hay fecha objetivo, asume 12 meses
    return remaining / 12
  }

  const now = new Date()
  const targetDate = new Date(goal.target_date)
  const monthsRemaining = Math.max(
    1,
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  return remaining / monthsRemaining
}

/**
 * Proyecta la fecha de completación basada en el ritmo actual
 */
export function projectCompletionDate(goal: FinancialGoal): Date | null {
  if (goal.current_amount >= goal.target_amount) {
    return new Date() // Ya completado
  }

  const now = new Date()
  const startDate = new Date(goal.start_date)
  const daysElapsed = Math.max(
    1,
    Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Calcular tasa mensual basada en progreso o contribución mensual
  let monthlyRate = 0

  if (daysElapsed > 30 && goal.current_amount > 0) {
    // Usar tasa histórica
    monthlyRate = (goal.current_amount / daysElapsed) * 30
  } else if (goal.monthly_contribution) {
    // Usar contribución planificada
    monthlyRate = goal.monthly_contribution
  } else {
    return null // No hay suficiente información
  }

  if (monthlyRate <= 0) return null

  const remaining = goal.target_amount - goal.current_amount
  const monthsNeeded = remaining / monthlyRate
  const daysNeeded = Math.ceil(monthsNeeded * 30)

  const projected = new Date()
  projected.setDate(projected.getDate() + daysNeeded)

  return projected
}

/**
 * Determina si la meta está en track para completarse a tiempo
 */
export function isOnTrack(goal: FinancialGoal): boolean {
  // Si no hay fecha objetivo, siempre está en track
  if (!goal.target_date) return true

  // Si ya está completado, está en track
  if (goal.current_amount >= goal.target_amount) return true

  const now = new Date()
  const startDate = new Date(goal.start_date)
  const targetDate = new Date(goal.target_date)

  // Si aún no ha empezado, está en track
  if (now < startDate) return true

  // Si ya pasó la fecha objetivo, no está en track
  if (now > targetDate) return false

  const totalDays = Math.max(
    1,
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const elapsedDays = Math.max(
    0,
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const expectedProgress = (elapsedDays / totalDays) * goal.target_amount
  const actualProgress = goal.current_amount

  // Considera "on track" si está dentro del 90% del progreso esperado
  return actualProgress >= expectedProgress * 0.9
}

/**
 * Obtiene el siguiente milestone sin alcanzar
 */
export function getNextMilestone(goal: FinancialGoal): Milestone | null {
  if (!goal.milestones || goal.milestones.length === 0) return null

  const currentPercentage = goal.current_amount / goal.target_amount

  // Buscar el primer milestone no alcanzado
  const unreached = goal.milestones.find(
    (m) => !m.reachedAt && m.targetAmount > currentPercentage
  )

  return unreached || null
}

/**
 * Verifica y actualiza milestones alcanzados
 */
export function checkMilestones(goal: FinancialGoal): Milestone[] {
  if (!goal.milestones || goal.milestones.length === 0) return []

  const currentPercentage = goal.current_amount / goal.target_amount
  const now = new Date().toISOString()

  return goal.milestones.map((milestone) => {
    // Si ya estaba alcanzado, mantenerlo
    if (milestone.reachedAt) return milestone

    // Si se alcanzó ahora, marcarlo
    if (currentPercentage >= milestone.targetAmount) {
      return {
        ...milestone,
        reachedAt: now,
      }
    }

    return milestone
  })
}

/**
 * Calcula estadísticas agregadas de múltiples metas
 */
export function calculateGoalStats(goals: FinancialGoal[]) {
  const activeGoals = goals.filter((g) => g.status === 'active')

  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0)
  const totalCurrent = activeGoals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  // Encontrar la meta más cercana a completarse
  const nearestCompletion = activeGoals
    .filter((g) => g.current_amount < g.target_amount)
    .map((g) => ({
      goal: g,
      percentage: (g.current_amount / g.target_amount) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage)[0]

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: goals.filter((g) => g.status === 'completed').length,
    totalTarget,
    totalCurrent,
    totalProgress,
    nearestCompletion: nearestCompletion?.goal,
  }
}
