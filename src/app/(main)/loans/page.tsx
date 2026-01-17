'use client'

import { useState } from 'react'
import { TierGate } from '@/features/subscriptions'
import {
  useLoans,
  LoanCard,
  LoansSummaryCard,
  DebtPayoffChart,
  compareStrategies
} from '@/features/loans'
import type { Loan, CreateLoanInput } from '@/features/loans'
import { NeuButton } from '@/shared/components/ui'

export default function LoansPage() {
  const { loans, activeLoans, paidOffLoans, summary, isLoading, addLoan, editLoan, removeLoan, makePayment } = useLoans()
  const [showForm, setShowForm] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null)

  // Planes de pago
  const payoffPlans = activeLoans.length > 0
    ? compareStrategies(activeLoans, activeLoans.reduce((sum, l) => sum + l.minimum_payment, 0) + 100)
    : null

  const handleRecordPayment = (loan: Loan) => {
    setPaymentLoan(loan)
    setShowPaymentModal(true)
  }

  const handleEdit = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowForm(true)
  }

  const handleDelete = async (loan: Loan) => {
    if (confirm(`¿Eliminar el préstamo "${loan.name}"?`)) {
      await removeLoan(loan.id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando préstamos...</div>
      </div>
    )
  }

  return (
    <TierGate feature="loans">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                💰 Préstamos
              </h1>
              <p className="text-gray-500 mt-1">
                Gestiona y optimiza el pago de tus deudas
              </p>
            </div>
            <NeuButton variant="primary" onClick={() => setShowForm(true)}>
              + Nuevo Préstamo
            </NeuButton>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Resumen */}
            <div className="lg:col-span-1 space-y-6">
              <LoansSummaryCard summary={summary} loans={loans} />

              {/* Plan de pago */}
              {payoffPlans && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Estrategia recomendada
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Método</span>
                      <span className="font-medium text-purple-600">
                        {payoffPlans.savings.winner === 'avalanche' ? '📉 Avalanche' : '❄️ Snowball'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Libre de deuda en</span>
                      <span className="font-medium">
                        {Math.floor(payoffPlans.avalanche.monthsToDebtFree / 12)}a{' '}
                        {payoffPlans.avalanche.monthsToDebtFree % 12}m
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Ahorro vs alternativa</span>
                      <span className="font-medium text-green-600">
                        ${payoffPlans.savings.interest.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: Lista de préstamos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Préstamos activos */}
              {activeLoans.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Préstamos activos ({activeLoans.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onRecordPayment={handleRecordPayment}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState onAddLoan={() => setShowForm(true)} />
              )}

              {/* Chart de pago */}
              {payoffPlans && (
                <DebtPayoffChart
                  avalanchePlan={payoffPlans.avalanche}
                  snowballPlan={payoffPlans.snowball}
                />
              )}

              {/* Préstamos pagados */}
              {paidOffLoans.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Préstamos pagados ({paidOffLoans.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paidOffLoans.map((loan) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de nuevo préstamo */}
        {showForm && (
          <LoanFormModal
            loan={selectedLoan}
            onClose={() => {
              setShowForm(false)
              setSelectedLoan(null)
            }}
            onSubmit={async (data) => {
              if (selectedLoan) {
                await editLoan(selectedLoan.id, data)
              } else {
                await addLoan(data as CreateLoanInput)
              }
              setShowForm(false)
              setSelectedLoan(null)
            }}
          />
        )}

        {/* Modal de pago */}
        {showPaymentModal && paymentLoan && (
          <PaymentModal
            loan={paymentLoan}
            onClose={() => {
              setShowPaymentModal(false)
              setPaymentLoan(null)
            }}
            onSubmit={async (amount, isExtra, notes) => {
              await makePayment({
                loan_id: paymentLoan.id,
                amount,
                is_extra_payment: isExtra,
                notes
              })
              setShowPaymentModal(false)
              setPaymentLoan(null)
            }}
          />
        )}
      </div>
    </TierGate>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function EmptyState({ onAddLoan }: { onAddLoan: () => void }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
      <span className="text-4xl mb-4 block">💳</span>
      <h3 className="font-semibold text-gray-900 mb-2">Sin préstamos</h3>
      <p className="text-gray-500 mb-4">
        Agrega tus préstamos para optimizar tu estrategia de pago
      </p>
      <NeuButton variant="primary" onClick={onAddLoan}>
        Agregar primer préstamo
      </NeuButton>
    </div>
  )
}

function LoanFormModal({
  loan,
  onClose,
  onSubmit
}: {
  loan: Loan | null
  onClose: () => void
  onSubmit: (data: Partial<CreateLoanInput>) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: loan?.name || '',
    lender: loan?.lender || '',
    loan_type: loan?.loan_type || 'personal',
    original_amount: loan?.original_amount || 0,
    current_balance: loan?.current_balance || 0,
    interest_rate: loan ? loan.interest_rate * 100 : 0,
    minimum_payment: loan?.minimum_payment || 0,
    start_date: loan?.start_date || new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        interest_rate: formData.interest_rate / 100
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {loan ? 'Editar préstamo' : 'Nuevo préstamo'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prestamista</label>
              <input
                type="text"
                value={formData.lender}
                onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="personal">Personal</option>
                <option value="auto">Automotriz</option>
                <option value="mortgage">Hipotecario</option>
                <option value="student">Estudiantil</option>
                <option value="business">Empresarial</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto original</label>
                <input
                  type="number"
                  value={formData.original_amount || ''}
                  onChange={(e) => setFormData({ ...formData, original_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Balance actual</label>
                <input
                  type="number"
                  value={formData.current_balance || ''}
                  onChange={(e) => setFormData({ ...formData, current_balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de interés (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interest_rate || ''}
                  onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pago mensual</label>
                <input
                  type="number"
                  value={formData.minimum_payment || ''}
                  onChange={(e) => setFormData({ ...formData, minimum_payment: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <NeuButton
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </NeuButton>
              <NeuButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Guardando...' : loan ? 'Guardar' : 'Crear'}
              </NeuButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({
  loan,
  onClose,
  onSubmit
}: {
  loan: Loan
  onClose: () => void
  onSubmit: (amount: number, isExtra: boolean, notes?: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(loan.minimum_payment)
  const [isExtra, setIsExtra] = useState(false)
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(amount, isExtra, notes || undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registrar pago</h2>
          <p className="text-gray-500 mb-4">{loan.name}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto del pago</label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Pago mínimo: ${loan.minimum_payment.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isExtra"
                checked={isExtra}
                onChange={(e) => setIsExtra(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isExtra" className="text-sm text-gray-700">
                Es un pago extra (adicional al mínimo)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Bono de trabajo"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <NeuButton
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </NeuButton>
              <NeuButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Guardando...' : 'Registrar pago'}
              </NeuButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
