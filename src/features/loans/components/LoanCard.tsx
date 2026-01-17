/**
 * LoanCard
 * Tarjeta de resumen de un préstamo
 */

'use client'

import { useState } from 'react'
import {
  LOAN_TYPE_ICONS,
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_COLORS,
  type Loan
} from '../types'
import { calculatePaymentProgress, formatInterestRate, calculateMonthsRemaining } from '../services/loanService'

// =====================================================
// TIPOS
// =====================================================

interface LoanCardProps {
  loan: Loan
  onEdit?: (loan: Loan) => void
  onDelete?: (loan: Loan) => void
  onRecordPayment?: (loan: Loan) => void
  onClick?: (loan: Loan) => void
  compact?: boolean
  className?: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function LoanCard({
  loan,
  onEdit,
  onDelete,
  onRecordPayment,
  onClick,
  compact = false,
  className = ''
}: LoanCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const progress = calculatePaymentProgress(loan)
  const monthsRemaining = calculateMonthsRemaining(loan)

  const handleClick = () => {
    if (onClick) onClick(loan)
  }

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{LOAN_TYPE_ICONS[loan.loan_type]}</span>
          <div>
            <p className="font-medium text-gray-900">{loan.name}</p>
            <p className="text-sm text-gray-500">{loan.lender}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            ${loan.current_balance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            {formatInterestRate(loan.interest_rate)} APR
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick ? handleClick : undefined}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-2xl">{LOAN_TYPE_ICONS[loan.loan_type]}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{loan.name}</h3>
              <p className="text-sm text-gray-500">{loan.lender}</p>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {onRecordPayment && loan.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRecordPayment(loan)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Registrar pago
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(loan)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(loan)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Balance y tags */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Balance actual</p>
            <p className="text-2xl font-bold text-gray-900">
              ${loan.current_balance.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${LOAN_STATUS_COLORS[loan.status]}15`,
                color: LOAN_STATUS_COLORS[loan.status]
              }}
            >
              {LOAN_STATUS_LABELS[loan.status]}
            </span>
            <span className="text-xs text-gray-500">
              {LOAN_TYPE_LABELS[loan.loan_type]}
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progreso de pago</span>
            <span>{progress.percentagePaid.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentagePaid}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>${progress.amountPaid.toLocaleString()} pagado</span>
            <span>de ${loan.original_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-gray-500">Tasa de interés</p>
            <p className="font-semibold text-gray-900">{formatInterestRate(loan.interest_rate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pago mensual</p>
            <p className="font-semibold text-gray-900">${loan.minimum_payment.toLocaleString()}</p>
          </div>
          {loan.next_payment_date && loan.status === 'active' && (
            <div>
              <p className="text-xs text-gray-500">Próximo pago</p>
              <p className="font-semibold text-gray-900">
                {new Date(loan.next_payment_date).toLocaleDateString('es-MX', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          {loan.status === 'active' && monthsRemaining > 0 && (
            <div>
              <p className="text-xs text-gray-500">Tiempo restante</p>
              <p className="font-semibold text-gray-900">
                {monthsRemaining > 12
                  ? `${Math.floor(monthsRemaining / 12)}a ${monthsRemaining % 12}m`
                  : `${monthsRemaining} meses`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer con CTA */}
      {onRecordPayment && loan.status === 'active' && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRecordPayment(loan)
            }}
            className="w-full py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Registrar pago
          </button>
        </div>
      )}
    </div>
  )
}

// =====================================================
// EXPORTS
// =====================================================

export default LoanCard
