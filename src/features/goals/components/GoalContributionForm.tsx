'use client'

import { useState } from 'react'
import { NeuButton, NeuInput } from '@/shared/components/ui'

interface GoalContributionFormProps {
  goalName: string
  onSubmit: (amount: number, date: string, source?: string, notes?: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const SOURCES = [
  { value: 'manual', label: 'Deposito manual' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'salary', label: 'Salario' },
  { value: 'bonus', label: 'Bono' },
  { value: 'interest', label: 'Intereses' },
  { value: 'gift', label: 'Regalo' },
  { value: 'other', label: 'Otro' },
]

export function GoalContributionForm({
  goalName,
  onSubmit,
  onCancel,
  isLoading,
}: GoalContributionFormProps) {
  const [amount, setAmount] = useState<number>(0)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [source, setSource] = useState('manual')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0) return
    await onSubmit(amount, date, source, notes || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">Agregar contribucion a</p>
        <p className="font-semibold text-gray-700">{goalName}</p>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monto *
        </label>
        <NeuInput
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          required
          autoFocus
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha
        </label>
        <NeuInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Origen
        </label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full px-4 py-3 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales..."
          className="w-full px-4 py-3 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          rows={2}
        />
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
          disabled={isLoading || amount <= 0}
          className="flex-1"
        >
          {isLoading ? 'Guardando...' : 'Agregar'}
        </NeuButton>
      </div>
    </form>
  )
}
