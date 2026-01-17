/**
 * Hooks para Credit Scores
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllScores,
  getLatestScore,
  getScoreHistory,
  createScore,
  updateScore,
  deleteScore,
  calculateEstimatedScore,
  getScoreFactors,
  getScoreTrend,
  getScoreStatistics,
  getFullScoreHistory
} from '../services/creditScoreService'
import { calculateFullScore } from '../services/scoreCalculator'
import type {
  CreditScore,
  CreateScoreInput,
  UpdateScoreInput,
  ScoreTrend,
  ScoreStatistics,
  CalculatedScoreResponse
} from '../types'

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useCreditScore() {
  const [scores, setScores] = useState<CreditScore[]>([])
  const [latestScore, setLatestScore] = useState<CreditScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchScores = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [allScores, latest] = await Promise.all([getAllScores(), getLatestScore()])
      setScores(allScores)
      setLatestScore(latest)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar scores'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  const addScore = useCallback(
    async (input: CreateScoreInput) => {
      try {
        setError(null)
        const newScore = await createScore(input)
        setScores((prev) => [newScore, ...prev])
        setLatestScore(newScore)
        return newScore
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al crear score')
        setError(error)
        throw error
      }
    },
    []
  )

  const editScore = useCallback(
    async (id: string, input: UpdateScoreInput) => {
      try {
        setError(null)
        const updated = await updateScore(id, input)
        setScores((prev) => prev.map((s) => (s.id === id ? updated : s)))
        if (latestScore?.id === id) {
          setLatestScore(updated)
        }
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al actualizar score')
        setError(error)
        throw error
      }
    },
    [latestScore]
  )

  const removeScore = useCallback(
    async (id: string) => {
      try {
        setError(null)
        await deleteScore(id)
        setScores((prev) => prev.filter((s) => s.id !== id))
        if (latestScore?.id === id) {
          const newLatest = scores.find((s) => s.id !== id) || null
          setLatestScore(newLatest)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al eliminar score')
        setError(error)
        throw error
      }
    },
    [latestScore, scores]
  )

  const refresh = useCallback(() => {
    return fetchScores()
  }, [fetchScores])

  return {
    scores,
    latestScore,
    isLoading,
    error,
    addScore,
    editScore,
    removeScore,
    refresh
  }
}

// =====================================================
// HOOK PARA HISTORIAL
// =====================================================

export function useScoreHistory(months: number = 12) {
  const [scores, setScores] = useState<CreditScore[]>([])
  const [statistics, setStatistics] = useState<ScoreStatistics | null>(null)
  const [trend, setTrend] = useState<ScoreTrend | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getFullScoreHistory(months)
      setScores(data.scores)
      setStatistics(data.statistics)
      setTrend(data.trend)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar historial'))
    } finally {
      setIsLoading(false)
    }
  }, [months])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    scores,
    statistics,
    trend,
    isLoading,
    error,
    refresh: fetchHistory
  }
}

// =====================================================
// HOOK PARA TENDENCIA
// =====================================================

export function useScoreTrend() {
  const [trend, setTrend] = useState<ScoreTrend | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchTrend = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getScoreTrend()
      setTrend(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al calcular tendencia'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrend()
  }, [fetchTrend])

  return {
    trend,
    isLoading,
    error,
    refresh: fetchTrend
  }
}

// =====================================================
// HOOK PARA SCORE CALCULADO
// =====================================================

export function useCalculatedScore() {
  const [scoreData, setScoreData] = useState<CalculatedScoreResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const calculate = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener score y factores de la base de datos
      const [score, factors] = await Promise.all([
        calculateEstimatedScore(),
        getScoreFactors()
      ])

      // Calcular tips
      const fullScore = calculateFullScore(factors)

      setScoreData(fullScore)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al calcular score'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    calculate()
  }, [calculate])

  return {
    scoreData,
    isLoading,
    error,
    recalculate: calculate
  }
}

// =====================================================
// HOOK PARA ESTADÍSTICAS
// =====================================================

export function useScoreStatistics() {
  const [statistics, setStatistics] = useState<ScoreStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getScoreStatistics()
      setStatistics(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar estadísticas'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  return {
    statistics,
    isLoading,
    error,
    refresh: fetchStatistics
  }
}
