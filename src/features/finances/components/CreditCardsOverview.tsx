'use client'

import { useState } from 'react'
import { CreditCard as CreditCardIcon, Plus, Edit2, Trash2, Percent, Calendar } from 'lucide-react'
import { NeuCard, NeuButton } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'
import { CreditCardModal } from './CreditCardModal'
import type { CreditCard, CreditCardInput } from '../types/creditCards'
import { getUtilizationColor, getUtilizationLevel } from '../services/debtCalculator'

interface CreditCardsOverviewProps {
  cards: CreditCard[]
  onAdd: (card: CreditCardInput) => Promise<void>
  onUpdate: (id: string, card: CreditCardInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

export function CreditCardsOverview({
  cards,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: CreditCardsOverviewProps) {
  const { t } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSave = async (cardInput: CreditCardInput) => {
    if (editingCard) {
      await onUpdate(editingCard.id, cardInput)
    } else {
      await onAdd(cardInput)
    }
    setEditingCard(null)
  }

  const handleEdit = (card: CreditCard) => {
    setEditingCard(card)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (deletingId === id) {
      await onDelete(id)
      setDeletingId(null)
    } else {
      setDeletingId(id)
      setTimeout(() => setDeletingId(null), 3000)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCard(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <NeuCard>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </NeuCard>
    )
  }

  return (
    <>
      <NeuCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CreditCardIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-700">{t.debt.creditCards}</h2>
              <p className="text-sm text-gray-500">
                {cards.length} {cards.length !== 1 ? t.debt.cards : t.debt.card} {t.debt.registered}
              </p>
            </div>
          </div>
          <NeuButton
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t.debt.addCard}
          </NeuButton>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">{t.debt.noCards}</p>
            <NeuButton variant="secondary" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {t.debt.addFirst}
            </NeuButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => {
              const utilizacion = (card.saldo_actual / card.limite_credito) * 100
              const utilizationColor = getUtilizationColor(utilizacion)
              const utilizationLevel = getUtilizationLevel(utilizacion)

              return (
                <div
                  key={card.id}
                  className="relative p-4 rounded-xl bg-neu-bg shadow-neu overflow-hidden"
                >
                  {/* Color bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: card.color || '#9333EA' }}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 pt-2">
                    <div>
                      <h3 className="font-semibold text-gray-700">{card.nombre}</h3>
                      {card.banco && (
                        <p className="text-xs text-gray-500">{card.banco}</p>
                      )}
                      {card.ultimos_digitos && (
                        <p className="text-xs text-gray-400">****{card.ultimos_digitos}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t.debt.edit}
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          deletingId === card.id
                            ? 'bg-red-100 text-red-600'
                            : 'hover:bg-gray-100 text-gray-400'
                        }`}
                        title={deletingId === card.id ? t.debt.clickConfirm : t.debt.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Saldo y límite */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">{t.debt.debt}</span>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(card.saldo_actual)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>{t.debt.limit}: {formatCurrency(card.limite_credito)}</span>
                      <span style={{ color: utilizationColor }}>
                        {utilizacion.toFixed(0)}% {t.debt.used}
                      </span>
                    </div>
                    {/* Barra de utilización */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(utilizacion, 100)}%`,
                          backgroundColor: utilizationColor,
                        }}
                      />
                    </div>
                    {utilizationLevel === 'danger' && (
                      <p className="text-xs text-red-500 mt-1">
                        {t.debt.highUtilization}
                      </p>
                    )}
                  </div>

                  {/* Info adicional */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      <span>{card.tasa_interes_anual}% {t.debt.apr}</span>
                    </div>
                    {card.fecha_pago && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{t.debt.payDay} {card.fecha_pago}</span>
                      </div>
                    )}
                  </div>

                  {/* Pago mínimo */}
                  {card.pago_minimo && card.pago_minimo > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {t.debt.minPaymentLabel}: <span className="font-medium">{formatCurrency(card.pago_minimo)}</span>
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </NeuCard>

      <CreditCardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editCard={editingCard}
      />
    </>
  )
}
