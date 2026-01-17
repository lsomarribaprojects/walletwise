'use client'

import { useState, useEffect } from 'react'
import { Budget, CreateBudgetInput, BudgetPeriod } from '../types'
import { NeuButton } from '@/shared/components/ui'
import { fetchCategories } from '../services/budgetService'

interface Category {
  id: string
  name: string
  type: string
}

interface BudgetFormProps {
  budget?: Budget
  onSubmit: (data: CreateBudgetInput) => Promise<void>
  onCancel: () => void
}

export function BudgetForm({ budget, onSubmit, onCancel }: BudgetFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: budget?.category_id || '',
    name: budget?.name || '',
    amount: budget?.amount || 0,
    period: budget?.period || 'monthly',
    start_date: budget?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    alert_threshold: budget?.alert_threshold || 80,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting budget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'alert_threshold' ? Number(value) : value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {budget ? 'Editar Presupuesto' : 'Crear Presupuesto'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre del presupuesto
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Presupuesto mensual comida"
            />
          </div>

          {/* Categoría */}
          <div>
            <label
              htmlFor="category_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Categoría
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'expense' ? 'Gasto' : 'Ingreso'})
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Monto del presupuesto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Período */}
          <div>
            <label
              htmlFor="period"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Período
            </label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
            </select>
          </div>

          {/* Fecha de inicio */}
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Fecha de inicio
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Umbral de alerta */}
          <div>
            <label
              htmlFor="alert_threshold"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Umbral de alerta ({formData.alert_threshold}%)
            </label>
            <input
              type="range"
              id="alert_threshold"
              name="alert_threshold"
              value={formData.alert_threshold}
              onChange={handleChange}
              min="50"
              max="100"
              step="5"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <NeuButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </NeuButton>
            <NeuButton
              type="submit"
              variant="solid"
              className="flex-1"
              isLoading={isLoading}
            >
              {budget ? 'Actualizar' : 'Crear'}
            </NeuButton>
          </div>
        </form>
      </div>
    </div>
  )
}
