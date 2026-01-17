/**
 * Servicio para gestión de Credit Scores
 */

import { createClient } from '@/lib/supabase/client'
import type {
  CreditScore,
  CreateScoreInput,
  UpdateScoreInput,
  ScoreHistoryResponse,
  ScoreTrend,
  ScoreStatistics
} from '../types'
import { getScoreRange } from '../types'

// =====================================================
// CRUD BÁSICO
// =====================================================

/**
 * Obtener todos los scores del usuario
 */
export async function getAllScores(): Promise<CreditScore[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('credit_score_history')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener score más reciente
 */
export async function getLatestScore(): Promise<CreditScore | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('credit_score_history')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

/**
 * Obtener historial de scores (últimos N meses)
 */
export async function getScoreHistory(months: number = 12): Promise<CreditScore[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const fromDate = new Date()
  fromDate.setMonth(fromDate.getMonth() - months)

  const { data, error } = await supabase
    .from('credit_score_history')
    .select('*')
    .eq('user_id', user.id)
    .gte('score_date', fromDate.toISOString().split('T')[0])
    .order('score_date', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Crear nuevo score
 */
export async function createScore(input: CreateScoreInput): Promise<CreditScore> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('credit_score_history')
    .insert({
      user_id: user.id,
      score: input.score,
      score_date: input.score_date || new Date().toISOString().split('T')[0],
      factors: input.factors || {},
      source: input.source || 'manual',
      notes: input.notes
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar score
 */
export async function updateScore(id: string, input: UpdateScoreInput): Promise<CreditScore> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_score_history')
    .update({
      score: input.score,
      score_date: input.score_date,
      factors: input.factors,
      notes: input.notes
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar score
 */
export async function deleteScore(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('credit_score_history')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =====================================================
// CÁLCULOS Y ANÁLISIS
// =====================================================

/**
 * Calcular score estimado basado en datos de la app
 */
export async function calculateEstimatedScore(): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .rpc('calculate_estimated_credit_score', { p_user_id: user.id })

  if (error) throw error
  return data || 0
}

/**
 * Obtener factores del score
 */
export async function getScoreFactors() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .rpc('get_credit_score_factors', { p_user_id: user.id })

  if (error) throw error
  return data || {
    payment_history: 0,
    credit_utilization: 0,
    credit_age: 0,
    credit_mix: 0,
    hard_inquiries: 0
  }
}

/**
 * Obtener tendencia del score
 */
export async function getScoreTrend(): Promise<ScoreTrend> {
  const scores = await getAllScores()

  if (scores.length === 0) {
    return {
      current: 0,
      previous: null,
      change: 0,
      direction: 'stable',
      percentage: 0
    }
  }

  const current = scores[0].score
  const previous = scores.length > 1 ? scores[1].score : null

  if (!previous) {
    return {
      current,
      previous: null,
      change: 0,
      direction: 'stable',
      percentage: 0
    }
  }

  const change = current - previous
  const percentage = (change / previous) * 100

  return {
    current,
    previous,
    change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    percentage
  }
}

/**
 * Obtener estadísticas de scores
 */
export async function getScoreStatistics(): Promise<ScoreStatistics> {
  const scores = await getAllScores()

  if (scores.length === 0) {
    return {
      current: 0,
      highest: 0,
      lowest: 0,
      average: 0,
      range: 'poor',
      monthsTracked: 0
    }
  }

  const scoreValues = scores.map(s => s.score)
  const current = scoreValues[0]
  const highest = Math.max(...scoreValues)
  const lowest = Math.min(...scoreValues)
  const average = Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)

  // Calcular meses trackeados
  const oldestDate = new Date(scores[scores.length - 1].score_date)
  const newestDate = new Date(scores[0].score_date)
  const monthsTracked = Math.floor(
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  return {
    current,
    highest,
    lowest,
    average,
    range: getScoreRange(current),
    monthsTracked
  }
}

/**
 * Obtener historial completo con estadísticas
 */
export async function getFullScoreHistory(months: number = 12): Promise<ScoreHistoryResponse> {
  const [scores, statistics, trend] = await Promise.all([
    getScoreHistory(months),
    getScoreStatistics(),
    getScoreTrend()
  ])

  return {
    scores,
    statistics,
    trend
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Verificar si el usuario tiene scores registrados
 */
export async function hasScores(): Promise<boolean> {
  const latest = await getLatestScore()
  return latest !== null
}

/**
 * Obtener score para una fecha específica
 */
export async function getScoreByDate(date: string): Promise<CreditScore | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('credit_score_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('score_date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}
