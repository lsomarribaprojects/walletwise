// Tipos para el sistema de reportes

export type ReportFormat = 'pdf' | 'excel' | 'csv'

export type ReportType =
  | 'monthly_summary'      // Resumen mensual
  | 'yearly_summary'       // Resumen anual
  | 'transactions'         // Detalle de transacciones
  | 'budget_analysis'      // Analisis de presupuestos
  | 'goals_progress'       // Progreso de metas
  | 'category_breakdown'   // Desglose por categorias
  | 'net_worth'           // Patrimonio neto
  | 'custom'              // Personalizado

export interface ReportDateRange {
  startDate: string
  endDate: string
}

export interface ReportFilters {
  dateRange: ReportDateRange
  categories?: string[]
  accounts?: string[]
  transactionTypes?: ('income' | 'expense')[]
}

export interface ReportConfig {
  type: ReportType
  format: ReportFormat
  filters: ReportFilters
  includeCharts?: boolean
  includeSummary?: boolean
  language?: 'es' | 'en'
}

export interface ReportSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
  topCategories: CategoryBreakdown[]
  transactionCount: number
  averageTransactionAmount: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactionCount: number
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface ReportData {
  summary: ReportSummary
  monthlyData: MonthlyData[]
  categoryBreakdown: CategoryBreakdown[]
  transactions?: TransactionForReport[]
  generatedAt: string
  dateRange: ReportDateRange
}

export interface TransactionForReport {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  account: string
}

export interface ReportTypeConfig {
  label: string
  description: string
  icon: string
  requiresPremium?: boolean
}

export const REPORT_TYPE_CONFIG: Record<ReportType, ReportTypeConfig> = {
  monthly_summary: {
    label: 'Resumen Mensual',
    description: 'Resumen de ingresos, gastos y ahorro del mes',
    icon: '📊',
  },
  yearly_summary: {
    label: 'Resumen Anual',
    description: 'Analisis completo del año fiscal',
    icon: '📅',
    requiresPremium: true,
  },
  transactions: {
    label: 'Detalle de Transacciones',
    description: 'Lista completa de movimientos',
    icon: '📝',
  },
  budget_analysis: {
    label: 'Analisis de Presupuestos',
    description: 'Comparativo de gastos vs presupuesto',
    icon: '📈',
  },
  goals_progress: {
    label: 'Progreso de Metas',
    description: 'Estado actual de tus metas financieras',
    icon: '🎯',
  },
  category_breakdown: {
    label: 'Desglose por Categorias',
    description: 'Gastos detallados por categoria',
    icon: '🗂️',
  },
  net_worth: {
    label: 'Patrimonio Neto',
    description: 'Activos menos pasivos',
    icon: '💎',
    requiresPremium: true,
  },
  custom: {
    label: 'Reporte Personalizado',
    description: 'Configura tu propio reporte',
    icon: '⚙️',
    requiresPremium: true,
  },
}

export const REPORT_FORMAT_CONFIG: Record<ReportFormat, { label: string; icon: string; mime: string }> = {
  pdf: { label: 'PDF', icon: '📄', mime: 'application/pdf' },
  excel: { label: 'Excel', icon: '📗', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  csv: { label: 'CSV', icon: '📋', mime: 'text/csv' },
}
