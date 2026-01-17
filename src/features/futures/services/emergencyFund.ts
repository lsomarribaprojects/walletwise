/**
 * Calculadora de Fondo de Emergencia
 * Ayuda al usuario a planificar su fondo de emergencia
 */

import type {
  EmergencyFundCalculation,
  EmergencyFundMilestone
} from '../types'

// =====================================================
// CALCULADORA PRINCIPAL
// =====================================================

/**
 * Calcula el plan de fondo de emergencia
 */
export function calculateEmergencyFund(
  monthlyExpenses: number,
  targetMonths: number = 6,
  currentSavings: number = 0,
  monthlyContribution: number = 0
): EmergencyFundCalculation {
  const targetAmount = monthlyExpenses * targetMonths
  const amountNeeded = Math.max(0, targetAmount - currentSavings)
  const percentageComplete = targetAmount > 0
    ? Math.min(100, (currentSavings / targetAmount) * 100)
    : 100

  // Calcular meses para alcanzar el objetivo
  const monthsToGoal = monthlyContribution > 0
    ? Math.ceil(amountNeeded / monthlyContribution)
    : Infinity

  // Generar milestones
  const milestones = generateEmergencyMilestones(
    monthlyExpenses,
    targetMonths,
    currentSavings,
    monthlyContribution
  )

  // Generar recomendaciones
  const recommendations = generateEmergencyRecommendations(
    currentSavings,
    monthlyExpenses,
    targetAmount,
    monthlyContribution
  )

  // Determinar nivel de riesgo
  const monthsCovered = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0
  const riskLevel = calculateRiskLevel(monthsCovered)

  return {
    monthlyExpenses,
    targetMonths,
    currentSavings,
    targetAmount,
    amountNeeded,
    percentageComplete: Math.round(percentageComplete * 10) / 10,
    savingsPlan: {
      monthlyContribution,
      monthsToGoal: monthsToGoal === Infinity ? 0 : monthsToGoal,
      milestones
    },
    recommendations,
    riskLevel
  }
}

/**
 * Calcula cuánto ahorrar mensualmente para alcanzar el objetivo en X meses
 */
export function calculateRequiredMonthlySavings(
  monthlyExpenses: number,
  targetMonths: number,
  currentSavings: number,
  goalMonths: number
): number {
  const targetAmount = monthlyExpenses * targetMonths
  const amountNeeded = Math.max(0, targetAmount - currentSavings)

  if (goalMonths <= 0) return amountNeeded

  return Math.ceil(amountNeeded / goalMonths)
}

// =====================================================
// MILESTONES
// =====================================================

function generateEmergencyMilestones(
  monthlyExpenses: number,
  targetMonths: number,
  currentSavings: number,
  monthlyContribution: number
): EmergencyFundMilestone[] {
  const milestones: EmergencyFundMilestone[] = []
  const now = new Date()

  // Milestones típicos: 1, 2, 3, 6 meses
  const milestoneMonths = [1, 2, 3, 6].filter(m => m <= targetMonths)

  milestoneMonths.forEach(months => {
    const amount = monthlyExpenses * months
    const isAchieved = currentSavings >= amount

    let monthsToReach = 0
    if (!isAchieved && monthlyContribution > 0) {
      monthsToReach = Math.ceil((amount - currentSavings) / monthlyContribution)
    }

    const date = new Date(now)
    date.setMonth(date.getMonth() + monthsToReach)

    milestones.push({
      months,
      amount,
      date,
      label: months === 1
        ? '1 mes de gastos'
        : `${months} meses de gastos`,
      isAchieved
    })
  })

  return milestones
}

// =====================================================
// RECOMENDACIONES
// =====================================================

function generateEmergencyRecommendations(
  currentSavings: number,
  monthlyExpenses: number,
  targetAmount: number,
  monthlyContribution: number
): string[] {
  const recommendations: string[] = []
  const monthsCovered = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0

  // Sin fondo
  if (currentSavings === 0) {
    recommendations.push(
      '🚨 No tienes fondo de emergencia. Esto es tu prioridad #1.'
    )
    recommendations.push(
      '💡 Empieza con una meta pequeña: $1,000 o 1 mes de gastos.'
    )
  }

  // Fondo bajo
  if (monthsCovered > 0 && monthsCovered < 1) {
    recommendations.push(
      '⚠️ Tu fondo cubre menos de 1 mes. Una emergencia podría llevarte a endeudarte.'
    )
  }

  // Progreso
  if (monthsCovered >= 1 && monthsCovered < 3) {
    recommendations.push(
      '✅ ¡Buen inicio! Tienes algo de colchón, pero sigue construyendo.'
    )
  }

  // Sin contribución mensual
  if (monthlyContribution === 0 && currentSavings < targetAmount) {
    recommendations.push(
      '📊 Define un monto fijo mensual para tu fondo. Automatízalo si es posible.'
    )
  }

  // Contribución baja
  if (monthlyContribution > 0 && monthlyContribution < monthlyExpenses * 0.1) {
    recommendations.push(
      '💰 Considera aumentar tu contribución mensual. Actualmente es menos del 10% de tus gastos.'
    )
  }

  // Meta alcanzada
  if (currentSavings >= targetAmount) {
    recommendations.push(
      '🎉 ¡Felicitaciones! Has alcanzado tu meta de fondo de emergencia.'
    )
    recommendations.push(
      '💡 Considera invertir el excedente o aumentar tus aportes a deuda/retiro.'
    )
  }

  // Dónde guardarlo
  if (currentSavings > 0) {
    recommendations.push(
      '🏦 Guarda tu fondo en una cuenta de ahorros de alto rendimiento, separada de tu cuenta principal.'
    )
  }

  return recommendations
}

// =====================================================
// NIVEL DE RIESGO
// =====================================================

function calculateRiskLevel(monthsCovered: number): 'low' | 'medium' | 'high' | 'critical' {
  if (monthsCovered >= 6) return 'low'
  if (monthsCovered >= 3) return 'medium'
  if (monthsCovered >= 1) return 'high'
  return 'critical'
}

/**
 * Obtiene información del nivel de riesgo
 */
export function getRiskLevelInfo(riskLevel: 'low' | 'medium' | 'high' | 'critical'): {
  label: string
  color: string
  emoji: string
  description: string
} {
  const info = {
    low: {
      label: 'Bajo',
      color: '#10B981',
      emoji: '🛡️',
      description: 'Excelente. Estás bien protegido ante emergencias.'
    },
    medium: {
      label: 'Medio',
      color: '#F59E0B',
      emoji: '⚠️',
      description: 'Tienes algo de protección, pero podrías mejorar.'
    },
    high: {
      label: 'Alto',
      color: '#F97316',
      emoji: '🔶',
      description: 'Una emergencia grande podría afectarte significativamente.'
    },
    critical: {
      label: 'Crítico',
      color: '#EF4444',
      emoji: '🚨',
      description: 'Sin colchón financiero. Cualquier emergencia es una crisis.'
    }
  }

  return info[riskLevel]
}

// =====================================================
// CALCULADORAS ADICIONALES
// =====================================================

/**
 * Calcula el impacto de una emergencia en tus finanzas
 */
export function simulateEmergency(
  currentSavings: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  emergencyAmount: number
): {
  coveredByFund: number
  shortfall: number
  monthsToRecover: number
  wouldNeedDebt: boolean
} {
  const coveredByFund = Math.min(currentSavings, emergencyAmount)
  const shortfall = Math.max(0, emergencyAmount - currentSavings)
  const monthlySurplus = monthlyIncome - monthlyExpenses
  const monthsToRecover = monthlySurplus > 0
    ? Math.ceil(emergencyAmount / monthlySurplus)
    : Infinity

  return {
    coveredByFund,
    shortfall,
    monthsToRecover,
    wouldNeedDebt: shortfall > 0
  }
}

/**
 * Sugiere un monto objetivo basado en la situación del usuario
 */
export function suggestTargetMonths(
  hasStableIncome: boolean,
  hasDependents: boolean,
  hasHighDebt: boolean,
  isFreelancer: boolean
): {
  recommended: number
  minimum: number
  ideal: number
  reasoning: string
} {
  let recommended = 3
  let minimum = 1
  let ideal = 6

  // Ajustar basado en situación
  if (isFreelancer || !hasStableIncome) {
    recommended = 6
    ideal = 12
  }

  if (hasDependents) {
    recommended = Math.max(recommended, 6)
    ideal = 9
  }

  if (hasHighDebt) {
    // Con deuda alta, priorizar fondo mínimo y luego deuda
    recommended = 3
    minimum = 1
  }

  let reasoning = `Recomendamos ${recommended} meses porque `

  if (isFreelancer) {
    reasoning += 'tu ingreso es variable. '
  } else if (!hasStableIncome) {
    reasoning += 'tu ingreso no es completamente estable. '
  }

  if (hasDependents) {
    reasoning += 'tienes personas que dependen de ti. '
  }

  if (hasHighDebt) {
    reasoning += 'aunque tienes deuda, necesitas un mínimo de protección. '
  }

  return {
    recommended,
    minimum,
    ideal,
    reasoning: reasoning.trim()
  }
}
