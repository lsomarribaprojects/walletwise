/**
 * Simulación Monte Carlo [PREMIUM]
 * Análisis probabilístico avanzado de escenarios financieros
 */

import type {
  MonteCarloParams,
  MonteCarloResult,
  MonteCarloOutcome,
  MonteCarloRecommendation,
  FinancialSnapshot
} from '../types'
import type { Loan } from '@/features/loans/types'

// =====================================================
// SIMULACIÓN PRINCIPAL
// =====================================================

/**
 * Ejecuta simulación Monte Carlo
 * Simula múltiples escenarios con variabilidad para estimar probabilidades
 */
export function runMonteCarloSimulation(
  snapshot: FinancialSnapshot,
  params: MonteCarloParams
): MonteCarloResult {
  const { simulations, timeHorizonMonths } = params

  // Arrays para almacenar resultados de cada simulación
  const monthsToFreedom: number[] = []
  const finalDebts: number[] = []
  const totalInterestPaid: number[] = []
  let failureCount = 0

  // Ejecutar simulaciones
  for (let sim = 0; sim < simulations; sim++) {
    const result = runSingleSimulation(snapshot, params)

    monthsToFreedom.push(result.monthsToFreedom)
    finalDebts.push(result.finalDebt)
    totalInterestPaid.push(result.interestPaid)

    if (result.finalDebt > 0) {
      failureCount++
    }
  }

  // Calcular percentiles
  const percentiles = calculatePercentiles(monthsToFreedom, finalDebts, totalInterestPaid, snapshot.emergencyFund)

  // Calcular probabilidad de éxito
  const debtFreedomProbability = ((simulations - failureCount) / simulations) * 100

  // Análisis de riesgo
  const riskAnalysis = {
    worstCase: percentiles.p90,
    bestCase: percentiles.p10,
    expectedCase: percentiles.p50,
    failureScenarios: failureCount
  }

  // Generar recomendaciones
  const recommendations = generateMonteCarloRecommendations(
    debtFreedomProbability,
    percentiles,
    snapshot
  )

  return {
    debtFreedomProbability: Math.round(debtFreedomProbability * 10) / 10,
    confidenceInterval: {
      low: percentiles.p10.monthsToFreedom,
      median: percentiles.p50.monthsToFreedom,
      high: percentiles.p90.monthsToFreedom
    },
    distribution: {
      monthsToFreedom,
      finalDebt: finalDebts,
      totalInterestPaid
    },
    percentiles,
    riskAnalysis,
    recommendations
  }
}

// =====================================================
// SIMULACIÓN INDIVIDUAL
// =====================================================

interface SimulationResult {
  monthsToFreedom: number
  finalDebt: number
  interestPaid: number
  emergencyFundDepleted: boolean
}

function runSingleSimulation(
  snapshot: FinancialSnapshot,
  params: MonteCarloParams
): SimulationResult {
  // Clonar estado inicial
  let loans = snapshot.loans.map(l => ({ ...l }))
  let emergencyFund = snapshot.emergencyFund
  let totalInterestPaid = 0
  let monthsElapsed = 0
  let income = snapshot.monthlyIncome
  let expenses = snapshot.monthlyExpenses

  // Simular mes a mes
  while (monthsElapsed < params.timeHorizonMonths) {
    monthsElapsed++

    // Variabilidad en ingreso
    const incomeVariation = 1 + (Math.random() - 0.5) * 2 * params.incomeVariability
    const actualIncome = income * incomeVariation

    // Variabilidad en gastos
    const expenseVariation = 1 + (Math.random() - 0.5) * 2 * params.expenseVariability
    const actualExpenses = expenses * expenseVariation

    // Eventos de riesgo: pérdida de empleo
    if (Math.random() < params.jobLossProbability / 12) {
      // Meses sin ingreso completo
      const joblessDuration = Math.ceil(Math.random() * params.jobLossDuration)
      for (let i = 0; i < joblessDuration && monthsElapsed < params.timeHorizonMonths; i++) {
        monthsElapsed++
        // Usar fondo de emergencia
        const monthlyNeed = actualExpenses + loans.reduce((sum, l) => sum + l.payment, 0)
        if (emergencyFund >= monthlyNeed) {
          emergencyFund -= monthlyNeed
        } else {
          // No puede pagar, deuda crece
          loans.forEach(loan => {
            const interest = loan.balance * (loan.rate / 12)
            loan.balance += interest
            totalInterestPaid += interest
          })
        }
      }
      continue
    }

    // Evento: emergencia grande
    if (Math.random() < params.emergencyProbability / 12) {
      const emergencyCost = params.emergencyAmount * (0.5 + Math.random())
      if (emergencyFund >= emergencyCost) {
        emergencyFund -= emergencyCost
      } else {
        // Afecta capacidad de pago
        emergencyFund = 0
      }
    }

    // Calcular disponible para deuda
    const debtPayments = loans.reduce((sum, l) => sum + l.payment, 0)
    const cashFlow = actualIncome - actualExpenses

    if (cashFlow >= debtPayments) {
      // Puede pagar normalmente
      loans.forEach(loan => {
        if (loan.balance > 0) {
          const interest = loan.balance * (loan.rate / 12)
          const principal = Math.min(loan.payment - interest, loan.balance)
          loan.balance = Math.max(0, loan.balance - principal)
          totalInterestPaid += interest
        }
      })

      // Extra al fondo de emergencia
      const surplus = cashFlow - debtPayments
      emergencyFund += surplus * 0.5  // 50% a emergencias
    } else {
      // Déficit: usar fondo de emergencia
      const deficit = debtPayments - cashFlow
      if (emergencyFund >= deficit) {
        emergencyFund -= deficit
        // Pagar deudas normalmente
        loans.forEach(loan => {
          if (loan.balance > 0) {
            const interest = loan.balance * (loan.rate / 12)
            const principal = Math.min(loan.payment - interest, loan.balance)
            loan.balance = Math.max(0, loan.balance - principal)
            totalInterestPaid += interest
          }
        })
      } else {
        // No puede pagar completo: solo intereses crecen
        emergencyFund = 0
        loans.forEach(loan => {
          if (loan.balance > 0) {
            const interest = loan.balance * (loan.rate / 12)
            loan.balance += interest * 0.5  // Capitalización parcial
            totalInterestPaid += interest
          }
        })
      }
    }

    // Verificar si ya está libre de deuda
    const totalDebt = loans.reduce((sum, l) => sum + l.balance, 0)
    if (totalDebt < 1) {
      return {
        monthsToFreedom: monthsElapsed,
        finalDebt: 0,
        interestPaid: totalInterestPaid,
        emergencyFundDepleted: emergencyFund < snapshot.monthlyExpenses
      }
    }
  }

  // No logró pagar en el horizonte de tiempo
  const finalDebt = loans.reduce((sum, l) => sum + l.balance, 0)
  return {
    monthsToFreedom: params.timeHorizonMonths,
    finalDebt,
    interestPaid: totalInterestPaid,
    emergencyFundDepleted: emergencyFund < snapshot.monthlyExpenses
  }
}

// =====================================================
// CÁLCULO DE PERCENTILES
// =====================================================

function calculatePercentiles(
  monthsToFreedom: number[],
  finalDebts: number[],
  interestPaid: number[],
  emergencyFund: number
): MonteCarloResult['percentiles'] {
  const sorted = {
    months: [...monthsToFreedom].sort((a, b) => a - b),
    debt: [...finalDebts].sort((a, b) => a - b),
    interest: [...interestPaid].sort((a, b) => a - b)
  }

  const getPercentile = (arr: number[], p: number) => {
    const idx = Math.floor(arr.length * p)
    return arr[idx] || arr[arr.length - 1]
  }

  const createOutcome = (p: number): MonteCarloOutcome => ({
    monthsToFreedom: getPercentile(sorted.months, p),
    finalDebt: getPercentile(sorted.debt, p),
    totalInterestPaid: getPercentile(sorted.interest, p),
    emergencyFundStatus: emergencyFund > 5000 ? 'strong' :
                          emergencyFund > 2000 ? 'adequate' :
                          emergencyFund > 500 ? 'low' : 'depleted'
  })

  return {
    p10: createOutcome(0.10),
    p25: createOutcome(0.25),
    p50: createOutcome(0.50),
    p75: createOutcome(0.75),
    p90: createOutcome(0.90)
  }
}

// =====================================================
// RECOMENDACIONES
// =====================================================

function generateMonteCarloRecommendations(
  successProbability: number,
  percentiles: MonteCarloResult['percentiles'],
  snapshot: FinancialSnapshot
): MonteCarloRecommendation[] {
  const recommendations: MonteCarloRecommendation[] = []

  // Probabilidad de éxito baja
  if (successProbability < 70) {
    recommendations.push({
      priority: 'high',
      action: 'Aumenta tu presupuesto mensual para deuda',
      impact: 'Incrementar $100-200/mes puede subir tu probabilidad de éxito significativamente',
      confidenceBoost: 15
    })
  }

  // Fondo de emergencia bajo
  if (snapshot.emergencyFund < snapshot.monthlyExpenses * 3) {
    recommendations.push({
      priority: 'high',
      action: 'Fortalece tu fondo de emergencia',
      impact: 'Un fondo de 3-6 meses reduce el riesgo de retroceso por imprevistos',
      confidenceBoost: 10
    })
  }

  // Variabilidad alta en resultados
  const spread = percentiles.p90.monthsToFreedom - percentiles.p10.monthsToFreedom
  if (spread > 24) {
    recommendations.push({
      priority: 'medium',
      action: 'Busca estabilizar tus ingresos',
      impact: 'Ingresos más estables reducen la incertidumbre en tu plan',
      confidenceBoost: 8
    })
  }

  // Deudas de alta tasa
  const highRateLoans = snapshot.loans.filter(l => l.rate > 0.15)
  if (highRateLoans.length > 0) {
    recommendations.push({
      priority: 'high',
      action: `Prioriza pagar ${highRateLoans[0].name}`,
      impact: 'Las deudas de alta tasa aumentan significativamente el riesgo',
      confidenceBoost: 12
    })
  }

  // Probabilidad muy alta - ya está bien
  if (successProbability > 90) {
    recommendations.push({
      priority: 'low',
      action: 'Considera acelerar pagos o empezar a invertir',
      impact: 'Tu plan es sólido. Puedes optimizar más o diversificar',
      confidenceBoost: 3
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// =====================================================
// PARÁMETROS POR DEFECTO
// =====================================================

export function getDefaultMonteCarloParams(): MonteCarloParams {
  return {
    simulations: 1000,
    timeHorizonMonths: 120,  // 10 años
    incomeVariability: 0.05,  // 5%
    expenseVariability: 0.10, // 10%
    investmentReturn: 0.07,   // 7% anual
    investmentVolatility: 0.15,
    jobLossProbability: 0.05, // 5% anual
    jobLossDuration: 3,       // 3 meses promedio
    emergencyProbability: 0.10, // 10% anual
    emergencyAmount: 2000
  }
}

/**
 * Ajusta parámetros basado en el perfil de riesgo del usuario
 */
export function adjustParamsForRiskProfile(
  baseParams: MonteCarloParams,
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
): MonteCarloParams {
  const multipliers = {
    conservative: {
      incomeVariability: 1.5,
      expenseVariability: 1.5,
      jobLossProbability: 1.3,
      emergencyProbability: 1.3
    },
    moderate: {
      incomeVariability: 1.0,
      expenseVariability: 1.0,
      jobLossProbability: 1.0,
      emergencyProbability: 1.0
    },
    aggressive: {
      incomeVariability: 0.7,
      expenseVariability: 0.7,
      jobLossProbability: 0.7,
      emergencyProbability: 0.7
    }
  }

  const m = multipliers[riskProfile]

  return {
    ...baseParams,
    incomeVariability: baseParams.incomeVariability * m.incomeVariability,
    expenseVariability: baseParams.expenseVariability * m.expenseVariability,
    jobLossProbability: baseParams.jobLossProbability * m.jobLossProbability,
    emergencyProbability: baseParams.emergencyProbability * m.emergencyProbability
  }
}
