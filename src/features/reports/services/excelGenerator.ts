import type { ReportData, ReportConfig } from '../types'

/**
 * Genera un archivo Excel (XLSX) del reporte
 * Por ahora genera CSV que es compatible con Excel
 */
export async function generateExcel(
  data: ReportData,
  config: ReportConfig
): Promise<Blob> {
  // Generar contenido CSV compatible con Excel
  const sheets: string[] = []

  // Hoja 1: Resumen
  if (config.includeSummary !== false) {
    const summaryCSV = generateSummaryCSV(data)
    sheets.push('=== RESUMEN ===')
    sheets.push(summaryCSV)
    sheets.push('')
  }

  // Hoja 2: Desglose por categoria
  const categoryCSV = generateCategoryCSV(data)
  sheets.push('=== DESGLOSE POR CATEGORIA ===')
  sheets.push(categoryCSV)
  sheets.push('')

  // Hoja 3: Datos mensuales
  if (data.monthlyData.length > 1) {
    const monthlyCSV = generateMonthlyCSV(data)
    sheets.push('=== RESUMEN MENSUAL ===')
    sheets.push(monthlyCSV)
    sheets.push('')
  }

  // Hoja 4: Transacciones
  if (data.transactions && data.transactions.length > 0) {
    const transactionsCSV = generateTransactionsCSV(data)
    sheets.push('=== TRANSACCIONES ===')
    sheets.push(transactionsCSV)
  }

  const content = sheets.join('\n')

  // Agregar BOM para que Excel reconozca UTF-8
  const BOM = '\uFEFF'
  return new Blob([BOM + content], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  })
}

/**
 * Genera un archivo CSV del reporte
 */
export async function generateCSV(
  data: ReportData,
  _config: ReportConfig
): Promise<Blob> {
  const csv = generateTransactionsCSV(data)

  // Agregar BOM para UTF-8
  const BOM = '\uFEFF'
  return new Blob([BOM + csv], {
    type: 'text/csv;charset=utf-8',
  })
}

function generateSummaryCSV(data: ReportData): string {
  const rows = [
    ['Metrica', 'Valor'],
    ['Periodo Inicio', data.dateRange.startDate],
    ['Periodo Fin', data.dateRange.endDate],
    ['Ingresos Totales', formatNumber(data.summary.totalIncome)],
    ['Gastos Totales', formatNumber(data.summary.totalExpenses)],
    ['Ahorro Neto', formatNumber(data.summary.netSavings)],
    ['Tasa de Ahorro (%)', formatNumber(data.summary.savingsRate)],
    ['Total Transacciones', data.summary.transactionCount.toString()],
    ['Promedio por Transaccion', formatNumber(data.summary.averageTransactionAmount)],
  ]

  return rows.map((row) => row.map(escapeCSV).join(',')).join('\n')
}

function generateCategoryCSV(data: ReportData): string {
  const header = ['Categoria', 'Monto', 'Porcentaje (%)', 'Transacciones']
  const rows = data.categoryBreakdown.map((cat) => [
    cat.category,
    formatNumber(cat.amount),
    formatNumber(cat.percentage),
    cat.transactionCount.toString(),
  ])

  return [header, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
}

function generateMonthlyCSV(data: ReportData): string {
  const header = ['Mes', 'Ingresos', 'Gastos', 'Ahorro']
  const rows = data.monthlyData.map((m) => [
    formatMonth(m.month),
    formatNumber(m.income),
    formatNumber(m.expenses),
    formatNumber(m.savings),
  ])

  return [header, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
}

function generateTransactionsCSV(data: ReportData): string {
  if (!data.transactions || data.transactions.length === 0) {
    return 'No hay transacciones para mostrar'
  }

  const header = ['Fecha', 'Descripcion', 'Categoria', 'Cuenta', 'Tipo', 'Monto']
  const rows = data.transactions.map((t) => [
    t.date,
    t.description,
    t.category,
    t.account,
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    formatNumber(t.amount),
  ])

  return [header, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
}

function escapeCSV(value: string): string {
  // Si contiene comas, comillas o saltos de linea, escapar con comillas dobles
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatNumber(num: number): string {
  return num.toFixed(2)
}

function formatMonth(monthStr: string): string {
  const date = new Date(monthStr + '-01')
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
}
