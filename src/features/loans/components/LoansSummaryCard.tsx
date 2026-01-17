/**
 * LoansSummaryCard
 * Resumen general de todos los préstamos
 */

'use client'

import { useMemo } from 'react'
import type { Loan, LoansSummary } from '../types'
import { LOAN_TYPE_ICONS, LOAN_TYPE_LABELS, type LoanType } from '../types'

// =====================================================
// TIPOS
// =====================================================

interface LoansSummaryCardProps {
  summary: LoansSummary | null
  loans?: Loan[]
  isLoading?: boolean
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function LoansSummaryCard({
  summary,
  loans = [],
  isLoading = false,
  className = ''
}: LoansSummaryCardProps) {
  // Calcular datos adicionales
  const additionalStats = useMemo(() => {
    if (!loans.length) return null

    const activeLoans = loans.filter(l => l.status === 'active')
    const totalMonthlyPayment = activeLoans.reduce((sum, l) => sum + l.minimum_payment, 0)
    const highestRate = Math.max(...activeLoans.map(l => l.interest_rate), 0)
    const lowestBalance = Math.min(...activeLoans.map(l => l.current_balance), 0)

    return {
      totalMonthlyPayment,
      highestRate,
      lowestBalance,
      activeLoans: activeLoans.length
    }
  }, [loans])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Sin préstamos</h3>
          <p className="text-sm text-gray-500">
            Agrega tu primer préstamo para ver el resumen
          </p>
        </div>
      </div>
    )
  }

  const progressPercentage = summary.total_original > 0
    ? ((summary.total_paid / summary.total_original) * 100)
    : 0

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header con total */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
        <p className="text-red-100 text-sm mb-1">Deuda total</p>
        <p className="text-3xl font-bold">${summary.total_debt.toLocaleString()}</p>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-red-100 mb-1">
            <span>${summary.total_paid.toLocaleString()} pagado</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-red-400/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <StatItem
          label="Préstamos activos"
          value={summary.active_loans.toString()}
          icon="📊"
        />
        <StatItem
          label="Pagos mensuales"
          value={`$${summary.monthly_payments.toLocaleString()}`}
          icon="📅"
        />
        <StatItem
          label="Tasa promedio"
          value={`${summary.average_interest_rate}%`}
          icon="📈"
        />
        {summary.next_payment_date && (
          <StatItem
            label="Próximo pago"
            value={new Date(summary.next_payment_date).toLocaleDateString('es-MX', {
              month: 'short',
              day: 'numeric'
            })}
            icon="🗓️"
          />
        )}
      </div>

      {/* Desglose por tipo */}
      {summary.loans_by_type && Object.keys(summary.loans_by_type).length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Por tipo</p>
          <div className="space-y-2">
            {Object.entries(summary.loans_by_type).map(([type, data]) => (
              <div
                key={type}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{LOAN_TYPE_ICONS[type as LoanType]}</span>
                  <span className="text-sm text-gray-700">
                    {LOAN_TYPE_LABELS[type as LoanType]}
                  </span>
                  <span className="text-xs text-gray-400">({data.count})</span>
                </div>
                <span className="font-medium text-gray-900">
                  ${data.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

interface StatItemProps {
  label: string
  value: string
  icon: string
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

// =====================================================
// VARIANTES
// =====================================================

/**
 * Widget compacto para dashboard
 */
export function LoansSummaryWidget({
  summary,
  className = ''
}: {
  summary: LoansSummary | null
  className?: string
}) {
  if (!summary || summary.active_loans === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💳</span>
          <span className="font-medium text-gray-900">Préstamos</span>
        </div>
        <span className="text-xs text-gray-500">
          {summary.active_loans} activo{summary.active_loans !== 1 ? 's' : ''}
        </span>
      </div>

      <p className="text-2xl font-bold text-red-600 mb-1">
        ${summary.total_debt.toLocaleString()}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>${summary.monthly_payments.toLocaleString()}/mes</span>
        <span>{summary.average_interest_rate}% promedio</span>
      </div>
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default LoansSummaryCard
