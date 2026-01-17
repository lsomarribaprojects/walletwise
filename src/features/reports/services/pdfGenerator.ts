import type { ReportData, ReportConfig } from '../types'

/**
 * Genera un PDF del reporte
 * Usa la API de generacion de PDF del servidor
 */
export async function generatePDF(
  data: ReportData,
  config: ReportConfig
): Promise<Blob> {
  // Por ahora, generamos HTML y usamos la API del navegador
  const html = generateHTMLReport(data, config)

  // Crear iframe oculto para imprimir
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresion')
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // Alternativa: usar jsPDF o similar en el futuro
  // Por ahora, el usuario puede usar "Guardar como PDF" desde la vista de impresion
  printWindow.print()

  // Retornar blob vacio por ahora (la descarga se hace via impresion)
  return new Blob([''], { type: 'application/pdf' })
}

/**
 * Genera HTML para el reporte
 */
function generateHTMLReport(data: ReportData, config: ReportConfig): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Financiero - Walletwise</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .header h1 {
          font-size: 24px;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        .header p {
          color: #6b7280;
          font-size: 14px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          font-size: 18px;
          color: #374151;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .summary-card {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }
        .summary-card label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: 600;
        }
        .summary-card .value.positive { color: #22c55e; }
        .summary-card .value.negative { color: #ef4444; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        tr:hover {
          background: #f9fafb;
        }
        .amount {
          font-family: monospace;
          text-align: right;
        }
        .amount.income { color: #22c55e; }
        .amount.expense { color: #ef4444; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte Financiero</h1>
        <p>
          Periodo: ${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}
        </p>
        <p>Generado: ${formatDate(data.generatedAt)}</p>
      </div>

      ${config.includeSummary !== false ? `
        <div class="section">
          <h2>Resumen General</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <label>Ingresos Totales</label>
              <div class="value positive">${formatCurrency(data.summary.totalIncome)}</div>
            </div>
            <div class="summary-card">
              <label>Gastos Totales</label>
              <div class="value negative">${formatCurrency(data.summary.totalExpenses)}</div>
            </div>
            <div class="summary-card">
              <label>Ahorro Neto</label>
              <div class="value ${data.summary.netSavings >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(data.summary.netSavings)}
              </div>
            </div>
            <div class="summary-card">
              <label>Tasa de Ahorro</label>
              <div class="value">${formatPercent(data.summary.savingsRate)}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <h2>Desglose por Categoria</h2>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th class="amount">Monto</th>
              <th class="amount">%</th>
              <th class="amount">Transacciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.categoryBreakdown.map(cat => `
              <tr>
                <td>${cat.category}</td>
                <td class="amount expense">${formatCurrency(cat.amount)}</td>
                <td class="amount">${formatPercent(cat.percentage)}</td>
                <td class="amount">${cat.transactionCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${data.monthlyData.length > 1 ? `
        <div class="section">
          <h2>Resumen Mensual</h2>
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th class="amount">Ingresos</th>
                <th class="amount">Gastos</th>
                <th class="amount">Ahorro</th>
              </tr>
            </thead>
            <tbody>
              ${data.monthlyData.map(m => `
                <tr>
                  <td>${new Date(m.month + '-01').toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</td>
                  <td class="amount income">${formatCurrency(m.income)}</td>
                  <td class="amount expense">${formatCurrency(m.expenses)}</td>
                  <td class="amount ${m.savings >= 0 ? 'income' : 'expense'}">${formatCurrency(m.savings)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${data.transactions && data.transactions.length > 0 ? `
        <div class="section">
          <h2>Detalle de Transacciones</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Categoria</th>
                <th class="amount">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.slice(0, 100).map(t => `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>${t.description}</td>
                  <td>${t.category}</td>
                  <td class="amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${data.transactions.length > 100 ? `
            <p style="text-align: center; color: #6b7280; margin-top: 16px;">
              Mostrando 100 de ${data.transactions.length} transacciones
            </p>
          ` : ''}
        </div>
      ` : ''}

      <div class="footer">
        <p>Generado por Walletwise</p>
        <p>${new Date().toLocaleString('es-MX')}</p>
      </div>
    </body>
    </html>
  `
}
