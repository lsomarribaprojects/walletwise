'use client'

import { useEffect, useCallback, useState } from 'react'
import { ArrowLeft, Plus, CreditCard as CreditCardIcon } from 'lucide-react'
import Link from 'next/link'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { useFinancesStore } from '@/features/finances/store/financesStore'
import { CreditCardsOverview } from '@/features/finances/components/CreditCardsOverview'
import { DebtSummaryPanel } from '@/features/finances/components/DebtSummaryPanel'
import { DebtPaymentPlanView } from '@/features/finances/components/DebtPaymentPlanView'
import { CreditCardModal } from '@/features/finances/components/CreditCardModal'
import { getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from '@/features/finances/services/creditCardsService'
import { useLanguage } from '@/shared/i18n'
import type { CreditCardInput } from '@/features/finances/types/creditCards'

export default function CreditCardsPage() {
  const { t } = useLanguage()
  const {
    creditCards,
    creditCardMetrics,
    isLoading,
    setCreditCards,
    addCreditCard: addToStore,
    updateCreditCard: updateInStore,
    removeCreditCard,
    setLoading,
    setError,
  } = useFinancesStore()

  const [showEmptyModal, setShowEmptyModal] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCreditCards()
      setCreditCards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading cards')
    } finally {
      setLoading(false)
    }
  }, [setCreditCards, setLoading, setError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddCard = async (input: CreditCardInput) => {
    const newCard = await createCreditCard(input)
    addToStore(newCard)
  }

  const handleUpdateCard = async (id: string, input: CreditCardInput) => {
    const updated = await updateCreditCard(id, input)
    updateInStore(id, updated)
  }

  const handleDeleteCard = async (id: string) => {
    await deleteCreditCard(id)
    removeCreditCard(id)
  }

  const handleEmptyStateAdd = async (input: CreditCardInput) => {
    const newCard = await createCreditCard(input)
    addToStore(newCard)
    setShowEmptyModal(false)
  }

  const activeCards = creditCards.filter(c => c.activa)
  const hasCards = activeCards.length > 0

  return (
    <div className="min-h-screen bg-neu-bg p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <NeuButton variant="icon" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </NeuButton>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t.debt.creditCards}</h1>
              <p className="text-gray-500">{t.debt.managePlans}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-neu-bg shadow-neu rounded-2xl p-8 text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasCards && (
          <div className="bg-neu-bg shadow-neu rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t.debt.noCardsRegistered}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {t.debt.addCardsHelp}
            </p>
            <NeuButton onClick={() => setShowEmptyModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t.debt.addFirstCard}
            </NeuButton>

            {/* Modal para estado vacio */}
            <CreditCardModal
              isOpen={showEmptyModal}
              onClose={() => setShowEmptyModal(false)}
              onSave={handleEmptyStateAdd}
              editCard={null}
            />
          </div>
        )}

        {/* Content when cards exist */}
        {!isLoading && hasCards && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Cards Overview */}
            <div className="lg:col-span-2 space-y-6">
              <CreditCardsOverview
                cards={activeCards}
                onAdd={handleAddCard}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
                isLoading={isLoading}
              />
            </div>

            {/* Right Column: Summary and Plan */}
            <div className="space-y-6">
              <DebtSummaryPanel metrics={creditCardMetrics} />
              <DebtPaymentPlanView cards={activeCards} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
