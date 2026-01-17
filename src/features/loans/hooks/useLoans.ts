/**
 * Hook de Préstamos
 * Acceso simplificado al estado de préstamos
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Loan, LoansSummary, LoanPayment, LoanScheduleItem } from '../types'
import {
  getLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  recordPayment,
  getLoanPayments,
  getLoanSchedule,
  getLoansSummary,
  getLoansForPayoff
} from '../services/loanService'
import { generateDebtPayoffPlan, compareStrategies } from '../services/debtCalculator'
import type { CreateLoanInput, UpdateLoanInput, RecordPaymentInput, DebtPayoffPlan } from '../types'

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [summary, setSummary] = useState<LoansSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar préstamos
  const fetchLoans = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [loansData, summaryData] = await Promise.all([
        getLoans(),
        getLoansSummary()
      ])

      setLoans(loansData)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando préstamos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  // Crear préstamo
  const addLoan = useCallback(async (input: CreateLoanInput) => {
    const newLoan = await createLoan(input)
    setLoans(prev => [newLoan, ...prev])
    // Refrescar summary
    const newSummary = await getLoansSummary()
    setSummary(newSummary)
    return newLoan
  }, [])

  // Actualizar préstamo
  const editLoan = useCallback(async (id: string, input: UpdateLoanInput) => {
    const updated = await updateLoan(id, input)
    setLoans(prev => prev.map(l => l.id === id ? updated : l))
    const newSummary = await getLoansSummary()
    setSummary(newSummary)
    return updated
  }, [])

  // Eliminar préstamo
  const removeLoan = useCallback(async (id: string) => {
    await deleteLoan(id)
    setLoans(prev => prev.filter(l => l.id !== id))
    const newSummary = await getLoansSummary()
    setSummary(newSummary)
  }, [])

  // Registrar pago
  const makePayment = useCallback(async (input: RecordPaymentInput) => {
    await recordPayment(input)
    // Refrescar todo
    await fetchLoans()
  }, [fetchLoans])

  // Filtros
  const activeLoans = loans.filter(l => l.status === 'active')
  const paidOffLoans = loans.filter(l => l.status === 'paid_off')

  return {
    // Estado
    loans,
    activeLoans,
    paidOffLoans,
    summary,
    isLoading,
    error,

    // Acciones
    refresh: fetchLoans,
    addLoan,
    editLoan,
    removeLoan,
    makePayment
  }
}

// =====================================================
// HOOK PARA UN PRÉSTAMO INDIVIDUAL
// =====================================================

export function useLoan(loanId: string | null) {
  const [loan, setLoan] = useState<Loan | null>(null)
  const [payments, setPayments] = useState<LoanPayment[]>([])
  const [schedule, setSchedule] = useState<LoanScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos del préstamo
  const fetchLoan = useCallback(async () => {
    if (!loanId) return

    setIsLoading(true)
    setError(null)

    try {
      const [loanData, paymentsData, scheduleData] = await Promise.all([
        getLoanById(loanId),
        getLoanPayments(loanId),
        getLoanSchedule(loanId)
      ])

      setLoan(loanData)
      setPayments(paymentsData)
      setSchedule(scheduleData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando préstamo')
    } finally {
      setIsLoading(false)
    }
  }, [loanId])

  useEffect(() => {
    fetchLoan()
  }, [fetchLoan])

  // Actualizar préstamo
  const update = useCallback(async (input: UpdateLoanInput) => {
    if (!loanId) return null
    const updated = await updateLoan(loanId, input)
    setLoan(updated)
    // Refrescar schedule si cambió el balance
    if (input.current_balance !== undefined) {
      const newSchedule = await getLoanSchedule(loanId)
      setSchedule(newSchedule)
    }
    return updated
  }, [loanId])

  // Registrar pago
  const makePayment = useCallback(async (amount: number, isExtra = false, notes?: string) => {
    if (!loanId) return
    await recordPayment({
      loan_id: loanId,
      amount,
      is_extra_payment: isExtra,
      notes
    })
    await fetchLoan()
  }, [loanId, fetchLoan])

  return {
    loan,
    payments,
    schedule,
    isLoading,
    error,
    refresh: fetchLoan,
    update,
    makePayment
  }
}

// =====================================================
// HOOK PARA ESTRATEGIAS DE PAGO
// =====================================================

export function useDebtPayoffPlan(monthlyBudget: number) {
  const [plans, setPlans] = useState<{
    avalanche: DebtPayoffPlan | null
    snowball: DebtPayoffPlan | null
  }>({ avalanche: null, snowball: null })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculatePlans = useCallback(async () => {
    if (monthlyBudget <= 0) return

    setIsLoading(true)
    setError(null)

    try {
      const loans = await getLoansForPayoff()

      if (loans.length === 0) {
        setPlans({ avalanche: null, snowball: null })
        return
      }

      const { avalanche, snowball } = compareStrategies(loans, monthlyBudget)
      setPlans({ avalanche, snowball })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculando plan')
    } finally {
      setIsLoading(false)
    }
  }, [monthlyBudget])

  useEffect(() => {
    calculatePlans()
  }, [calculatePlans])

  return {
    avalanchePlan: plans.avalanche,
    snowballPlan: plans.snowball,
    isLoading,
    error,
    recalculate: calculatePlans
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default useLoans
