/**
 * Feature: Loans
 * Sistema de gestión de préstamos
 *
 * @module features/loans
 */

// Tipos
export * from './types'

// Hooks
export { useLoans, useLoan, useDebtPayoffPlan } from './hooks/useLoans'

// Servicios
export {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  recordPayment,
  getLoanPayments,
  getLoanSchedule,
  regenerateSchedule,
  getLoansSummary,
  getLoansForPayoff,
  calculatePaymentProgress,
  calculateTotalInterest,
  formatInterestRate,
  calculateMonthsRemaining
} from './services/loanService'

export {
  calculateAmortization,
  projectPayoff,
  calculateExtraPaymentImpact,
  generateDebtPayoffPlan,
  compareStrategies,
  calculateRequiredPayment,
  calculateExtraForGoal
} from './services/debtCalculator'

// Componentes
export {
  LoanCard,
  LoansSummaryCard,
  LoansSummaryWidget,
  DebtPayoffChart,
  StrategyComparison
} from './components'
