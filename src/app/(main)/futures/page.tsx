'use client'

import { useState, useMemo } from 'react'
import { TierGate } from '@/features/subscriptions'
import { useLoans } from '@/features/loans'
import {
  DebtFreedomProjector,
  EmergencyFundCalculator,
  projectDebtFreedom,
  simulateScenario,
  createQuickScenario
} from '@/features/futures'
import type { WhatIfScenario, WhatIfResult } from '@/features/futures'
import { NeuButton } from '@/shared/components/ui'

export default function FuturesPage() {
  const { loans, summary, isLoading } = useLoans()
  const [activeTab, setActiveTab] = useState<'projector' | 'whatif' | 'emergency'>('projector')
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [scenarioResults, setScenarioResults] = useState<Map<string, WhatIfResult>>(new Map())

  // Calcular presupuesto por defecto
  const defaultBudget = useMemo(() => {
    return loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + l.minimum_payment, 0)
  }, [loans])

  // Proyección de libertad financiera
  const projection = useMemo(() => {
    const activeLoans = loans.filter(l => l.status === 'active')
    if (activeLoans.length === 0) return null
    const budget = monthlyBudget || defaultBudget
    return projectDebtFreedom(activeLoans, budget, 'avalanche')
  }, [loans, monthlyBudget, defaultBudget])

  // Simular escenario
  const handleSimulateScenario = (scenario: WhatIfScenario) => {
    const activeLoans = loans.filter(l => l.status === 'active')
    if (activeLoans.length === 0) return

    const budget = monthlyBudget || defaultBudget
    const result = simulateScenario(activeLoans, budget, scenario, 'avalanche')

    setScenarioResults(prev => new Map(prev).set(scenario.id, result))
  }

  // Quick scenarios
  const quickScenarios = [
    createQuickScenario('extra_100'),
    createQuickScenario('extra_500'),
    createQuickScenario('bonus'),
    createQuickScenario('refinance_5')
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando módulo Futuros...</div>
      </div>
    )
  }

  return (
    <TierGate feature="futures_module" blur>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🔮 Módulo Futuros
            </h1>
            <p className="text-gray-500 mt-1">
              Proyecta tu camino hacia la libertad financiera
            </p>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <TabButton
              active={activeTab === 'projector'}
              onClick={() => setActiveTab('projector')}
              icon="📊"
              label="Proyector de Deuda"
            />
            <TabButton
              active={activeTab === 'whatif'}
              onClick={() => setActiveTab('whatif')}
              icon="🔄"
              label="Simulador What-If"
            />
            <TabButton
              active={activeTab === 'emergency'}
              onClick={() => setActiveTab('emergency')}
              icon="🛡️"
              label="Fondo de Emergencia"
            />
          </div>

          {/* Content */}
          {activeTab === 'projector' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Presupuesto */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Presupuesto mensual</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    ¿Cuánto puedes destinar a pagar deudas cada mes?
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={monthlyBudget || defaultBudget || ''}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder={defaultBudget.toString()}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Mínimo requerido: ${defaultBudget.toLocaleString()}
                  </p>
                </div>

                {/* Resumen de deudas */}
                {summary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Resumen de deudas</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deuda total</span>
                        <span className="font-medium text-red-600">
                          ${summary.total_debt.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Préstamos activos</span>
                        <span className="font-medium">{summary.active_loans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tasa promedio</span>
                        <span className="font-medium">{summary.average_interest_rate}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Proyector */}
              <div className="lg:col-span-2">
                {projection ? (
                  <DebtFreedomProjector projection={projection} />
                ) : (
                  <EmptyState
                    icon="📊"
                    title="Sin préstamos activos"
                    description="Agrega préstamos para ver tu proyección hacia la libertad financiera."
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'whatif' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Escenarios rápidos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Escenarios rápidos</h3>
                <div className="space-y-3">
                  {quickScenarios.map((scenario) => {
                    const result = scenarioResults.get(scenario.id)
                    return (
                      <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        result={result}
                        onSimulate={() => handleSimulateScenario(scenario)}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Resultados */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Comparación de escenarios</h3>
                {scenarioResults.size > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="space-y-4">
                      {Array.from(scenarioResults.entries()).map(([id, result]) => {
                        const scenario = quickScenarios.find(s => s.id === id)
                        return (
                          <div key={id} className="pb-4 border-b border-gray-100 last:border-0">
                            <p className="font-medium text-gray-900">{scenario?.name}</p>
                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Meses ahorrados</p>
                                <p className={`font-semibold ${result.monthsSaved > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                  {result.monthsSaved > 0 ? '+' : ''}{result.monthsSaved}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Interés ahorrado</p>
                                <p className={`font-semibold ${result.interestSaved > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                  ${result.interestSaved.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Impacto</p>
                                <p className="font-semibold text-gray-900">{result.impactScore}/10</p>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{result.recommendation}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="🔄"
                    title="Sin simulaciones"
                    description="Haz clic en 'Simular' en algún escenario para ver los resultados."
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="max-w-2xl mx-auto">
              <EmergencyFundCalculator
                initialExpenses={summary?.monthly_payments || 0}
              />
            </div>
          )}
        </div>
      </div>
    </TierGate>
  )
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function ScenarioCard({
  scenario,
  result,
  onSimulate
}: {
  scenario: WhatIfScenario
  result?: WhatIfResult
  onSimulate: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{scenario.name}</p>
          <p className="text-sm text-gray-500">
            {getScenarioDescription(scenario)}
          </p>
        </div>
        <NeuButton
          variant={result ? 'secondary' : 'primary'}
          onClick={onSimulate}
          className="text-sm"
        >
          {result ? 'Re-simular' : 'Simular'}
        </NeuButton>
      </div>

      {result && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {result.monthsSaved > 0 && (
              <span className="text-sm text-green-600 font-medium">
                -{result.monthsSaved} meses
              </span>
            )}
            {result.interestSaved > 0 && (
              <span className="text-sm text-green-600 font-medium">
                -${result.interestSaved.toLocaleString()} interés
              </span>
            )}
            <span className="text-sm text-gray-500">
              Impacto: {result.impactScore}/10
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function getScenarioDescription(scenario: WhatIfScenario): string {
  switch (scenario.type) {
    case 'extra_payment':
      return `Pagar $${scenario.parameters.extraMonthlyPayment} adicionales cada mes`
    case 'lump_sum_payment':
      return `Aplicar $${scenario.parameters.lumpSumAmount} de golpe a la deuda`
    case 'refinance':
      return `Refinanciar a ${(scenario.parameters.newInterestRate! * 100).toFixed(1)}% de interés`
    default:
      return 'Escenario personalizado'
  }
}

function EmptyState({
  icon,
  title,
  description
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}
