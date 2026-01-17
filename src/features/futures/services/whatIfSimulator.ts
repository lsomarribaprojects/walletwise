/**
 * Simulador What-If
 * Permite al usuario simular escenarios financieros
 */

import type {
  WhatIfScenario,
  WhatIfParameters,
  WhatIfResult,
  MonthlyDebtSnapshot
} from '../types'
import type { Loan, DebtPayoffStrategy } from '@/features/loans/types'
import { generateDebtPayoffPlan } from '@/features/loans/services/debtCalculator'

// =====================================================
// SIMULADOR PRINCIPAL
// =====================================================

/**
 * Simula un escenario What-If y compara con baseline
 */
export function simulateScenario(
  loans: Loan[],
  currentBudget: number,
  scenario: WhatIfScenario,
  strategy: DebtPayoffStrategy = 'avalanche'
): WhatIfResult {
  // Baseline (situación actual)
  const baseline = generateDebtPayoffPlan(loans, currentBudget, strategy)

  // Aplicar escenario
  const { modifiedLoans, newBudget } = applyScenario(loans, currentBudget, scenario)

  // Nuevo plan
  const newPlan = generateDebtPayoffPlan(modifiedLoans, newBudget, strategy)

  // Generar proyección mensual
  const monthlyProjection: MonthlyDebtSnapshot[] = newPlan.monthlyBreakdown.map(month => ({
    month: month.month,
    date: month.date,
    totalDebt: month.totalDebt,
    monthlyPayment: month.totalPayment,
    principalPaid: month.payments.reduce((sum, p) => sum + p.principal, 0),
    interestPaid: month.payments.reduce((sum, p) => sum + p.interest, 0),
    loansRemaining: month.payments.filter(p => p.balance > 0).length,
    paidOffThisMonth: month.payments.filter(p => p.isPaidOff).map(p => p.loanId)
  }))

  // Calcular ahorros
  const monthsSaved = baseline.monthsToDebtFree - newPlan.monthsToDebtFree
  const interestSaved = baseline.totalInterestPaid - newPlan.totalInterestPaid
  const totalSaved = baseline.totalPaid - newPlan.totalPaid

  // Calcular fecha de payoff
  const newPayoffDate = new Date()
  newPayoffDate.setMonth(newPayoffDate.getMonth() + newPlan.monthsToDebtFree)

  // Generar recomendación
  const { recommendation, impactScore } = generateRecommendation(
    scenario,
    monthsSaved,
    interestSaved
  )

  return {
    originalMonthsToFreedom: baseline.monthsToDebtFree,
    newMonthsToFreedom: newPlan.monthsToDebtFree,
    monthsSaved,
    originalInterest: baseline.totalInterestPaid,
    newInterest: newPlan.totalInterestPaid,
    interestSaved,
    originalTotalPaid: baseline.totalPaid,
    newTotalPaid: newPlan.totalPaid,
    totalSaved,
    newPayoffDate,
    monthlyProjection,
    recommendation,
    impactScore
  }
}

/**
 * Aplica un escenario a los préstamos
 */
function applyScenario(
  loans: Loan[],
  currentBudget: number,
  scenario: WhatIfScenario
): { modifiedLoans: Loan[]; newBudget: number } {
  const { type, parameters } = scenario
  let modifiedLoans = [...loans]
  let newBudget = currentBudget

  switch (type) {
    case 'extra_payment':
      newBudget = currentBudget + (parameters.extraMonthlyPayment || 0)
      break

    case 'interest_rate_change':
      if (parameters.newInterestRate !== undefined) {
        modifiedLoans = loans.map(loan => ({
          ...loan,
          interest_rate: parameters.newInterestRate!
        }))
      }
      break

    case 'refinance':
      if (parameters.newInterestRate !== undefined) {
        // Reducir tasa pero agregar fees al balance
        const fees = parameters.refinanceFees || 0
        modifiedLoans = loans.map(loan => ({
          ...loan,
          interest_rate: parameters.newInterestRate!,
          current_balance: loan.current_balance + (fees / loans.length)
        }))
      }
      break

    case 'lump_sum_payment':
      if (parameters.lumpSumAmount && parameters.lumpSumTargetLoanId) {
        modifiedLoans = loans.map(loan => {
          if (loan.id === parameters.lumpSumTargetLoanId) {
            return {
              ...loan,
              current_balance: Math.max(0, loan.current_balance - parameters.lumpSumAmount!)
            }
          }
          return loan
        })
      } else if (parameters.lumpSumAmount) {
        // Aplicar a todas las deudas proporcionalmente
        const totalDebt = loans.reduce((sum, l) => sum + l.current_balance, 0)
        modifiedLoans = loans.map(loan => ({
          ...loan,
          current_balance: Math.max(
            0,
            loan.current_balance - (parameters.lumpSumAmount! * (loan.current_balance / totalDebt))
          )
        }))
      }
      break

    case 'new_loan':
      if (parameters.newLoanAmount && parameters.newLoanRate && parameters.newLoanTerm) {
        const newLoan: Loan = {
          id: `new_${Date.now()}`,
          user_id: loans[0]?.user_id || '',
          name: 'Nuevo préstamo (simulado)',
          lender: 'Simulación',
          loan_type: 'personal',
          status: 'active',
          original_amount: parameters.newLoanAmount,
          current_balance: parameters.newLoanAmount,
          interest_rate: parameters.newLoanRate,
          currency: 'USD',
          minimum_payment: calculateMonthlyPayment(
            parameters.newLoanAmount,
            parameters.newLoanRate,
            parameters.newLoanTerm
          ),
          payment_frequency: 'monthly',
          payment_day: null,
          start_date: new Date().toISOString(),
          end_date: null,
          next_payment_date: new Date().toISOString(),
          collateral: null,
          collateral_value: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        modifiedLoans = [...loans, newLoan]
        newBudget = currentBudget + newLoan.minimum_payment
      }
      break

    case 'income_change':
      // El usuario tendría más/menos para pagar
      newBudget = currentBudget + (parameters.incomeChange || 0)
      break

    case 'expense_change':
      // Menos gastos = más para deuda
      newBudget = currentBudget - (parameters.expenseChange || 0)
      break
  }

  return { modifiedLoans, newBudget }
}

// =====================================================
// ESCENARIOS PREDEFINIDOS
// =====================================================

/**
 * Crea escenarios rápidos comunes
 */
export function createQuickScenario(
  type: 'aggressive' | 'extra_100' | 'extra_500' | 'bonus' | 'refinance_5'
): WhatIfScenario {
  const scenarios: Record<string, WhatIfScenario> = {
    aggressive: {
      id: 'aggressive',
      name: 'Pago agresivo (+$300/mes)',
      type: 'extra_payment',
      parameters: { extraMonthlyPayment: 300 },
      result: null,
      createdAt: new Date()
    },
    extra_100: {
      id: 'extra_100',
      name: 'Extra $100/mes',
      type: 'extra_payment',
      parameters: { extraMonthlyPayment: 100 },
      result: null,
      createdAt: new Date()
    },
    extra_500: {
      id: 'extra_500',
      name: 'Extra $500/mes',
      type: 'extra_payment',
      parameters: { extraMonthlyPayment: 500 },
      result: null,
      createdAt: new Date()
    },
    bonus: {
      id: 'bonus',
      name: 'Bono $5,000 aplicado a deuda',
      type: 'lump_sum_payment',
      parameters: { lumpSumAmount: 5000 },
      result: null,
      createdAt: new Date()
    },
    refinance_5: {
      id: 'refinance_5',
      name: 'Refinanciar a 5%',
      type: 'refinance',
      parameters: { newInterestRate: 0.05, refinanceFees: 500 },
      result: null,
      createdAt: new Date()
    }
  }

  return scenarios[type] || scenarios.extra_100
}

/**
 * Genera múltiples escenarios para comparar
 */
export function generateComparisonScenarios(
  loans: Loan[],
  currentBudget: number
): WhatIfScenario[] {
  const avgRate = loans.reduce((sum, l) => sum + l.interest_rate, 0) / loans.length

  return [
    createQuickScenario('extra_100'),
    createQuickScenario('extra_500'),
    createQuickScenario('bonus'),
    // Refinanciar si la tasa promedio es alta
    ...(avgRate > 0.08
      ? [{
          id: 'refinance_lower',
          name: `Refinanciar a ${((avgRate - 0.02) * 100).toFixed(1)}%`,
          type: 'refinance' as const,
          parameters: { newInterestRate: avgRate - 0.02, refinanceFees: 500 },
          result: null,
          createdAt: new Date()
        }]
      : []
    )
  ]
}

// =====================================================
// HELPERS
// =====================================================

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12

  if (monthlyRate === 0) {
    return principal / months
  }

  const payment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)

  return Math.round(payment * 100) / 100
}

function generateRecommendation(
  scenario: WhatIfScenario,
  monthsSaved: number,
  interestSaved: number
): { recommendation: string; impactScore: number } {
  let recommendation = ''
  let impactScore = 5

  if (monthsSaved > 12 && interestSaved > 1000) {
    recommendation = '🌟 ¡Excelente escenario! El impacto es muy significativo.'
    impactScore = 9
  } else if (monthsSaved > 6 || interestSaved > 500) {
    recommendation = '✅ Buen escenario. Vale la pena considerarlo.'
    impactScore = 7
  } else if (monthsSaved > 0 || interestSaved > 0) {
    recommendation = '👍 Escenario positivo, aunque el impacto es moderado.'
    impactScore = 5
  } else if (monthsSaved < 0) {
    recommendation = '⚠️ Este escenario alargaría tu tiempo de pago.'
    impactScore = 3
  } else {
    recommendation = '➖ Este escenario no tiene impacto significativo.'
    impactScore = 4
  }

  // Ajustar por tipo de escenario
  if (scenario.type === 'refinance' && interestSaved > 0) {
    recommendation += ' Considera los costos de refinanciamiento.'
  }

  if (scenario.type === 'lump_sum_payment' && monthsSaved > 3) {
    recommendation += ' Los pagos grandes tienen gran impacto.'
  }

  return { recommendation, impactScore }
}

// =====================================================
// EXPORTS
// =====================================================

export type { WhatIfScenario, WhatIfResult, WhatIfParameters }
