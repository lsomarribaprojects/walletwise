/**
 * Feature: Futures Module
 * Proyecciones financieras y simulaciones
 *
 * @module features/futures
 */

// Tipos
export * from './types'

// Servicios
export {
  projectDebtFreedom,
  calculateExtraPaymentImpact,
  calculateBudgetForGoal,
  createFinancialSnapshot,
  generateFinancialRecommendations
} from './services/debtProjector'

export {
  simulateScenario,
  createQuickScenario,
  generateComparisonScenarios
} from './services/whatIfSimulator'

export {
  calculateEmergencyFund,
  calculateRequiredMonthlySavings,
  getRiskLevelInfo,
  simulateEmergency,
  suggestTargetMonths
} from './services/emergencyFund'

export {
  runMonteCarloSimulation,
  getDefaultMonteCarloParams,
  adjustParamsForRiskProfile
} from './services/monteCarlo'

// Componentes
export {
  DebtFreedomProjector,
  EmergencyFundCalculator,
  EmergencyFundWidget
} from './components'
