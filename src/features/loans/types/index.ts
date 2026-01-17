/**
 * Tipos para el sistema de préstamos
 */

// =====================================================
// ENUMS Y CONSTANTES
// =====================================================

export type LoanType = 'personal' | 'auto' | 'mortgage' | 'student' | 'business' | 'other'
export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'deferred'
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: 'Personal',
  auto: 'Automotriz',
  mortgage: 'Hipotecario',
  student: 'Estudiantil',
  business: 'Empresarial',
  other: 'Otro'
}

export const LOAN_TYPE_ICONS: Record<LoanType, string> = {
  personal: '💰',
  auto: '🚗',
  mortgage: '🏠',
  student: '🎓',
  business: '💼',
  other: '📋'
}

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  active: 'Activo',
  paid_off: 'Pagado',
  defaulted: 'En mora',
  deferred: 'Diferido'
}

export const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
  active: '#10B981',    // green
  paid_off: '#6B7280',  // gray
  defaulted: '#EF4444', // red
  deferred: '#F59E0B'   // amber
}

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annually: 'Anual'
}

// =====================================================
// INTERFACES
// =====================================================

export interface Loan {
  id: string
  user_id: string
  name: string
  lender: string
  loan_type: LoanType
  status: LoanStatus
  original_amount: number
  current_balance: number
  interest_rate: number  // Decimal (0.0599 = 5.99%)
  currency: string
  minimum_payment: number
  payment_frequency: PaymentFrequency
  payment_day: number | null
  start_date: string
  end_date: string | null
  next_payment_date: string | null
  collateral: string | null
  collateral_value: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  user_id: string
  amount: number
  principal_amount: number
  interest_amount: number
  fees_amount: number
  payment_date: string
  due_date: string | null
  is_extra_payment: boolean
  notes: string | null
  created_at: string
}

export interface LoanScheduleItem {
  id: string
  loan_id: string
  payment_number: number
  payment_date: string
  payment_amount: number
  principal_amount: number
  interest_amount: number
  balance_after: number
  is_paid: boolean
  actual_payment_id: string | null
}

export interface LoansSummary {
  total_debt: number
  total_original: number
  total_paid: number
  active_loans: number
  paid_off_loans: number
  average_interest_rate: number
  next_payment_date: string | null
  monthly_payments: number
  loans_by_type: Record<LoanType, { count: number; balance: number }>
}

// =====================================================
// FORMULARIOS
// =====================================================

export interface CreateLoanInput {
  name: string
  lender: string
  loan_type: LoanType
  original_amount: number
  current_balance: number
  interest_rate: number
  minimum_payment: number
  payment_frequency?: PaymentFrequency
  payment_day?: number
  start_date: string
  next_payment_date?: string
  collateral?: string
  collateral_value?: number
  notes?: string
}

export interface UpdateLoanInput {
  name?: string
  lender?: string
  loan_type?: LoanType
  status?: LoanStatus
  current_balance?: number
  interest_rate?: number
  minimum_payment?: number
  payment_frequency?: PaymentFrequency
  payment_day?: number
  next_payment_date?: string
  collateral?: string
  collateral_value?: number
  notes?: string
}

export interface RecordPaymentInput {
  loan_id: string
  amount: number
  payment_date?: string
  is_extra_payment?: boolean
  notes?: string
}

// =====================================================
// CALCULADORAS
// =====================================================

export interface AmortizationRow {
  paymentNumber: number
  paymentDate: Date
  payment: number
  principal: number
  interest: number
  balance: number
  cumulativeInterest: number
  cumulativePrincipal: number
}

export interface PayoffProjection {
  monthsToPayoff: number
  totalInterest: number
  totalPayment: number
  payoffDate: Date
  schedule: AmortizationRow[]
}

export interface ExtraPaymentScenario {
  extraAmount: number
  monthsSaved: number
  interestSaved: number
  newPayoffDate: Date
}

// =====================================================
// DEUDA SNOWBALL/AVALANCHE
// =====================================================

export type DebtPayoffStrategy = 'avalanche' | 'snowball'

export interface DebtPayoffPlan {
  strategy: DebtPayoffStrategy
  monthsToDebtFree: number
  totalInterestPaid: number
  totalPaid: number
  monthlyBudget: number
  loanOrder: Array<{
    loan: Loan
    payoffMonth: number
    interestPaid: number
  }>
  monthlyBreakdown: Array<{
    month: number
    date: Date
    payments: Array<{
      loanId: string
      loanName: string
      payment: number
      principal: number
      interest: number
      balance: number
      isPaidOff: boolean
    }>
    totalPayment: number
    totalDebt: number
  }>
}
