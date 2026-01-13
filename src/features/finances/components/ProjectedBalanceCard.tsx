'use client'

import { AlertTriangle, CheckCircle, TrendingDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'
import type { ProjectedBalance, CommittedSummary, CommittedExpense } from '../services/analytics'

interface ProjectedBalanceCardProps {
  projected: ProjectedBalance
  committed: CommittedSummary
}

export function ProjectedBalanceCard({ projected, committed }: ProjectedBalanceCardProps) {
  const { t } = useLanguage()
  const [showDetails, setShowDetails] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getAlertStyles = (alerta: 'ok' | 'warning' | 'danger') => {
    switch (alerta) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          text: 'text-red-700',
        }
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-500',
          text: 'text-amber-700',
        }
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-500',
          text: 'text-green-700',
        }
    }
  }

  const styles = getAlertStyles(projected.alerta)
  const pendingExpenses = committed.gastos.filter(g => !g.ya_pagado)
  const paidExpenses = committed.gastos.filter(g => g.ya_pagado)

  return (
    <NeuCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${styles.bg}`}>
            <TrendingDown className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">
              {t.committed?.title || 'Balance Proyectado'}
            </h3>
            <p className="text-xs text-gray-500">
              {t.committed?.subtitle || 'Después de gastos comprometidos'}
            </p>
          </div>
        </div>
      </div>

      {/* Balances principales */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-neu-bg shadow-neu-inset">
          <p className="text-xs text-gray-500 mb-1">
            {t.committed?.currentBalance || 'Actual'}
          </p>
          <p className="text-lg font-bold text-gray-700">
            {formatCurrency(projected.balance_actual)}
          </p>
        </div>

        <div className="text-center p-3 rounded-xl bg-neu-bg shadow-neu-inset">
          <p className="text-xs text-gray-500 mb-1">
            {t.committed?.pending || 'Comprometido'}
          </p>
          <p className="text-lg font-bold text-red-500">
            -{formatCurrency(projected.gastos_comprometidos)}
          </p>
        </div>

        <div className="text-center p-3 rounded-xl bg-neu-bg shadow-neu-inset">
          <p className="text-xs text-gray-500 mb-1">
            {t.committed?.projected || 'Proyectado'}
          </p>
          <p className={`text-lg font-bold ${
            projected.balance_proyectado >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(projected.balance_proyectado)}
          </p>
        </div>
      </div>

      {/* Alerta */}
      <div className={`p-3 rounded-lg ${styles.bg} border ${styles.border} mb-4`}>
        <div className="flex items-start gap-2">
          {projected.alerta === 'ok' ? (
            <CheckCircle className={`w-5 h-5 ${styles.icon} shrink-0 mt-0.5`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${styles.icon} shrink-0 mt-0.5`} />
          )}
          <div>
            <p className={`text-sm font-medium ${styles.text}`}>
              {projected.mensaje_alerta}
            </p>
            {projected.deficit > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {t.committed?.deficit || 'Déficit'}: {formatCurrency(projected.deficit)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toggle para ver detalles */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {pendingExpenses.length} {t.committed?.pendingPayments || 'pagos pendientes'}
          {paidExpenses.length > 0 && (
            <span className="text-green-600">
              ({paidExpenses.length} {t.committed?.paid || 'pagados'})
            </span>
          )}
        </span>
        {showDetails ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Lista de gastos comprometidos */}
      {showDetails && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {/* Pendientes */}
          {pendingExpenses.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                {t.committed?.upcoming || 'Próximos'}
              </p>
              {pendingExpenses.map(expense => (
                <ExpenseItem key={expense.id} expense={expense} formatCurrency={formatCurrency} t={t} />
              ))}
            </>
          )}

          {/* Pagados */}
          {paidExpenses.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mt-3">
                {t.committed?.alreadyPaid || 'Ya pagados este mes'}
              </p>
              {paidExpenses.map(expense => (
                <ExpenseItem key={expense.id} expense={expense} formatCurrency={formatCurrency} t={t} isPaid />
              ))}
            </>
          )}

          {committed.gastos.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {t.committed?.noCommitted || 'No hay gastos recurrentes configurados'}
            </p>
          )}
        </div>
      )}
    </NeuCard>
  )
}

interface ExpenseItemProps {
  expense: CommittedExpense
  formatCurrency: (amount: number) => string
  t: Record<string, unknown>
  isPaid?: boolean
}

function ExpenseItem({ expense, formatCurrency, t, isPaid }: ExpenseItemProps) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${
      isPaid ? 'bg-green-50/50' : 'bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        {isPaid ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${
            expense.dias_restantes <= 3 ? 'bg-red-500' :
            expense.dias_restantes <= 7 ? 'bg-amber-500' : 'bg-gray-300'
          }`} />
        )}
        <div>
          <p className={`text-sm font-medium ${isPaid ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {expense.nombre}
          </p>
          <p className="text-xs text-gray-400">
            {isPaid ? (
              (t.committed as Record<string, string>)?.paidOn || 'Pagado'
            ) : (
              expense.dias_restantes === 0
                ? ((t.committed as Record<string, string>)?.today || 'Hoy')
                : expense.dias_restantes === 1
                  ? ((t.committed as Record<string, string>)?.tomorrow || 'Mañana')
                  : `${expense.dias_restantes} ${(t.committed as Record<string, string>)?.daysLeft || 'días'}`
            )}
            {' • '}{expense.cuenta}
          </p>
        </div>
      </div>
      <p className={`text-sm font-medium ${isPaid ? 'text-gray-400' : 'text-gray-700'}`}>
        {formatCurrency(expense.monto)}
      </p>
    </div>
  )
}
