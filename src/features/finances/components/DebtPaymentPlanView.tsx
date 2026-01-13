'use client'

import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Zap, Snowflake, CheckCircle, AlertCircle } from 'lucide-react'
import { NeuCard, NeuButton, NeuInput } from '@/shared/components/ui'
import type { CreditCard, DebtPaymentStrategy, StrategyComparison } from '../types/creditCards'
import { compareStrategies } from '../services/debtCalculator'

interface DebtPaymentPlanViewProps {
  cards: CreditCard[]
}

export function DebtPaymentPlanView({ cards }: DebtPaymentPlanViewProps) {
  const [pagoMensual, setPagoMensual] = useState<number>(0)
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState<DebtPaymentStrategy>('avalancha')

  const activeCards = cards.filter(c => c.activa && c.saldo_actual > 0)

  const pagoMinimoTotal = useMemo(() => {
    return activeCards.reduce((sum, c) => sum + (c.pago_minimo || c.saldo_actual * 0.03), 0)
  }, [activeCards])

  const comparison = useMemo<StrategyComparison | null>(() => {
    if (activeCards.length === 0 || pagoMensual <= 0) return null
    return compareStrategies(activeCards, pagoMensual)
  }, [activeCards, pagoMensual])

  const planActual = comparison
    ? estrategiaSeleccionada === 'avalancha'
      ? comparison.avalancha
      : comparison.bola_de_nieve
    : null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (activeCards.length === 0) {
    return (
      <NeuCard>
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay deuda en tarjetas para planificar</p>
        </div>
      </NeuCard>
    )
  }

  return (
    <NeuCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-100">
          <Calculator className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Plan de Pago de Deuda</h2>
          <p className="text-sm text-gray-500">Calcula la mejor estrategia para liquidar tus tarjetas</p>
        </div>
      </div>

      {/* Input de pago mensual */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          ¿Cuanto puedes pagar mensualmente a tus tarjetas?
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <NeuInput
              type="number"
              min={0}
              placeholder={`Minimo ${formatCurrency(pagoMinimoTotal)}`}
              className="pl-7"
              value={pagoMensual || ''}
              onChange={(e) => setPagoMensual(parseFloat(e.target.value) || 0)}
            />
          </div>
          <NeuButton
            variant="secondary"
            onClick={() => setPagoMensual(pagoMinimoTotal)}
          >
            Usar minimo
          </NeuButton>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Pago minimo requerido: {formatCurrency(pagoMinimoTotal)}
        </p>
      </div>

      {pagoMensual > 0 && pagoMensual < pagoMinimoTotal && (
        <div className="mb-6 p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Pago insuficiente</p>
            <p className="text-xs text-red-600">
              Debes pagar al menos {formatCurrency(pagoMinimoTotal)} para cubrir los pagos minimos
            </p>
          </div>
        </div>
      )}

      {comparison && pagoMensual >= pagoMinimoTotal && (
        <>
          {/* Selector de estrategia */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Estrategia de pago
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Avalancha */}
              <button
                onClick={() => setEstrategiaSeleccionada('avalancha')}
                className={`p-4 rounded-xl text-left transition-all ${
                  estrategiaSeleccionada === 'avalancha'
                    ? 'bg-purple-100 ring-2 ring-purple-500'
                    : 'bg-neu-bg shadow-neu hover:shadow-neu-inset'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${estrategiaSeleccionada === 'avalancha' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-700">Avalancha</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Paga primero la tarjeta con mayor tasa de interes
                </p>
                <div className="text-sm">
                  <span className="text-gray-600">Intereses: </span>
                  <span className="font-medium text-purple-600">
                    {formatCurrency(comparison.avalancha.resumen.intereses_totales)}
                  </span>
                </div>
                {comparison.ahorro_avalancha > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Ahorras {formatCurrency(comparison.ahorro_avalancha)}
                  </p>
                )}
              </button>

              {/* Bola de Nieve */}
              <button
                onClick={() => setEstrategiaSeleccionada('bola_de_nieve')}
                className={`p-4 rounded-xl text-left transition-all ${
                  estrategiaSeleccionada === 'bola_de_nieve'
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-neu-bg shadow-neu hover:shadow-neu-inset'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Snowflake className={`w-5 h-5 ${estrategiaSeleccionada === 'bola_de_nieve' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-gray-700">Bola de Nieve</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Paga primero la tarjeta con menor saldo
                </p>
                <div className="text-sm">
                  <span className="text-gray-600">Intereses: </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(comparison.bola_de_nieve.resumen.intereses_totales)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Victorias rapidas para motivacion
                </p>
              </button>
            </div>
          </div>

          {/* Recomendación */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700">{comparison.recomendacion}</p>
          </div>

          {/* Resumen del plan */}
          {planActual && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Resumen del Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-neu-bg shadow-neu-inset rounded-lg">
                  <p className="text-xs text-gray-500">Deuda Total</p>
                  <p className="text-lg font-bold text-gray-700">
                    {formatCurrency(planActual.resumen.deuda_total)}
                  </p>
                </div>
                <div className="p-3 bg-neu-bg shadow-neu-inset rounded-lg">
                  <p className="text-xs text-gray-500">Tiempo</p>
                  <p className="text-lg font-bold text-gray-700">
                    {planActual.resumen.meses_totales} meses
                  </p>
                </div>
                <div className="p-3 bg-neu-bg shadow-neu-inset rounded-lg">
                  <p className="text-xs text-gray-500">Intereses</p>
                  <p className="text-lg font-bold text-red-500">
                    {formatCurrency(planActual.resumen.intereses_totales)}
                  </p>
                </div>
                <div className="p-3 bg-neu-bg shadow-neu-inset rounded-lg">
                  <p className="text-xs text-gray-500">Ahorro vs minimos</p>
                  <p className="text-lg font-bold text-green-500">
                    {formatCurrency(planActual.resumen.ahorro_vs_minimos)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Orden de pago */}
          {planActual && planActual.tarjetas.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Orden de Pago</h3>
              <div className="space-y-3">
                {planActual.tarjetas.map((item, index) => (
                  <div
                    key={item.tarjeta_id}
                    className={`p-4 rounded-xl ${
                      index === 0
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-neu-bg shadow-neu-inset'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{item.nombre}</p>
                          {item.banco && (
                            <p className="text-xs text-gray-500">{item.banco}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-700">
                          {formatCurrency(item.pago_sugerido)}/mes
                        </p>
                        {index === 0 && (
                          <p className="text-xs text-green-600">Prioridad</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Saldo:</span>
                        <span className="ml-1 font-medium">{formatCurrency(item.saldo_actual)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">APR:</span>
                        <span className="ml-1 font-medium">{item.tasa_interes}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Liquidas en:</span>
                        <span className="ml-1 font-medium">{item.meses_para_liquidar} meses</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 font-medium">Consejo del CFO</p>
              <p className="text-xs text-blue-600 mt-1">
                Cuando liquides la primera tarjeta, agrega ese pago a la siguiente.
                Esto acelera el pago de toda la deuda.
              </p>
            </div>
          </div>
        </>
      )}
    </NeuCard>
  )
}
