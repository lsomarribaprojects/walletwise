/**
 * Feature: Credit Scores (Premium)
 * Tracking y análisis de credit scores
 *
 * @module features/credit-scores
 */

// Tipos
export * from './types'

// Hooks
export {
  useCreditScore,
  useScoreHistory,
  useScoreTrend,
  useCalculatedScore,
  useScoreStatistics
} from './hooks/useCreditScore'

// Servicios
export {
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
  getFullScoreHistory,
  hasScores,
  getScoreByDate
} from './services/creditScoreService'

export {
  factorsToScore,
  buildScoreFactors,
  generateScoreTips,
  calculateFullScore,
  simulateFactorImprovement,
  findHighestImpactFactor,
  validateFactors
} from './services/scoreCalculator'

// Componentes
export {
  CreditScoreGauge,
  MiniCreditScoreGauge,
  ScoreFactorsCard,
  CompactScoreFactors,
  ScoreHistoryChart,
  MiniScoreChart,
  ScoreTipsCard,
  CompactScoreTips,
  ScoreRangeIndicator,
  CompactRangeIndicator
} from './components'
