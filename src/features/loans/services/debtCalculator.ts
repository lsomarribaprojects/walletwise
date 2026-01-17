/**
 * Calculadora de Deuda
 * Estrategias de pago: Avalanche y Snowball
 */

import type {
  Loan,
  AmortizationRow,
  PayoffProjection,
  ExtraPaymentScenario,
  DebtPayoffPlan,
  DebtPayoffStrategy
} from '../types'

// =====================================================
// CALCULADORA DE AMORTIZACIÓN
// =====================================================

/**
 * Genera la tabla de amortización para un préstamo
 */
export function calculateAmortization(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  startDate: Date = new Date()
): AmortizationRow[] {
  const schedule: AmortizationRow[] = []
  const monthlyRate = annualRate / 12

  let balance = principal
  let paymentNumber = 0
  let cumulativeInterest = 0
  let cumulativePrincipal = 0
  let currentDate = new Date(startDate)

  while (balance > 0.01 && paymentNumber < 360) {
    paymentNumber++

    // Calcular interés del mes
    const interest = Math.round(balance * monthlyRate * 100) / 100

    // Calcular principal (pago menos interés)
    let principalPaid = monthlyPayment - interest
    let actualPayment = monthlyPayment

    // Último pago puede ser menor
    if (principalPaid >= balance) {
      principalPaid = balance
      actualPayment = principalPaid + interest
    }

    // Actualizar balance
    balance = Math.max(0, balance - principalPaid)

    // Acumulados
    cumulativeInterest += interest
    cumulativePrincipal += principalPaid

    schedule.push({
      paymentNumber,
      paymentDate: new Date(currentDate),
      payment: Math.round(actualPayment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100
    })

    // Siguiente mes
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return schedule
}

/**
 * Proyecta cuándo se pagará un préstamo
 */
export function projectPayoff(loan: Loan): PayoffProjection {
  const schedule = calculateAmortization(
    loan.current_balance,
    loan.interest_rate,
    loan.minimum_payment,
    loan.next_payment_date ? new Date(loan.next_payment_date) : new Date()
  )

  const lastPayment = schedule[schedule.length - 1]

  return {
    monthsToPayoff: schedule.length,
    totalInterest: lastPayment?.cumulativeInterest || 0,
    totalPayment: schedule.reduce((sum, row) => sum + row.payment, 0),
    payoffDate: lastPayment?.paymentDate || new Date(),
    schedule
  }
}

/**
 * Calcula el impacto de pagos extra
 */
export function calculateExtraPaymentImpact(
  loan: Loan,
  extraAmount: number
): ExtraPaymentScenario {
  // Proyección original
  const original = projectPayoff(loan)

  // Proyección con pago extra
  const withExtra = calculateAmortization(
    loan.current_balance,
    loan.interest_rate,
    loan.minimum_payment + extraAmount,
    loan.next_payment_date ? new Date(loan.next_payment_date) : new Date()
  )

  const lastPayment = withExtra[withExtra.length - 1]

  return {
    extraAmount,
    monthsSaved: original.monthsToPayoff - withExtra.length,
    interestSaved: original.totalInterest - (lastPayment?.cumulativeInterest || 0),
    newPayoffDate: lastPayment?.paymentDate || new Date()
  }
}

// =====================================================
// ESTRATEGIAS DE PAGO DE DEUDA
// =====================================================

/**
 * Genera un plan de pago de deuda usando Avalanche o Snowball
 *
 * Avalanche: Paga primero la deuda con mayor tasa de interés
 * Snowball: Paga primero la deuda con menor balance
 */
export function generateDebtPayoffPlan(
  loans: Loan[],
  monthlyBudget: number,
  strategy: DebtPayoffStrategy = 'avalanche'
): DebtPayoffPlan {
  // Filtrar solo préstamos activos
  const activeLoans = loans.filter(l => l.status === 'active' && l.current_balance > 0)

  if (activeLoans.length === 0) {
    return {
      strategy,
      monthsToDebtFree: 0,
      totalInterestPaid: 0,
      totalPaid: 0,
      monthlyBudget,
      loanOrder: [],
      monthlyBreakdown: []
    }
  }

  // Verificar que el presupuesto cubre los pagos mínimos
  const totalMinimum = activeLoans.reduce((sum, l) => sum + l.minimum_payment, 0)
  if (monthlyBudget < totalMinimum) {
    throw new Error(`El presupuesto ($${monthlyBudget}) es menor que los pagos mínimos ($${totalMinimum})`)
  }

  // Ordenar según estrategia
  const sortedLoans = [...activeLoans].sort((a, b) => {
    if (strategy === 'avalanche') {
      return b.interest_rate - a.interest_rate // Mayor tasa primero
    } else {
      return a.current_balance - b.current_balance // Menor balance primero
    }
  })

  // Simular pagos mes a mes
  const loanBalances = new Map(sortedLoans.map(l => [l.id, l.current_balance]))
  const loanInterestPaid = new Map(sortedLoans.map(l => [l.id, 0]))
  const paidOffMonths = new Map<string, number>()
  const monthlyBreakdown: DebtPayoffPlan['monthlyBreakdown'] = []

  let month = 0
  let currentDate = new Date()

  while (hasActiveLoans(loanBalances) && month < 360) {
    month++
    currentDate = addMonths(currentDate, 1)

    const monthPayments: DebtPayoffPlan['monthlyBreakdown'][0]['payments'] = []
    let remainingBudget = monthlyBudget

    // Primero, hacer pagos mínimos a todos los préstamos activos
    for (const loan of sortedLoans) {
      const balance = loanBalances.get(loan.id) || 0
      if (balance <= 0) continue

      const monthlyRate = loan.interest_rate / 12
      const interest = balance * monthlyRate
      const payment = Math.min(loan.minimum_payment, balance + interest)
      const principal = payment - interest
      const newBalance = Math.max(0, balance - principal)

      loanBalances.set(loan.id, newBalance)
      loanInterestPaid.set(loan.id, (loanInterestPaid.get(loan.id) || 0) + interest)
      remainingBudget -= payment

      monthPayments.push({
        loanId: loan.id,
        loanName: loan.name,
        payment,
        principal,
        interest,
        balance: newBalance,
        isPaidOff: newBalance <= 0
      })

      if (newBalance <= 0 && !paidOffMonths.has(loan.id)) {
        paidOffMonths.set(loan.id, month)
      }
    }

    // Luego, aplicar el extra al préstamo prioritario
    if (remainingBudget > 0) {
      const targetLoan = sortedLoans.find(l => (loanBalances.get(l.id) || 0) > 0)
      if (targetLoan) {
        const balance = loanBalances.get(targetLoan.id) || 0
        const extraPayment = Math.min(remainingBudget, balance)

        loanBalances.set(targetLoan.id, balance - extraPayment)

        // Actualizar el pago de este préstamo
        const existingPayment = monthPayments.find(p => p.loanId === targetLoan.id)
        if (existingPayment) {
          existingPayment.payment += extraPayment
          existingPayment.principal += extraPayment
          existingPayment.balance = loanBalances.get(targetLoan.id) || 0
          existingPayment.isPaidOff = existingPayment.balance <= 0

          if (existingPayment.balance <= 0 && !paidOffMonths.has(targetLoan.id)) {
            paidOffMonths.set(targetLoan.id, month)
          }
        }
      }
    }

    // Calcular totales del mes
    const totalPayment = monthPayments.reduce((sum, p) => sum + p.payment, 0)
    const totalDebt = Array.from(loanBalances.values()).reduce((sum, b) => sum + b, 0)

    monthlyBreakdown.push({
      month,
      date: new Date(currentDate),
      payments: monthPayments,
      totalPayment,
      totalDebt
    })
  }

  // Generar orden de préstamos con detalles
  const loanOrder = sortedLoans.map(loan => ({
    loan,
    payoffMonth: paidOffMonths.get(loan.id) || month,
    interestPaid: loanInterestPaid.get(loan.id) || 0
  })).sort((a, b) => a.payoffMonth - b.payoffMonth)

  // Totales
  const totalInterestPaid = Array.from(loanInterestPaid.values()).reduce((sum, i) => sum + i, 0)
  const totalPaid = monthlyBreakdown.reduce((sum, m) => sum + m.totalPayment, 0)

  return {
    strategy,
    monthsToDebtFree: month,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    monthlyBudget,
    loanOrder,
    monthlyBreakdown
  }
}

/**
 * Compara estrategias Avalanche vs Snowball
 */
export function compareStrategies(
  loans: Loan[],
  monthlyBudget: number
): {
  avalanche: DebtPayoffPlan
  snowball: DebtPayoffPlan
  savings: {
    months: number
    interest: number
    winner: DebtPayoffStrategy
  }
} {
  const avalanche = generateDebtPayoffPlan(loans, monthlyBudget, 'avalanche')
  const snowball = generateDebtPayoffPlan(loans, monthlyBudget, 'snowball')

  const monthsDiff = snowball.monthsToDebtFree - avalanche.monthsToDebtFree
  const interestDiff = snowball.totalInterestPaid - avalanche.totalInterestPaid

  return {
    avalanche,
    snowball,
    savings: {
      months: Math.abs(monthsDiff),
      interest: Math.abs(interestDiff),
      winner: interestDiff >= 0 ? 'avalanche' : 'snowball'
    }
  }
}

// =====================================================
// HELPERS
// =====================================================

function hasActiveLoans(balances: Map<string, number>): boolean {
  for (const balance of balances.values()) {
    if (balance > 0) return true
  }
  return false
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Calcula el pago mensual requerido para pagar un préstamo en X meses
 */
export function calculateRequiredPayment(
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

/**
 * Calcula cuánto extra pagar mensualmente para estar libre de deuda en X meses
 */
export function calculateExtraForGoal(
  loans: Loan[],
  targetMonths: number
): {
  currentMonthly: number
  requiredMonthly: number
  extraNeeded: number
} {
  const currentMonthly = loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.minimum_payment, 0)

  // Simular cuánto se necesita
  let low = currentMonthly
  let high = currentMonthly * 10
  let requiredMonthly = currentMonthly

  // Binary search para encontrar el pago necesario
  while (high - low > 1) {
    const mid = (low + high) / 2
    const plan = generateDebtPayoffPlan(loans, mid, 'avalanche')

    if (plan.monthsToDebtFree <= targetMonths) {
      high = mid
      requiredMonthly = mid
    } else {
      low = mid
    }
  }

  return {
    currentMonthly: Math.round(currentMonthly * 100) / 100,
    requiredMonthly: Math.round(requiredMonthly * 100) / 100,
    extraNeeded: Math.round((requiredMonthly - currentMonthly) * 100) / 100
  }
}
