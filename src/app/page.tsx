'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { NavBar } from '@/shared/components/ui/NavBar'
import { useFinancesStore } from '@/features/finances/store/financesStore'
import { useCalculatorStore } from '@/features/calculator'
import { FinanceKPI } from '@/features/finances/components/FinanceKPI'
import { TrendChart } from '@/features/finances/components/TrendChart'
import { CategoryDistribution } from '@/features/finances/components/CategoryDistribution'
import { AccountsOverview } from '@/features/finances/components/AccountsOverview'
import { TransactionsTable } from '@/features/finances/components/TransactionsTable'
import { AddTransactionModal } from '@/features/finances/components/AddTransactionModal'
import { AccountModal } from '@/features/finances/components/AccountModal'
import { OnboardingWizard } from '@/features/onboarding/components'
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/features/finances/services/transactions'
import { fetchCuentas } from '@/features/finances/services/cuentas'
import { createCuenta } from '@/features/finances/services/accountsService'
import {
  summarizeByCategory,
  calculateBalancesByCuenta,
  calculateBalanceTotal,
} from '@/features/finances/services/analytics'
import { Transaction, TransactionInput, TipoTransaccion, CuentaDB, CuentaInput } from '@/features/finances/types'
import { QuickActionButtons } from '@/features/finances/components/QuickActionButtons'
import { Footer } from '@/shared/components/ui/Footer'
import { useLanguage } from '@/shared/i18n'
import { HelpCircle } from 'lucide-react'

export default function HomePage() {
  const {
    transactions,
    kpis,
    vista,
    isLoading,
    setTransactions,
    addTransaction,
    removeTransaction,
    updateTransaction: updateTransactionInStore,
    setLoading,
    setError,
  } = useFinancesStore()

  const { inputs } = useCalculatorStore()
  const { t } = useLanguage()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [initialTipo, setInitialTipo] = useState<TipoTransaccion | undefined>()
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)
  const [gastosData, setGastosData] = useState<ReturnType<typeof summarizeByCategory>>([])
  const [ingresosData, setIngresosData] = useState<ReturnType<typeof summarizeByCategory>>([])
  const [cuentas, setCuentas] = useState<CuentaDB[]>([])
  const [balanceTotal, setBalanceTotal] = useState(0)
  const hasProcessedRecurring = useRef(false)
  const hasCheckedOnboarding = useRef(false)

  // Procesar gastos recurrentes automáticamente al cargar
  const processRecurringExpenses = useCallback(async () => {
    if (hasProcessedRecurring.current) return
    hasProcessedRecurring.current = true

    try {
      const res = await fetch('/api/gastos-mensuales/procesar', { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        if (result.procesados > 0) {
          console.log(`[Recurrentes] ${result.procesados} gastos procesados automáticamente`)
        }
      }
    } catch (err) {
      console.error('[Recurrentes] Error al procesar:', err)
    }
  }, [])

  const handleQuickAction = (tipo: TipoTransaccion) => {
    setInitialTipo(tipo)
    setEditTransaction(null)
    setIsModalOpen(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction)
    setInitialTipo(undefined)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setInitialTipo(undefined)
    setEditTransaction(null)
  }

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const [data, cuentasData] = await Promise.all([
        fetchTransactions(vista),
        fetchCuentas(),
      ])
      setTransactions(data)
      setCuentas(cuentasData)
      setGastosData(summarizeByCategory(data, 'gasto'))
      setIngresosData(summarizeByCategory(data, 'ingreso'))

      // Calcular balance total real (con balances iniciales)
      const balances = calculateBalancesByCuenta(data, cuentasData)
      setBalanceTotal(calculateBalanceTotal(balances))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [vista, setTransactions, setLoading, setError])

  useEffect(() => {
    // Primero procesar recurrentes, luego cargar transacciones
    processRecurringExpenses().then(() => loadTransactions())
  }, [processRecurringExpenses, loadTransactions])

  const handleAddTransaction = async (input: TransactionInput) => {
    const newTransaction = await createTransaction(input)
    addTransaction(newTransaction)
    const updated = [newTransaction, ...transactions]
    setGastosData(summarizeByCategory(updated, 'gasto'))
    setIngresosData(summarizeByCategory(updated, 'ingreso'))

    // Recalcular balance total
    const balances = calculateBalancesByCuenta(updated, cuentas)
    setBalanceTotal(calculateBalanceTotal(balances))
  }

  const handleUpdateTransaction = async (id: string, input: Partial<TransactionInput>) => {
    const updatedTransaction = await updateTransaction(id, input)
    updateTransactionInStore(id, updatedTransaction)
    const updated = transactions.map((t) => (t.id === id ? updatedTransaction : t))
    setGastosData(summarizeByCategory(updated, 'gasto'))
    setIngresosData(summarizeByCategory(updated, 'ingreso'))

    // Recalcular balance total
    const balances = calculateBalancesByCuenta(updated, cuentas)
    setBalanceTotal(calculateBalanceTotal(balances))
  }

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id)
    removeTransaction(id)
    const updated = transactions.filter((t) => t.id !== id)
    setGastosData(summarizeByCategory(updated, 'gasto'))
    setIngresosData(summarizeByCategory(updated, 'ingreso'))

    // Recalcular balance total
    const balances = calculateBalancesByCuenta(updated, cuentas)
    setBalanceTotal(calculateBalanceTotal(balances))
  }

  const handleAddAccount = async (cuenta: CuentaInput) => {
    const newCuenta = await createCuenta(cuenta)
    if (newCuenta) {
      setCuentas((prev) => [...prev, newCuenta])
    }
  }

  // Check if user needs onboarding (first time, no accounts)
  useEffect(() => {
    if (!hasCheckedOnboarding.current && !isLoading && cuentas.length === 0 && transactions.length === 0) {
      hasCheckedOnboarding.current = true
      // Check localStorage if wizard was completed
      const wizardCompleted = localStorage.getItem('walletwise_onboarding_completed')
      if (!wizardCompleted) {
        setIsWizardOpen(true)
      }
    }
  }, [isLoading, cuentas.length, transactions.length])

  const handleWizardComplete = () => {
    localStorage.setItem('walletwise_onboarding_completed', 'true')
    setIsWizardOpen(false)
  }

  return (
    <div className="min-h-screen bg-neu-bg">
      <NavBar />

      <main className="p-6 pb-24 md:p-8 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t.dashboard.title}</h1>
              <p className="text-gray-500 mt-1">
                {t.dashboard.subtitle}
                {inputs?.businessName && ` - ${inputs.businessName}`}
              </p>
            </div>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
              title={t.dashboard.guide}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{t.dashboard.guide}</span>
            </button>
          </div>



          {/* Main Content: Finance Dashboard */}
          <div className="space-y-8">
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FinanceKPI
                title={t.dashboard.income}
                value={kpis.totalIngresos}
                icon="income"
                variant="positive"
              />
              <FinanceKPI
                title={t.dashboard.expenses}
                value={kpis.totalGastos}
                icon="expense"
                variant="negative"
              />
              <FinanceKPI
                title={t.dashboard.balance}
                value={balanceTotal}
                icon="balance"
                variant={balanceTotal >= 0 ? 'positive' : 'negative'}
              />
              <FinanceKPI
                title={t.dashboard.transactions}
                value={kpis.transaccionesCount}
                icon="transactions"
                variant="neutral"
              />
            </div>

            {/* Charts */}
            <TrendChart transactions={transactions} />

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryDistribution
                data={gastosData}
                title={t.charts.expensesByCategory}
                type="gasto"
              />
              <CategoryDistribution
                data={ingresosData}
                title={t.charts.incomeByCategory}
                type="ingreso"
              />
            </div>

            {/* Accounts Overview */}
            <AccountsOverview
              transactions={transactions}
              cuentas={cuentas}
              onAddAccount={() => setIsAccountModalOpen(true)}
            />

            {/* Table */}
            <TransactionsTable
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
        initialTipo={initialTipo}
        cuentas={cuentas}
        editTransaction={editTransaction}
      />

      {/* Quick Action FABs */}
      <QuickActionButtons onQuickAction={handleQuickAction} />

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleAddAccount}
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </div>
  )
}
