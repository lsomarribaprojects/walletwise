import { createClient } from '@/lib/supabase/client'
import type {
  ReportFilters,
  ReportData,
  ReportSummary,
  CategoryBreakdown,
  MonthlyData,
  TransactionForReport,
} from '../types'

/**
 * Obtiene los datos para generar un reporte
 */
export async function getReportData(filters: ReportFilters): Promise<ReportData> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  // Obtener transacciones
  let query = supabase
    .from('transactions')
    .select(`
      id,
      date,
      description,
      amount,
      type,
      category:categories(name),
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .gte('date', filters.dateRange.startDate)
    .lte('date', filters.dateRange.endDate)
    .order('date', { ascending: false })

  if (filters.categories && filters.categories.length > 0) {
    query = query.in('category_id', filters.categories)
  }

  if (filters.accounts && filters.accounts.length > 0) {
    query = query.in('account_id', filters.accounts)
  }

  if (filters.transactionTypes && filters.transactionTypes.length > 0) {
    query = query.in('type', filters.transactionTypes)
  }

  const { data: transactions, error } = await query

  if (error) throw error

  // Procesar datos
  const processedTransactions: TransactionForReport[] = (transactions || []).map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    category: (t.category as { name: string } | null)?.name || 'Sin categoria',
    amount: Number(t.amount),
    type: t.type as 'income' | 'expense',
    account: (t.account as { name: string } | null)?.name || 'Sin cuenta',
  }))

  // Calcular resumen
  const summary = calculateSummary(processedTransactions)

  // Calcular desglose por categoria
  const categoryBreakdown = calculateCategoryBreakdown(processedTransactions)

  // Calcular datos mensuales
  const monthlyData = calculateMonthlyData(processedTransactions, filters.dateRange)

  return {
    summary,
    monthlyData,
    categoryBreakdown,
    transactions: processedTransactions,
    generatedAt: new Date().toISOString(),
    dateRange: filters.dateRange,
  }
}

/**
 * Calcula el resumen financiero
 */
function calculateSummary(transactions: TransactionForReport[]): ReportSummary {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  // Top categorias por gasto
  const categoryMap = new Map<string, number>()
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const current = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, current + t.amount)
    })

  const topCategories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      transactionCount: transactions.filter(
        (t) => t.category === category && t.type === 'expense'
      ).length,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    topCategories,
    transactionCount: transactions.length,
    averageTransactionAmount:
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        : 0,
  }
}

/**
 * Calcula el desglose por categoria
 */
function calculateCategoryBreakdown(
  transactions: TransactionForReport[]
): CategoryBreakdown[] {
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const categoryMap = new Map<string, { amount: number; count: number }>()

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const current = categoryMap.get(t.category) || { amount: 0, count: 0 }
      categoryMap.set(t.category, {
        amount: current.amount + t.amount,
        count: current.count + 1,
      })
    })

  return Array.from(categoryMap.entries())
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      transactionCount: count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Calcula datos mensuales
 */
function calculateMonthlyData(
  transactions: TransactionForReport[],
  dateRange: { startDate: string; endDate: string }
): MonthlyData[] {
  const monthMap = new Map<string, { income: number; expenses: number }>()

  // Inicializar todos los meses en el rango
  const start = new Date(dateRange.startDate)
  const end = new Date(dateRange.endDate)

  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= end) {
    const key = current.toISOString().slice(0, 7) // YYYY-MM
    monthMap.set(key, { income: 0, expenses: 0 })
    current.setMonth(current.getMonth() + 1)
  }

  // Agregar transacciones
  transactions.forEach((t) => {
    const month = t.date.slice(0, 7) // YYYY-MM
    const data = monthMap.get(month)
    if (data) {
      if (t.type === 'income') {
        data.income += t.amount
      } else {
        data.expenses += t.amount
      }
    }
  })

  return Array.from(monthMap.entries())
    .map(([month, { income, expenses }]) => ({
      month,
      income,
      expenses,
      savings: income - expenses,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
