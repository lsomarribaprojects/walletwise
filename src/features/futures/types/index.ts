/**
 * Tipos para el Módulo Futuros
 * Proyecciones financieras y simulaciones
 */

// =====================================================
// PROYECTOR DE LIBERTAD FINANCIERA
// =====================================================

export interface DebtFreedomProjection {
  // Fecha objetivo
  targetDate: Date
  monthsToFreedom: number

  // Totales
  totalDebt: number
  totalInterestPaid: number
  totalPaid: number

  // Ahorros posibles
  potentialSavings: {
    withExtraPayment: number
    interestSaved: number
    monthsSaved: number
  }

  // Milestones
  milestones: DebtMilestone[]

  // Proyección mensual
  monthlyProjection: MonthlyDebtSnapshot[]
}

export interface DebtMilestone {
  id: string
  name: string
  type: 'debt_paid' | 'percentage' | 'custom'
  targetAmount?: number
  targetPercentage?: number
  loanId?: string
  projectedDate: Date
  monthsFromNow: number
  isAchieved: boolean
}

export interface MonthlyDebtSnapshot {
  month: number
  date: Date
  totalDebt: number
  monthlyPayment: number
  principalPaid: number
  interestPaid: number
  loansRemaining: number
  paidOffThisMonth: string[]  // IDs de préstamos pagados
}

// =====================================================
// SIMULADOR WHAT-IF
// =====================================================

export type WhatIfScenarioType =
  | 'extra_payment'
  | 'interest_rate_change'
  | 'refinance'
  | 'new_loan'
  | 'income_change'
  | 'expense_change'
  | 'lump_sum_payment'

export interface WhatIfScenario {
  id: string
  name: string
  type: WhatIfScenarioType
  parameters: WhatIfParameters
  result: WhatIfResult | null
  createdAt: Date
}

export interface WhatIfParameters {
  // Extra payment
  extraMonthlyPayment?: number

  // Refinance / Rate change
  newInterestRate?: number
  refinanceFees?: number

  // New loan
  newLoanAmount?: number
  newLoanRate?: number
  newLoanTerm?: number

  // Income/Expense change
  incomeChange?: number
  expenseChange?: number

  // Lump sum
  lumpSumAmount?: number
  lumpSumTargetLoanId?: string
  lumpSumMonth?: number
}

export interface WhatIfResult {
  // Comparación con baseline
  originalMonthsToFreedom: number
  newMonthsToFreedom: number
  monthsSaved: number

  originalInterest: number
  newInterest: number
  interestSaved: number

  originalTotalPaid: number
  newTotalPaid: number
  totalSaved: number

  // Nuevo plan
  newPayoffDate: Date
  monthlyProjection: MonthlyDebtSnapshot[]

  // Recomendación
  recommendation: string
  impactScore: number  // 1-10, qué tan beneficioso es
}

// =====================================================
// FONDO DE EMERGENCIA
// =====================================================

export interface EmergencyFundCalculation {
  // Inputs
  monthlyExpenses: number
  targetMonths: number  // 3-6 típicamente
  currentSavings: number

  // Results
  targetAmount: number
  amountNeeded: number
  percentageComplete: number

  // Plan de ahorro
  savingsPlan: {
    monthlyContribution: number
    monthsToGoal: number
    milestones: EmergencyFundMilestone[]
  }

  // Recomendaciones
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface EmergencyFundMilestone {
  months: number
  amount: number
  date: Date
  label: string  // "1 mes de gastos", "3 meses", etc.
  isAchieved: boolean
}

// =====================================================
// MONTE CARLO [PREMIUM]
// =====================================================

export interface MonteCarloParams {
  // Configuración de simulación
  simulations: number  // 1000-10000
  timeHorizonMonths: number

  // Variables con incertidumbre
  incomeVariability: number      // % de variación
  expenseVariability: number
  investmentReturn: number       // Retorno esperado
  investmentVolatility: number   // Desviación estándar

  // Eventos de riesgo
  jobLossProbability: number     // % anual
  jobLossDuration: number        // meses promedio
  emergencyProbability: number   // % anual de emergencia grande
  emergencyAmount: number        // Costo promedio de emergencia
}

export interface MonteCarloResult {
  // Probabilidades de éxito
  debtFreedomProbability: number  // % de simulaciones donde se logra
  confidenceInterval: {
    low: number   // percentil 10
    median: number
    high: number  // percentil 90
  }

  // Distribución de resultados
  distribution: {
    monthsToFreedom: number[]  // Array de resultados de cada simulación
    finalDebt: number[]
    totalInterestPaid: number[]
  }

  // Percentiles
  percentiles: {
    p10: MonteCarloOutcome
    p25: MonteCarloOutcome
    p50: MonteCarloOutcome
    p75: MonteCarloOutcome
    p90: MonteCarloOutcome
  }

  // Análisis de riesgo
  riskAnalysis: {
    worstCase: MonteCarloOutcome
    bestCase: MonteCarloOutcome
    expectedCase: MonteCarloOutcome
    failureScenarios: number  // Simulaciones donde no se logra
  }

  // Recomendaciones basadas en simulación
  recommendations: MonteCarloRecommendation[]
}

export interface MonteCarloOutcome {
  monthsToFreedom: number
  finalDebt: number
  totalInterestPaid: number
  emergencyFundStatus: 'depleted' | 'low' | 'adequate' | 'strong'
}

export interface MonteCarloRecommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
  impact: string
  confidenceBoost: number  // % de mejora en probabilidad de éxito
}

// =====================================================
// INPUTS COMUNES
// =====================================================

export interface FinancialSnapshot {
  // Ingresos
  monthlyIncome: number
  additionalIncome: number

  // Gastos
  monthlyExpenses: number
  debtPayments: number

  // Activos
  emergencyFund: number
  investments: number
  otherAssets: number

  // Deudas
  totalDebt: number
  loans: Array<{
    id: string
    name: string
    balance: number
    rate: number
    payment: number
  }>

  // Calculados
  netCashFlow: number
  debtToIncomeRatio: number
  savingsRate: number
}
