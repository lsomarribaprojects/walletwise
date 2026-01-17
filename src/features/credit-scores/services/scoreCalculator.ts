/**
 * Calculador de Credit Score y generador de tips
 */

import type { ScoreFactors, ScoreFactor, ScoreTip, CalculatedScoreResponse } from '../types'
import {
  getScoreRange,
  getFactorImpact,
  FACTOR_LABELS,
  FACTOR_WEIGHTS,
  FACTOR_DESCRIPTIONS
} from '../types'

// =====================================================
// CONVERSIÓN DE FACTORES
// =====================================================

/**
 * Convierte factores (0-100) a score FICO (300-850)
 */
export function factorsToScore(factors: ScoreFactors): number {
  const weighted =
    factors.payment_history * 0.35 +
    factors.credit_utilization * 0.30 +
    factors.credit_age * 0.15 +
    factors.credit_mix * 0.10 +
    factors.hard_inquiries * 0.10

  // Convertir de 0-100 a 300-850
  const score = 300 + Math.round((weighted / 100) * 550)

  return Math.min(850, Math.max(300, score))
}

/**
 * Convierte factores a ScoreFactor con metadata
 */
export function buildScoreFactors(factors: ScoreFactors): ScoreFactor[] {
  return Object.entries(factors).map(([key, value]) => {
    const name = key as keyof ScoreFactors
    return {
      name,
      label: FACTOR_LABELS[name],
      value,
      weight: FACTOR_WEIGHTS[name],
      impact: getFactorImpact(value),
      description: FACTOR_DESCRIPTIONS[name]
    }
  })
}

// =====================================================
// GENERADOR DE TIPS
// =====================================================

/**
 * Genera tips personalizados basados en los factores
 */
export function generateScoreTips(factors: ScoreFactors): ScoreTip[] {
  const tips: ScoreTip[] = []

  // Payment History (35%)
  if (factors.payment_history < 90) {
    tips.push({
      id: 'payment-history-1',
      title: 'Pay all bills on time',
      description:
        'Payment history is the most important factor. Set up automatic payments to never miss a due date.',
      impact: 'high',
      category: 'payment_history',
      actionable: true
    })
  }

  if (factors.payment_history < 70) {
    tips.push({
      id: 'payment-history-2',
      title: 'Catch up on late payments',
      description:
        'If you have late payments, bring them current as soon as possible. The impact of late payments decreases over time.',
      impact: 'high',
      category: 'payment_history',
      actionable: true
    })
  }

  // Credit Utilization (30%)
  if (factors.credit_utilization < 90) {
    tips.push({
      id: 'utilization-1',
      title: 'Reduce credit card balances',
      description:
        'Keep your credit utilization below 30%. Pay down balances or request credit limit increases.',
      impact: factors.credit_utilization < 50 ? 'high' : 'medium',
      category: 'credit_utilization',
      actionable: true
    })
  }

  if (factors.credit_utilization < 70) {
    tips.push({
      id: 'utilization-2',
      title: 'Pay off high-balance cards first',
      description:
        'Focus on paying down cards with the highest utilization ratios. Even small reductions can improve your score.',
      impact: 'high',
      category: 'credit_utilization',
      actionable: true
    })
  }

  if (factors.credit_utilization < 50) {
    tips.push({
      id: 'utilization-3',
      title: 'Request credit limit increases',
      description:
        'Contact your credit card issuers to request higher limits. This instantly lowers your utilization ratio.',
      impact: 'medium',
      category: 'credit_utilization',
      actionable: true
    })
  }

  // Credit Age (15%)
  if (factors.credit_age < 70) {
    tips.push({
      id: 'age-1',
      title: 'Keep old accounts open',
      description:
        "Don't close old credit cards even if you don't use them. They help your average credit age.",
      impact: 'medium',
      category: 'credit_age',
      actionable: true
    })
  }

  if (factors.credit_age < 50) {
    tips.push({
      id: 'age-2',
      title: 'Become an authorized user',
      description:
        "Ask a family member with a long credit history to add you as an authorized user on their card.",
      impact: 'medium',
      category: 'credit_age',
      actionable: true
    })
  }

  // Credit Mix (10%)
  if (factors.credit_mix < 70) {
    tips.push({
      id: 'mix-1',
      title: 'Diversify your credit types',
      description:
        'Having a mix of credit cards, installment loans, and other credit types can help your score.',
      impact: 'low',
      category: 'credit_mix',
      actionable: true
    })
  }

  // Hard Inquiries (10%)
  if (factors.hard_inquiries < 80) {
    tips.push({
      id: 'inquiries-1',
      title: 'Limit new credit applications',
      description:
        'Avoid applying for multiple credit cards or loans in a short period. Each application can temporarily lower your score.',
      impact: 'low',
      category: 'hard_inquiries',
      actionable: true
    })
  }

  if (factors.hard_inquiries < 60) {
    tips.push({
      id: 'inquiries-2',
      title: 'Wait before applying for new credit',
      description:
        'Hard inquiries stay on your report for 2 years. Wait at least 6 months between applications.',
      impact: 'low',
      category: 'hard_inquiries',
      actionable: true
    })
  }

  // Tips generales basados en score total
  const totalScore = factorsToScore(factors)

  if (totalScore < 670) {
    tips.push({
      id: 'general-1',
      title: 'Consider credit counseling',
      description:
        'If you are struggling with debt, non-profit credit counseling services can help you create a plan.',
      impact: 'high',
      category: 'payment_history',
      actionable: true
    })
  }

  if (totalScore >= 740 && totalScore < 800) {
    tips.push({
      id: 'general-2',
      title: "You're close to exceptional!",
      description:
        'Keep up the good work. Focus on the factors with the lowest scores to reach the exceptional range.',
      impact: 'medium',
      category: 'payment_history',
      actionable: false
    })
  }

  if (totalScore >= 800) {
    tips.push({
      id: 'general-3',
      title: 'Maintain your excellent score',
      description:
        'Your score is exceptional! Continue your good habits: pay on time, keep utilization low, and avoid unnecessary credit applications.',
      impact: 'low',
      category: 'payment_history',
      actionable: false
    })
  }

  // Ordenar por impacto (high > medium > low)
  return tips.sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 }
    return impactOrder[a.impact] - impactOrder[b.impact]
  })
}

/**
 * Calcula el score completo con tips
 */
export function calculateFullScore(factors: ScoreFactors): CalculatedScoreResponse {
  const score = factorsToScore(factors)
  const range = getScoreRange(score)
  const tips = generateScoreTips(factors)

  return {
    score,
    factors,
    range,
    tips
  }
}

// =====================================================
// SIMULACIONES
// =====================================================

/**
 * Simula el impacto de mejorar un factor
 */
export function simulateFactorImprovement(
  currentFactors: ScoreFactors,
  factor: keyof ScoreFactors,
  newValue: number
): { currentScore: number; newScore: number; improvement: number } {
  const currentScore = factorsToScore(currentFactors)

  const newFactors = { ...currentFactors, [factor]: newValue }
  const newScore = factorsToScore(newFactors)

  return {
    currentScore,
    newScore,
    improvement: newScore - currentScore
  }
}

/**
 * Encuentra el factor que más impacto tendría si se mejora
 */
export function findHighestImpactFactor(factors: ScoreFactors): {
  factor: keyof ScoreFactors
  currentValue: number
  potentialImprovement: number
} {
  const simulations = Object.keys(factors).map((key) => {
    const factor = key as keyof ScoreFactors
    const currentValue = factors[factor]
    const simulation = simulateFactorImprovement(factors, factor, 100)
    return {
      factor,
      currentValue,
      potentialImprovement: simulation.improvement
    }
  })

  return simulations.reduce((max, current) =>
    current.potentialImprovement > max.potentialImprovement ? current : max
  )
}

// =====================================================
// VALIDACIONES
// =====================================================

/**
 * Valida que los factores estén en rango válido
 */
export function validateFactors(factors: Partial<ScoreFactors>): ScoreFactors {
  const clamp = (value: number) => Math.min(100, Math.max(0, value))

  return {
    payment_history: clamp(factors.payment_history || 0),
    credit_utilization: clamp(factors.credit_utilization || 0),
    credit_age: clamp(factors.credit_age || 0),
    credit_mix: clamp(factors.credit_mix || 0),
    hard_inquiries: clamp(factors.hard_inquiries || 0)
  }
}
