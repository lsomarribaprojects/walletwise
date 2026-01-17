/**
 * Tipos para Credit Scores (Feature Premium)
 */

// =====================================================
// ENUMS Y CONSTANTES
// =====================================================

export type CreditScoreRange = 'exceptional' | 'very_good' | 'good' | 'fair' | 'poor'
export type ScoreSource = 'calculated' | 'manual' | 'imported'

// Rangos de credit score (FICO)
export const SCORE_RANGES = {
  exceptional: { min: 800, max: 850, label: 'Exceptional', color: '#10B981' },  // Emerald
  very_good: { min: 740, max: 799, label: 'Very Good', color: '#84CC16' },      // Lime
  good: { min: 670, max: 739, label: 'Good', color: '#FBBF24' },               // Yellow
  fair: { min: 580, max: 669, label: 'Fair', color: '#FB923C' },               // Orange
  poor: { min: 300, max: 579, label: 'Poor', color: '#EF4444' }                // Red
} as const

// =====================================================
// INTERFACES
// =====================================================

export interface ScoreFactors {
  payment_history: number      // 0-100
  credit_utilization: number   // 0-100
  credit_age: number          // 0-100
  credit_mix: number          // 0-100
  hard_inquiries: number      // 0-100
}

export interface CreditScore {
  id: string
  user_id: string
  score: number               // 300-850
  score_date: string          // ISO date
  factors: ScoreFactors
  source: ScoreSource
  notes?: string
  created_at: string
}

export interface CreateScoreInput {
  score: number
  score_date?: string
  factors?: Partial<ScoreFactors>
  source?: ScoreSource
  notes?: string
}

export interface UpdateScoreInput {
  score?: number
  score_date?: string
  factors?: Partial<ScoreFactors>
  notes?: string
}

// =====================================================
// TIPOS CALCULADOS
// =====================================================

export interface ScoreTrend {
  current: number
  previous: number | null
  change: number
  direction: 'up' | 'down' | 'stable'
  percentage: number
}

export interface ScoreStatistics {
  current: number
  highest: number
  lowest: number
  average: number
  range: CreditScoreRange
  monthsTracked: number
}

export interface ScoreFactor {
  name: keyof ScoreFactors
  label: string
  value: number
  weight: number          // Porcentaje del score total
  impact: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor'
  description: string
}

export interface ScoreTip {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: keyof ScoreFactors
  actionable: boolean
}

// =====================================================
// TIPOS DE RESPUESTA
// =====================================================

export interface ScoreHistoryResponse {
  scores: CreditScore[]
  statistics: ScoreStatistics
  trend: ScoreTrend
}

export interface CalculatedScoreResponse {
  score: number
  factors: ScoreFactors
  range: CreditScoreRange
  tips: ScoreTip[]
}

// =====================================================
// FUNCIONES HELPER
// =====================================================

/**
 * Determina el rango de un score
 */
export function getScoreRange(score: number): CreditScoreRange {
  if (score >= 800) return 'exceptional'
  if (score >= 740) return 'very_good'
  if (score >= 670) return 'good'
  if (score >= 580) return 'fair'
  return 'poor'
}

/**
 * Obtiene el color de un rango
 */
export function getRangeColor(range: CreditScoreRange): string {
  return SCORE_RANGES[range].color
}

/**
 * Obtiene el color de un score
 */
export function getScoreColor(score: number): string {
  const range = getScoreRange(score)
  return getRangeColor(range)
}

/**
 * Obtiene el label de un rango
 */
export function getRangeLabel(range: CreditScoreRange): string {
  return SCORE_RANGES[range].label
}

/**
 * Determina el impacto de un factor
 */
export function getFactorImpact(value: number): ScoreFactor['impact'] {
  if (value >= 90) return 'excellent'
  if (value >= 75) return 'good'
  if (value >= 60) return 'fair'
  if (value >= 40) return 'poor'
  return 'very_poor'
}

/**
 * Obtiene el color del impacto
 */
export function getImpactColor(impact: ScoreFactor['impact']): string {
  const colors = {
    excellent: '#10B981',
    good: '#84CC16',
    fair: '#FBBF24',
    poor: '#FB923C',
    very_poor: '#EF4444'
  }
  return colors[impact]
}

/**
 * Formatea un score con símbolo
 */
export function formatScore(score: number): string {
  return score.toString()
}

/**
 * Valida que un score esté en rango válido
 */
export function isValidScore(score: number): boolean {
  return score >= 300 && score <= 850
}

// =====================================================
// CONSTANTES DE FACTORES
// =====================================================

export const FACTOR_LABELS: Record<keyof ScoreFactors, string> = {
  payment_history: 'Payment History',
  credit_utilization: 'Credit Utilization',
  credit_age: 'Credit Age',
  credit_mix: 'Credit Mix',
  hard_inquiries: 'Hard Inquiries'
}

export const FACTOR_WEIGHTS: Record<keyof ScoreFactors, number> = {
  payment_history: 35,
  credit_utilization: 30,
  credit_age: 15,
  credit_mix: 10,
  hard_inquiries: 10
}

export const FACTOR_DESCRIPTIONS: Record<keyof ScoreFactors, string> = {
  payment_history: 'Track record of on-time payments on loans and credit cards',
  credit_utilization: 'Percentage of available credit being used',
  credit_age: 'Average age of all credit accounts',
  credit_mix: 'Variety of credit types (cards, loans, etc.)',
  hard_inquiries: 'Recent credit applications and inquiries'
}
