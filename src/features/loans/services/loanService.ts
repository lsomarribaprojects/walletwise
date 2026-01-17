/**
 * Servicio de Préstamos
 * Operaciones CRUD y cálculos de préstamos
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Loan,
  LoanPayment,
  LoanScheduleItem,
  LoansSummary,
  CreateLoanInput,
  UpdateLoanInput,
  RecordPaymentInput
} from '../types'

// =====================================================
// OPERACIONES CRUD
// =====================================================

/**
 * Obtener todos los préstamos del usuario
 */
export async function getLoans(): Promise<Loan[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching loans:', error)
    throw new Error('Error al obtener préstamos')
  }

  return data || []
}

/**
 * Obtener un préstamo por ID
 */
export async function getLoanById(id: string): Promise<Loan | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching loan:', error)
    throw new Error('Error al obtener préstamo')
  }

  return data
}

/**
 * Crear un nuevo préstamo
 */
export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: user.id,
      ...input,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating loan:', error)
    throw new Error('Error al crear préstamo')
  }

  // Generar tabla de amortización
  await supabase.rpc('calculate_amortization_schedule', { p_loan_id: data.id })

  return data
}

/**
 * Actualizar un préstamo
 */
export async function updateLoan(id: string, input: UpdateLoanInput): Promise<Loan> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loans')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating loan:', error)
    throw new Error('Error al actualizar préstamo')
  }

  // Recalcular amortización si cambió el balance o tasa
  if (input.current_balance !== undefined || input.interest_rate !== undefined) {
    await supabase.rpc('calculate_amortization_schedule', { p_loan_id: id })
  }

  return data
}

/**
 * Eliminar un préstamo
 */
export async function deleteLoan(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting loan:', error)
    throw new Error('Error al eliminar préstamo')
  }
}

// =====================================================
// PAGOS
// =====================================================

/**
 * Registrar un pago
 */
export async function recordPayment(input: RecordPaymentInput): Promise<LoanPayment> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('record_loan_payment', {
    p_loan_id: input.loan_id,
    p_amount: input.amount,
    p_payment_date: input.payment_date || new Date().toISOString().split('T')[0],
    p_is_extra: input.is_extra_payment || false,
    p_notes: input.notes || null
  })

  if (error) {
    console.error('Error recording payment:', error)
    throw new Error('Error al registrar pago')
  }

  // Obtener el pago creado
  const { data: payment } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('id', data)
    .single()

  return payment
}

/**
 * Obtener historial de pagos de un préstamo
 */
export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    throw new Error('Error al obtener pagos')
  }

  return data || []
}

// =====================================================
// AMORTIZACIÓN
// =====================================================

/**
 * Obtener tabla de amortización
 */
export async function getLoanSchedule(loanId: string): Promise<LoanScheduleItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loan_schedules')
    .select('*')
    .eq('loan_id', loanId)
    .order('payment_number', { ascending: true })

  if (error) {
    console.error('Error fetching schedule:', error)
    throw new Error('Error al obtener amortización')
  }

  return data || []
}

/**
 * Regenerar tabla de amortización
 */
export async function regenerateSchedule(loanId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.rpc('calculate_amortization_schedule', {
    p_loan_id: loanId
  })

  if (error) {
    console.error('Error regenerating schedule:', error)
    throw new Error('Error al regenerar amortización')
  }
}

// =====================================================
// RESÚMENES
// =====================================================

/**
 * Obtener resumen de préstamos
 */
export async function getLoansSummary(): Promise<LoansSummary | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.rpc('get_loans_summary', {
    p_user_id: user.id
  })

  if (error) {
    console.error('Error fetching summary:', error)
    return null
  }

  return data as LoansSummary
}

/**
 * Obtener préstamos activos ordenados por prioridad (avalanche o snowball)
 */
export async function getLoansForPayoff(strategy: 'avalanche' | 'snowball' = 'avalanche'): Promise<Loan[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('status', 'active')
    .order(
      strategy === 'avalanche' ? 'interest_rate' : 'current_balance',
      { ascending: strategy === 'snowball' }
    )

  if (error) {
    console.error('Error fetching loans for payoff:', error)
    return []
  }

  return data || []
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Calcular el progreso de pago de un préstamo
 */
export function calculatePaymentProgress(loan: Loan): {
  percentagePaid: number
  amountPaid: number
  remaining: number
} {
  const amountPaid = loan.original_amount - loan.current_balance
  const percentagePaid = (amountPaid / loan.original_amount) * 100

  return {
    percentagePaid: Math.round(percentagePaid * 100) / 100,
    amountPaid,
    remaining: loan.current_balance
  }
}

/**
 * Calcular el interés total de un préstamo según su schedule
 */
export function calculateTotalInterest(schedule: LoanScheduleItem[]): number {
  return schedule.reduce((sum, item) => sum + item.interest_amount, 0)
}

/**
 * Formatear tasa de interés para mostrar
 */
export function formatInterestRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

/**
 * Calcular meses restantes hasta payoff
 */
export function calculateMonthsRemaining(loan: Loan): number {
  if (loan.status !== 'active' || loan.current_balance <= 0) return 0

  const monthlyRate = loan.interest_rate / 12

  if (monthlyRate === 0) {
    return Math.ceil(loan.current_balance / loan.minimum_payment)
  }

  return Math.ceil(
    -Math.log(1 - (loan.current_balance * monthlyRate / loan.minimum_payment)) /
    Math.log(1 + monthlyRate)
  )
}
