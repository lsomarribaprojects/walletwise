'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Transaction,
  GastoMensual,
  GastoAnual,
  FinanceKPIs,
  VistaRango,
} from '../types'
import type { CreditCard, CreditCardMetrics } from '../types/creditCards'
import { calculateCreditCardMetrics } from '../services/debtCalculator'

interface FinancesState {
  // Data
  transactions: Transaction[]
  gastosMensuales: GastoMensual[]
  gastosAnuales: GastoAnual[]
  creditCards: CreditCard[]

  // UI State
  vista: VistaRango
  isLoading: boolean
  error: string | null

  // Computed (cached)
  kpis: FinanceKPIs
  creditCardMetrics: CreditCardMetrics

  // Actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void

  setGastosMensuales: (gastos: GastoMensual[]) => void
  addGastoMensual: (gasto: GastoMensual) => void
  removeGastoMensual: (id: string) => void
  updateGastoMensual: (id: string, updates: Partial<GastoMensual>) => void

  setGastosAnuales: (gastos: GastoAnual[]) => void
  addGastoAnual: (gasto: GastoAnual) => void
  removeGastoAnual: (id: string) => void
  updateGastoAnual: (id: string, updates: Partial<GastoAnual>) => void

  // Credit Card Actions
  setCreditCards: (cards: CreditCard[]) => void
  addCreditCard: (card: CreditCard) => void
  removeCreditCard: (id: string) => void
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void
  recalculateCreditCardMetrics: () => void

  setVista: (vista: VistaRango) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  recalculateKPIs: () => void
  reset: () => void
}

const calculateKPIs = (transactions: Transaction[]): FinanceKPIs => {
  // Excluir transferencias de KPIs - son movimientos internos, no ingresos/gastos reales
  const totalIngresos = transactions
    .filter((t) => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  const totalGastos = transactions
    .filter((t) => t.tipo === 'gasto')
    .reduce((sum, t) => sum + Number(t.monto), 0)

  // Solo contar transacciones reales (no transferencias) para el count de operaciones
  const transaccionesReales = transactions.filter((t) => t.tipo !== 'transferencia')

  return {
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
    transaccionesCount: transaccionesReales.length,
  }
}

const DEFAULT_KPIS: FinanceKPIs = {
  totalIngresos: 0,
  totalGastos: 0,
  balance: 0,
  transaccionesCount: 0,
}

const DEFAULT_CC_METRICS: CreditCardMetrics = {
  deuda_total: 0,
  limite_total: 0,
  utilizacion_promedio: 0,
  tasa_promedio_ponderada: 0,
  pago_minimo_total: 0,
  intereses_mensuales_proyectados: 0,
  num_tarjetas: 0,
}

export const useFinancesStore = create<FinancesState>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      gastosMensuales: [],
      gastosAnuales: [],
      creditCards: [],
      vista: 'mensual',
      isLoading: false,
      error: null,
      kpis: DEFAULT_KPIS,
      creditCardMetrics: DEFAULT_CC_METRICS,

      // Transaction actions
      setTransactions: (transactions) => {
        set({ transactions, kpis: calculateKPIs(transactions) })
      },

      addTransaction: (transaction) => {
        const newTransactions = [transaction, ...get().transactions]
        set({ transactions: newTransactions, kpis: calculateKPIs(newTransactions) })
      },

      removeTransaction: (id) => {
        const newTransactions = get().transactions.filter((t) => t.id !== id)
        set({ transactions: newTransactions, kpis: calculateKPIs(newTransactions) })
      },

      updateTransaction: (id, updates) => {
        const newTransactions = get().transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        )
        set({ transactions: newTransactions, kpis: calculateKPIs(newTransactions) })
      },

      // Gastos mensuales actions
      setGastosMensuales: (gastos) => set({ gastosMensuales: gastos }),

      addGastoMensual: (gasto) => {
        set({ gastosMensuales: [...get().gastosMensuales, gasto] })
      },

      removeGastoMensual: (id) => {
        set({ gastosMensuales: get().gastosMensuales.filter((g) => g.id !== id) })
      },

      updateGastoMensual: (id, updates) => {
        set({
          gastosMensuales: get().gastosMensuales.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })
      },

      // Gastos anuales actions
      setGastosAnuales: (gastos) => set({ gastosAnuales: gastos }),

      addGastoAnual: (gasto) => {
        set({ gastosAnuales: [...get().gastosAnuales, gasto] })
      },

      removeGastoAnual: (id) => {
        set({ gastosAnuales: get().gastosAnuales.filter((g) => g.id !== id) })
      },

      updateGastoAnual: (id, updates) => {
        set({
          gastosAnuales: get().gastosAnuales.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })
      },

      // Credit Card actions
      setCreditCards: (cards) => {
        set({ creditCards: cards, creditCardMetrics: calculateCreditCardMetrics(cards) })
      },

      addCreditCard: (card) => {
        const newCards = [...get().creditCards, card]
        set({ creditCards: newCards, creditCardMetrics: calculateCreditCardMetrics(newCards) })
      },

      removeCreditCard: (id) => {
        const newCards = get().creditCards.filter((c) => c.id !== id)
        set({ creditCards: newCards, creditCardMetrics: calculateCreditCardMetrics(newCards) })
      },

      updateCreditCard: (id, updates) => {
        const newCards = get().creditCards.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
        set({ creditCards: newCards, creditCardMetrics: calculateCreditCardMetrics(newCards) })
      },

      recalculateCreditCardMetrics: () => {
        set({ creditCardMetrics: calculateCreditCardMetrics(get().creditCards) })
      },

      // UI actions
      setVista: (vista) => set({ vista }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      recalculateKPIs: () => {
        set({ kpis: calculateKPIs(get().transactions) })
      },

      reset: () => {
        set({
          transactions: [],
          gastosMensuales: [],
          gastosAnuales: [],
          creditCards: [],
          vista: 'mensual',
          isLoading: false,
          error: null,
          kpis: DEFAULT_KPIS,
          creditCardMetrics: DEFAULT_CC_METRICS,
        })
      },
    }),
    {
      name: 'profits-os-finances',
      partialize: (state) => ({
        vista: state.vista,
      }),
    }
  )
)
