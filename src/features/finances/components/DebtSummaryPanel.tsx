'use client'

import { TrendingDown, Percent, DollarSign, CreditCard, AlertTriangle, Info } from 'lucide-react'
import { NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'
import type { CreditCardMetrics } from '../types/creditCards'
import { getUtilizationInfo } from '../services/debtCalculator'

interface DebtSummaryPanelProps {
  metrics: CreditCardMetrics
}

export function DebtSummaryPanel({ metrics }: DebtSummaryPanelProps) {
  const { t } = useLanguage()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const utilizationInfo = getUtilizationInfo(metrics.utilizacion_promedio)

  const kpis = [
    {
      label: t.debt.debtTotal,
      value: formatCurrency(metrics.deuda_total),
      icon: DollarSign,
      color: metrics.deuda_total > 0 ? 'text-red-500' : 'text-green-500',
      bgColor: metrics.deuda_total > 0 ? 'bg-red-100' : 'bg-green-100',
    },
    {
      label: t.debt.utilization,
      value: `${metrics.utilizacion_promedio.toFixed(1)}%`,
      icon: Percent,
      color: utilizationInfo.level === 'danger' ? 'text-red-500' :
             utilizationInfo.level === 'warning' ? 'text-amber-500' :
             utilizationInfo.level === 'excellent' ? 'text-green-500' : 'text-blue-500',
      bgColor: utilizationInfo.level === 'danger' ? 'bg-red-100' :
               utilizationInfo.level === 'warning' ? 'bg-amber-100' :
               utilizationInfo.level === 'excellent' ? 'bg-green-100' : 'bg-blue-100',
      extra: utilizationInfo.level === 'danger' || utilizationInfo.level === 'warning'
        ? t.debt.highAffectsScore : null,
    },
    {
      label: t.debt.avgRate,
      value: `${metrics.tasa_promedio_ponderada.toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      extra: t.debt.weightedAPR,
    },
    {
      label: t.debt.monthlyInterest,
      value: formatCurrency(metrics.intereses_mensuales_proyectados),
      icon: AlertTriangle,
      color: metrics.intereses_mensuales_proyectados > 1000 ? 'text-orange-500' : 'text-gray-500',
      bgColor: metrics.intereses_mensuales_proyectados > 1000 ? 'bg-orange-100' : 'bg-gray-100',
      extra: t.debt.projected,
    },
  ]

  if (metrics.num_tarjetas === 0) {
    return (
      <NeuCard>
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t.debt.addCardsToSee}</p>
        </div>
      </NeuCard>
    )
  }

  return (
    <NeuCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-100">
          <TrendingDown className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700">{t.debt.debtSummary}</h2>
          <p className="text-sm text-gray-500">
            {metrics.num_tarjetas} {metrics.num_tarjetas !== 1 ? t.debt.cards : t.debt.card} {t.debt.withBalance}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-3 rounded-xl bg-neu-bg shadow-neu-inset">
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${kpi.bgColor} shrink-0`}>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              <span className="text-xs text-gray-500 truncate">{kpi.label}</span>
            </div>
            <p className={`text-lg font-bold ${kpi.color} truncate`}>{kpi.value}</p>
            {kpi.extra && (
              <p className="text-xs text-gray-400 truncate">{kpi.extra}</p>
            )}
          </div>
        ))}
      </div>

      {/* Barra de utilización general mejorada */}
      <div className="p-4 rounded-xl" style={{ backgroundColor: utilizationInfo.bgColor }}>
        {/* Header con porcentaje prominente */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t.debt.creditUsed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: utilizationInfo.color }}
            >
              {metrics.utilizacion_promedio.toFixed(0)}%
            </span>
            <span className="text-sm text-gray-500">{t.debt.used || 'utilizado'}</span>
          </div>
        </div>

        {/* Montos */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            {formatCurrency(metrics.deuda_total)} / {formatCurrency(metrics.limite_total)}
          </span>
        </div>

        {/* Barra de progreso con marcadores de referencia */}
        <div className="relative">
          <div className="h-4 bg-white/60 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(metrics.utilizacion_promedio, 100)}%`,
                backgroundColor: utilizationInfo.color,
              }}
            />
          </div>
          {/* Marcadores de rangos bancarios */}
          <div className="absolute top-0 left-0 w-full h-4 pointer-events-none">
            <div className="absolute left-[10%] top-0 h-full w-0.5 bg-gray-300/50" title="10%" />
            <div className="absolute left-[30%] top-0 h-full w-0.5 bg-gray-300/50" title="30%" />
            <div className="absolute left-[50%] top-0 h-full w-0.5 bg-gray-300/50" title="50%" />
          </div>
        </div>

        {/* Escala con rangos de referencia */}
        <div className="flex justify-between text-xs mt-2">
          <span className="text-green-600 font-medium">0%</span>
          <span className="text-green-600">10%</span>
          <span className="text-blue-600">30%</span>
          <span className="text-amber-600">50%</span>
          <span className="text-red-600 font-medium">100%</span>
        </div>

        {/* Indicador de estado */}
        <div
          className="mt-3 flex items-center gap-2 p-2 rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
        >
          <Info className="w-4 h-4" style={{ color: utilizationInfo.color }} />
          <span className="text-xs font-medium" style={{ color: utilizationInfo.textColor }}>
            {utilizationInfo.level === 'excellent' && (t.debt.excellentScore || 'Excelente para tu score crediticio')}
            {utilizationInfo.level === 'good' && (t.debt.goodScore || 'Rango saludable')}
            {utilizationInfo.level === 'warning' && (t.debt.warningScore || 'Puede afectar tu score crediticio')}
            {utilizationInfo.level === 'danger' && (t.debt.dangerScore || 'Afecta negativamente tu score')}
          </span>
        </div>

        {/* Recomendación para alcanzar el rango óptimo */}
        {utilizationInfo.level !== 'excellent' && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">{t.debt.recommendation || 'Recomendación'}:</span>{' '}
            {t.debt.reduceToTen || 'Reduce tu utilización a menos del 10% para maximizar tu score crediticio.'}
          </div>
        )}
      </div>

      {/* Pago mínimo total */}
      {metrics.pago_minimo_total > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>{t.debt.minPayment}:</strong> {formatCurrency(metrics.pago_minimo_total)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {t.debt.minPaymentWarning} {formatCurrency(metrics.intereses_mensuales_proyectados * 12)} {t.debt.yearInInterest}
          </p>
        </div>
      )}
    </NeuCard>
  )
}
