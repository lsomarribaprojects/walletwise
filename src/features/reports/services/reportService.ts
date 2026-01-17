import type { ReportConfig, ReportData, ReportFormat } from '../types'
import { getReportData } from './reportDataService'
import { generatePDF } from './pdfGenerator'
import { generateExcel, generateCSV } from './excelGenerator'

/**
 * Genera un reporte en el formato especificado
 */
export async function generateReport(config: ReportConfig): Promise<Blob> {
  // Obtener datos
  const data = await getReportData(config.filters)

  // Generar en el formato especificado
  switch (config.format) {
    case 'pdf':
      return generatePDF(data, config)
    case 'excel':
      return generateExcel(data, config)
    case 'csv':
      return generateCSV(data, config)
    default:
      throw new Error(`Formato no soportado: ${config.format}`)
  }
}

/**
 * Descarga un reporte generado
 */
export function downloadReport(blob: Blob, filename: string, format: ReportFormat): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  const extensions: Record<ReportFormat, string> = {
    pdf: 'pdf',
    excel: 'xlsx',
    csv: 'csv',
  }

  link.download = `${filename}.${extensions[format]}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Genera y descarga un reporte
 */
export async function generateAndDownloadReport(
  config: ReportConfig,
  filename: string = 'reporte-financiero'
): Promise<void> {
  const blob = await generateReport(config)
  downloadReport(blob, filename, config.format)
}

/**
 * Obtiene datos de preview para mostrar antes de generar
 */
export async function getReportPreview(config: ReportConfig): Promise<ReportData> {
  return getReportData(config.filters)
}

/**
 * Genera un nombre de archivo basado en la configuración
 */
export function generateFilename(config: ReportConfig): string {
  const { type, filters } = config
  const start = filters.dateRange.startDate.replace(/-/g, '')
  const end = filters.dateRange.endDate.replace(/-/g, '')

  const typeNames: Record<string, string> = {
    monthly_summary: 'resumen-mensual',
    yearly_summary: 'resumen-anual',
    transactions: 'transacciones',
    budget_analysis: 'analisis-presupuesto',
    goals_progress: 'progreso-metas',
    category_breakdown: 'desglose-categorias',
    net_worth: 'patrimonio-neto',
    custom: 'reporte-personalizado',
  }

  return `walletwise-${typeNames[type] || 'reporte'}-${start}-${end}`
}
