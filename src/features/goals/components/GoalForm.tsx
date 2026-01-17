'use client'

import { useState } from 'react'
import { GoalFormData, GoalType, GOAL_TYPE_CONFIG } from '../types'
import { NeuButton, NeuInput, NeuCard } from '@/shared/components/ui'

interface GoalFormProps {
  initialData?: Partial<GoalFormData>
  onSubmit: (data: GoalFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const ICON_OPTIONS = ['🎯', '💰', '💳', '🛡️', '🛒', '📈', '🏖️', '🏠', '🚗', '✈️', '💎', '🎓']
const COLOR_OPTIONS = ['#22C55E', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1']

export function GoalForm({ initialData, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    goal_type: initialData?.goal_type || 'savings',
    target_amount: initialData?.target_amount || 0,
    target_date: initialData?.target_date || '',
    priority: initialData?.priority || 3,
    icon: initialData?.icon || '🎯',
    color: initialData?.color || '#3B82F6',
    linked_account_id: initialData?.linked_account_id,
    auto_track: initialData?.auto_track || false,
    monthly_contribution: initialData?.monthly_contribution,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: keyof GoalFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la meta *
        </label>
        <NeuInput
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej: Fondo de emergencia"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripcion
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descripcion opcional..."
          className="w-full px-4 py-3 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          rows={3}
        />
      </div>

      {/* Goal Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de meta *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(GOAL_TYPE_CONFIG) as GoalType[]).map((type) => {
            const config = GOAL_TYPE_CONFIG[type]
            const isSelected = formData.goal_type === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  handleChange('goal_type', type)
                  handleChange('icon', config.icon)
                  handleChange('color', config.color)
                }}
                className={`
                  p-3 rounded-xl text-center transition-all
                  ${isSelected
                    ? 'shadow-neu-inset bg-blue-50 border-2 border-blue-400'
                    : 'shadow-neu hover:shadow-neu-sm bg-neu-bg'
                  }
                `}
              >
                <span className="text-2xl">{config.icon}</span>
                <p className="text-xs mt-1 text-gray-600">{config.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Target Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto objetivo *
        </label>
        <NeuInput
          type="number"
          value={formData.target_amount || ''}
          onChange={(e) => handleChange('target_amount', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Target Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha objetivo (opcional)
        </label>
        <NeuInput
          type="date"
          value={formData.target_date || ''}
          onChange={(e) => handleChange('target_date', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Monthly Contribution */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contribucion mensual planificada (opcional)
        </label>
        <NeuInput
          type="number"
          value={formData.monthly_contribution || ''}
          onChange={(e) => handleChange('monthly_contribution', parseFloat(e.target.value) || undefined)}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prioridad
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleChange('priority', star)}
              className={`text-2xl transition-transform hover:scale-110 ${
                star <= formData.priority ? 'text-yellow-400' : 'text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Icon Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Icono
        </label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleChange('icon', icon)}
              className={`
                w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all
                ${formData.icon === icon
                  ? 'shadow-neu-inset bg-blue-50'
                  : 'shadow-neu-sm hover:shadow-neu bg-neu-bg'
                }
              `}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleChange('color', color)}
              className={`
                w-8 h-8 rounded-full transition-all
                ${formData.color === color
                  ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  : 'hover:scale-105'
                }
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <NeuButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </NeuButton>
        <NeuButton
          type="submit"
          variant="primary"
          disabled={isLoading || !formData.name || !formData.target_amount}
          className="flex-1"
        >
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Meta'}
        </NeuButton>
      </div>
    </form>
  )
}
