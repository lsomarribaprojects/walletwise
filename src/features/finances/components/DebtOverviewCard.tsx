'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, TrendingDown, AlertTriangle, ChevronRight } from 'lucide-react'
import { NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'
import { getCreditCards } from '../services/creditCardsService'
import { calculateCreditCardMetrics, getUtilizationColor, getUtilizationLevel } from '../services/debtCalculator'
import type { CreditCard as CreditCardType, CreditCardMetrics } from '../types/creditCards'

export function DebtOverviewCard() {
  const { t } = useLanguage()
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [metrics, setMetrics] = useState<CreditCardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCreditCards()
        const activeCards = data.filter(c => c.activa)
        setCards(activeCards)
        if (activeCards.length > 0) {
          setMetrics(calculateCreditCardMetrics(activeCards))
        }
      } catch (err) {
        console.error('Error loading credit cards:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

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
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </NeuCard>
    )
  }

  // No cards - show prompt to add
  if (cards.length === 0) {
    return (
      <NeuCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">{t.debt.creditCards}</h3>
              <p className="text-sm text-gray-500">{t.debt.manageDebt}</p>
            </div>
          </div>
          <Link
            href="/finances/credit-cards"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            {t.debt.addCard}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </NeuCard>
    )
  }

  // Has cards - show summary
  const utilizationColor = getUtilizationColor(metrics?.utilizacion_promedio || 0)
  const utilizationLevel = getUtilizationLevel(metrics?.utilizacion_promedio || 0)

  return (
    <NeuCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">{t.debt.title}</h3>
            <p className="text-sm text-gray-500">
              {cards.length} {cards.length !== 1 ? t.debt.cards : t.debt.card}
            </p>
          </div>
        </div>
        <Link
          href="/finances/credit-cards"
          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          {t.debt.viewDetails}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {metrics && (
        <div className="space-y-4">
          {/* Main debt amount */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">
              {formatCurrency(metrics.deuda_total)}
            </span>
            <span className="text-sm text-gray-500">
              {t.debt.of} {formatCurrency(metrics.limite_total)}
            </span>
          </div>

          {/* Utilization bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">{t.debt.creditUtilization}</span>
              <span style={{ color: utilizationColor }} className="font-medium">
                {metrics.utilizacion_promedio.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(metrics.utilizacion_promedio, 100)}%`,
                  backgroundColor: utilizationColor,
                }}
              />
            </div>
            {utilizationLevel === 'danger' && (
              <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>{t.debt.highUtilizationWarning}</span>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">{t.debt.avgRate}</p>
              <p className="text-sm font-semibold text-gray-700">
                {metrics.tasa_promedio_ponderada.toFixed(1)}% APR
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t.debt.monthlyInterest}</p>
              <p className="text-sm font-semibold text-orange-500">
                {formatCurrency(metrics.intereses_mensuales_proyectados)}
              </p>
            </div>
          </div>
        </div>
      )}
    </NeuCard>
  )
}
