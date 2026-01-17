/**
 * Proyector de Libertad Financiera
 * Calcula cuándo el usuario será libre de deudas
 */

import type {
  DebtFreedomProjection,
  DebtMilestone,
  MonthlyDebtSnapshot,
  FinancialSnapshot
} from '../types'
import type { Loan, DebtPayoffStrategy } from '@/features/loans/types'
import { generateDebtPayoffPlan } from '@/features/loans/services/debtCalculator'

// =====================================================
// PROYECCIÓN DE LIBERTAD FINANCIERA
// =====================================================

/**
 * Genera una proyección completa de cuándo el usuario será libre de deudas
 */
export function projectDebtFreedom(
  loans: Loan[],
  monthlyBudget: number,
  strategy: DebtPayoffStrategy = 'avalanche'
): DebtFreedomProjection {
  const activeLoans = loans.filter(l => l.status === 'active' && l.current_balance > 0)

  if (activeLoans.length === 0) {
    return createEmptyProjection()
  }

  // Generar plan de pago
  const plan = generateDebtPayoffPlan(activeLoans, monthlyBudget, strategy)

  // Calcular proyección con pago extra ($100)
  const extraPaymentPlan = generateDebtPayoffPlan(activeLoans, monthlyBudget + 100, strategy)

  // Generar snapshots mensuales
  const monthlyProjection = plan.monthlyBreakdown.map(month => ({
    month: month.month,
    date: month.date,
    totalDebt: month.totalDebt,
    monthlyPayment: month.totalPayment,
    principalPaid: month.payments.reduce((sum, p) => sum + p.principal, 0),
    interestPaid: month.payments.reduce((sum, p) => sum + p.interest, 0),
    loansRemaining: month.payments.filter(p => p.balance > 0).length,
    paidOffThisMonth: month.payments.filter(p => p.isPaidOff).map(p => p.loanId)
  }))

  // Generar milestones
  const milestones = generateMilestones(activeLoans, monthlyProjection)

  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() + plan.monthsToDebtFree)

  return {
    targetDate,
    monthsToFreedom: plan.monthsToDebtFree,
    totalDebt: activeLoans.reduce((sum, l) => sum + l.current_balance, 0),
    totalInterestPaid: plan.totalInterestPaid,
    totalPaid: plan.totalPaid,
    potentialSavings: {
      withExtraPayment: 100,
      interestSaved: plan.totalInterestPaid - extraPaymentPlan.totalInterestPaid,
      monthsSaved: plan.monthsToDebtFree - extraPaymentPlan.monthsToDebtFree
    },
    milestones,
    monthlyProjection
  }
}

/**
 * Genera milestones importantes en el camino a libertad financiera
 */
function generateMilestones(
  loans: Loan[],
  projection: MonthlyDebtSnapshot[]
): DebtMilestone[] {
  const milestones: DebtMilestone[] = []
  const initialDebt = loans.reduce((sum, l) => sum + l.current_balance, 0)
  const now = new Date()

  // Milestone: Cada préstamo pagado
  const paidOffLoans = new Set<string>()
  projection.forEach((month) => {
    month.paidOffThisMonth.forEach(loanId => {
      if (!paidOffLoans.has(loanId)) {
        paidOffLoans.add(loanId)
        const loan = loans.find(l => l.id === loanId)
        if (loan) {
          milestones.push({
            id: `paid_${loanId}`,
            name: `${loan.name} pagado`,
            type: 'debt_paid',
            loanId,
            projectedDate: month.date,
            monthsFromNow: month.month,
            isAchieved: false
          })
        }
      }
    })
  })

  // Milestone: 25%, 50%, 75% de deuda pagada
  const percentageMilestones = [25, 50, 75, 100]
  percentageMilestones.forEach(percentage => {
    const targetDebt = initialDebt * (1 - percentage / 100)
    const month = projection.find(m => m.totalDebt <= targetDebt)

    if (month) {
      milestones.push({
        id: `percentage_${percentage}`,
        name: `${percentage}% de deuda pagada`,
        type: 'percentage',
        targetPercentage: percentage,
        projectedDate: month.date,
        monthsFromNow: month.month,
        isAchieved: false
      })
    }
  })

  // Ordenar por fecha
  return milestones.sort((a, b) => a.monthsFromNow - b.monthsFromNow)
}

/**
 * Crea una proyección vacía para usuarios sin deudas
 */
function createEmptyProjection(): DebtFreedomProjection {
  return {
    targetDate: new Date(),
    monthsToFreedom: 0,
    totalDebt: 0,
    totalInterestPaid: 0,
    totalPaid: 0,
    potentialSavings: {
      withExtraPayment: 0,
      interestSaved: 0,
      monthsSaved: 0
    },
    milestones: [],
    monthlyProjection: []
  }
}

// =====================================================
// CÁLCULOS DE IMPACTO
// =====================================================

/**
 * Calcula el impacto de pagar X extra cada mes
 */
export function calculateExtraPaymentImpact(
  loans: Loan[],
  currentBudget: number,
  extraAmount: number,
  strategy: DebtPayoffStrategy = 'avalanche'
): {
  monthsSaved: number
  interestSaved: number
  newPayoffDate: Date
  roi: number  // Return on investment del pago extra
} {
  const originalPlan = generateDebtPayoffPlan(loans, currentBudget, strategy)
  const newPlan = generateDebtPayoffPlan(loans, currentBudget + extraAmount, strategy)

  const monthsSaved = originalPlan.monthsToDebtFree - newPlan.monthsToDebtFree
  const interestSaved = originalPlan.totalInterestPaid - newPlan.totalInterestPaid
  const totalExtraPaid = extraAmount * newPlan.monthsToDebtFree

  const newPayoffDate = new Date()
  newPayoffDate.setMonth(newPayoffDate.getMonth() + newPlan.monthsToDebtFree)

  return {
    monthsSaved,
    interestSaved,
    newPayoffDate,
    roi: totalExtraPaid > 0 ? (interestSaved / totalExtraPaid) * 100 : 0
  }
}

/**
 * Calcula cuánto extra necesitas pagar para estar libre de deuda en X meses
 */
export function calculateBudgetForGoal(
  loans: Loan[],
  targetMonths: number,
  strategy: DebtPayoffStrategy = 'avalanche'
): {
  requiredBudget: number
  currentBudget: number
  extraNeeded: number
  isAchievable: boolean
} {
  const activeLoans = loans.filter(l => l.status === 'active')
  const currentBudget = activeLoans.reduce((sum, l) => sum + l.minimum_payment, 0)

  // Binary search para encontrar el presupuesto necesario
  let low = currentBudget
  let high = currentBudget * 10
  let requiredBudget = high

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    const plan = generateDebtPayoffPlan(activeLoans, mid, strategy)

    if (plan.monthsToDebtFree <= targetMonths) {
      requiredBudget = mid
      high = mid
    } else {
      low = mid
    }
  }

  // Verificar si el objetivo es alcanzable
  const minPlan = generateDebtPayoffPlan(activeLoans, high, strategy)
  const isAchievable = minPlan.monthsToDebtFree <= targetMonths

  return {
    requiredBudget: Math.ceil(requiredBudget),
    currentBudget,
    extraNeeded: Math.max(0, Math.ceil(requiredBudget - currentBudget)),
    isAchievable
  }
}

// =====================================================
// ANÁLISIS FINANCIERO
// =====================================================

/**
 * Crea un snapshot financiero del usuario
 */
export function createFinancialSnapshot(
  loans: Loan[],
  monthlyIncome: number,
  monthlyExpenses: number,
  emergencyFund: number = 0,
  investments: number = 0
): FinancialSnapshot {
  const activeLoans = loans.filter(l => l.status === 'active')
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.current_balance, 0)
  const debtPayments = activeLoans.reduce((sum, l) => sum + l.minimum_payment, 0)
  const netCashFlow = monthlyIncome - monthlyExpenses - debtPayments

  return {
    monthlyIncome,
    additionalIncome: 0,
    monthlyExpenses,
    debtPayments,
    emergencyFund,
    investments,
    otherAssets: 0,
    totalDebt,
    loans: activeLoans.map(l => ({
      id: l.id,
      name: l.name,
      balance: l.current_balance,
      rate: l.interest_rate,
      payment: l.minimum_payment
    })),
    netCashFlow,
    debtToIncomeRatio: monthlyIncome > 0 ? (debtPayments / monthlyIncome) * 100 : 0,
    savingsRate: monthlyIncome > 0 ? (netCashFlow / monthlyIncome) * 100 : 0
  }
}

/**
 * Genera recomendaciones basadas en el snapshot financiero
 */
export function generateFinancialRecommendations(
  snapshot: FinancialSnapshot
): string[] {
  const recommendations: string[] = []

  // Ratio deuda/ingreso
  if (snapshot.debtToIncomeRatio > 40) {
    recommendations.push(
      '⚠️ Tu ratio deuda/ingreso es alto (>40%). Considera aumentar ingresos o reducir gastos.'
    )
  } else if (snapshot.debtToIncomeRatio > 30) {
    recommendations.push(
      '💡 Tu ratio deuda/ingreso está en zona de precaución. Evita nuevas deudas.'
    )
  }

  // Fondo de emergencia
  const monthsOfExpenses = snapshot.monthlyExpenses > 0
    ? snapshot.emergencyFund / snapshot.monthlyExpenses
    : 0

  if (monthsOfExpenses < 1) {
    recommendations.push(
      '🚨 Prioridad: Construye un fondo de emergencia de al menos 1 mes de gastos.'
    )
  } else if (monthsOfExpenses < 3) {
    recommendations.push(
      '💰 Tu fondo de emergencia cubre menos de 3 meses. Considera aumentarlo.'
    )
  }

  // Cash flow
  if (snapshot.netCashFlow < 0) {
    recommendations.push(
      '⛔ Estás gastando más de lo que ganas. Revisa tu presupuesto urgentemente.'
    )
  } else if (snapshot.netCashFlow < snapshot.monthlyIncome * 0.1) {
    recommendations.push(
      '📊 Tu tasa de ahorro es baja (<10%). Busca formas de aumentarla.'
    )
  }

  // Deuda de alta tasa
  const highRateLoans = snapshot.loans.filter(l => l.rate > 0.15)
  if (highRateLoans.length > 0) {
    recommendations.push(
      `🔥 Tienes ${highRateLoans.length} préstamo(s) con tasa >15%. Prioriza pagarlos.`
    )
  }

  return recommendations
}

// =====================================================
// EXPORTS
// =====================================================

export {
  generateDebtPayoffPlan,
  compareStrategies
} from '@/features/loans/services/debtCalculator'
