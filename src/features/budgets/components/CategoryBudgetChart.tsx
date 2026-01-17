'use client'

import { useEffect, useState } from 'react'
import { NeuCard } from '@/shared/components/ui'
import { getCategoryBudgets } from '../services/budgetService'
import { CategoryBudget } from '../types'

export function CategoryBudgetChart() {
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCategoryBudgets()
  }, [])

  const loadCategoryBudgets = async () => {
    try {
      setIsLoading(true)
      const data = await getCategoryBudgets()
      setCategoryBudgets(data)
    } catch (error) {
      console.error('Error loading category budgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <NeuCard className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </NeuCard>
    )
  }

  if (categoryBudgets.length === 0) {
    return (
      <NeuCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Presupuestos por Categoría
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">
            No hay datos de presupuestos por categoría
          </p>
        </div>
      </NeuCard>
    )
  }

  const maxBudget = Math.max(...categoryBudgets.map((c) => c.budgeted))

  return (
    <NeuCard className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Presupuestos por Categoría
      </h3>

      <div className="space-y-4">
        {categoryBudgets.map((category) => {
          const widthPercentage = (category.budgeted / maxBudget) * 100

          return (
            <div key={category.category_id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.category_color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {category.category_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-800">
                    ${category.spent.toFixed(0)} / ${category.budgeted.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="relative">
                {/* Background bar */}
                <div
                  className="h-8 bg-gray-100 rounded-lg overflow-hidden"
                  style={{ width: `${widthPercentage}%` }}
                >
                  {/* Spent bar */}
                  <div
                    className={`h-full transition-all duration-300 ${
                      category.percentage > 100
                        ? 'bg-red-500'
                        : category.percentage > 90
                        ? 'bg-orange-500'
                        : category.percentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(category.percentage, 100)}%`,
                    }}
                  />
                </div>

                {/* Percentage label */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <span
                    className={`text-xs font-bold ${
                      category.percentage > 100
                        ? 'text-red-700'
                        : category.percentage > 90
                        ? 'text-orange-700'
                        : category.percentage > 75
                        ? 'text-yellow-700'
                        : 'text-green-700'
                    }`}
                  >
                    {category.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Saludable (0-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Cuidado (76-90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">Alerta (91-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Excedido (&gt;100%)</span>
        </div>
      </div>
    </NeuCard>
  )
}
