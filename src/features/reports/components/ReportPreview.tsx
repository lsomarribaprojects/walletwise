'use client'

import { ReportData } from '../types'
import { NeuCard } from '@/shared/components/ui'

interface ReportPreviewProps {
  data: ReportData
  isLoading?: boolean
}

export function ReportPreview({ data, isLoading }: ReportPreviewProps) {
  if (isLoading) {
    return (
      <NeuCard>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </NeuCard>
    )
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Vista Previa</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeuCard size="sm" variant="inset">
          <p className="text-xs text-gray-500 uppercase">Ingresos</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(data.summary.totalIncome)}
          </p>
        </NeuCard>
        <NeuCard size="sm" variant="inset">
          <p className="text-xs text-gray-500 uppercase">Gastos</p>
          <p className="text-xl font-bold text-red-500">
            {formatCurrency(data.summary.totalExpenses)}
          </p>
        </NeuCard>
        <NeuCard size="sm" variant="inset">
          <p className="text-xs text-gray-500 uppercase">Ahorro</p>
          <p className={`text-xl font-bold ${data.summary.netSavings >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(data.summary.netSavings)}
          </p>
        </NeuCard>
        <NeuCard size="sm" variant="inset">
          <p className="text-xs text-gray-500 uppercase">Tasa de Ahorro</p>
          <p className="text-xl font-bold text-blue-600">
            {data.summary.savingsRate.toFixed(1)}%
          </p>
        </NeuCard>
      </div>

      {/* Top categories */}
      {data.summary.topCategories.length > 0 && (
        <NeuCard>
          <h4 className="font-semibold text-gray-700 mb-4">Top Categorias</h4>
          <div className="space-y-3">
            {data.summary.topCategories.slice(0, 5).map((cat, index) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-4">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </NeuCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <NeuCard size="sm">
          <p className="text-3xl font-bold text-gray-800">{data.summary.transactionCount}</p>
          <p className="text-sm text-gray-500">Transacciones</p>
        </NeuCard>
        <NeuCard size="sm">
          <p className="text-3xl font-bold text-gray-800">
            {formatCurrency(data.summary.averageTransactionAmount)}
          </p>
          <p className="text-sm text-gray-500">Promedio por transaccion</p>
        </NeuCard>
      </div>
    </div>
  )
}
