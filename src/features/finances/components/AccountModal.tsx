'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Banknote, PiggyBank, TrendingUp } from 'lucide-react'
import { CuentaInput, TipoCuenta } from '../types'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cuenta: CuentaInput) => Promise<void>
  initialData?: CuentaInput
}

const ACCOUNT_TYPES: { value: TipoCuenta; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'debito', label: 'Debito', icon: CreditCard, description: 'Cuenta bancaria' },
  { value: 'efectivo', label: 'Efectivo', icon: Banknote, description: 'Dinero en efectivo' },
  { value: 'ahorro', label: 'Ahorro', icon: PiggyBank, description: 'Cuenta de ahorro' },
  { value: 'inversion', label: 'Inversion', icon: TrendingUp, description: 'Inversiones' },
]

const COLORS = [
  { value: '#9333EA', name: 'Morado', class: 'bg-purple-600' },
  { value: '#3B82F6', name: 'Azul', class: 'bg-blue-500' },
  { value: '#22C55E', name: 'Verde', class: 'bg-green-500' },
  { value: '#F59E0B', name: 'Amarillo', class: 'bg-amber-500' },
  { value: '#EF4444', name: 'Rojo', class: 'bg-red-500' },
  { value: '#EC4899', name: 'Rosa', class: 'bg-pink-500' },
  { value: '#06B6D4', name: 'Cyan', class: 'bg-cyan-500' },
  { value: '#6366F1', name: 'Indigo', class: 'bg-indigo-500' },
]

export function AccountModal({ isOpen, onClose, onSave, initialData }: AccountModalProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '')
  const [tipo, setTipo] = useState<TipoCuenta>(initialData?.tipo || 'debito')
  const [balanceInicial, setBalanceInicial] = useState(initialData?.balance_inicial?.toString() || '0')
  const [color, setColor] = useState(initialData?.color || '#9333EA')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resetear formulario cuando cambia initialData o se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNombre(initialData?.nombre || '')
      setTipo(initialData?.tipo || 'debito')
      setBalanceInicial(initialData?.balance_inicial?.toString() || '0')
      setColor(initialData?.color || '#9333EA')
      setError(null)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        tipo,
        balance_inicial: parseFloat(balanceInicial) || 0,
        color,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {initialData ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la cuenta
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Mi cuenta Nubank"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((accountType) => {
                const Icon = accountType.icon
                const isSelected = tipo === accountType.value
                return (
                  <button
                    key={accountType.value}
                    type="button"
                    onClick={() => setTipo(accountType.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {accountType.label}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Balance inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Balance inicial
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={balanceInicial}
                onChange={(e) => setBalanceInicial(e.target.value)}
                step="0.01"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El saldo actual de esta cuenta
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-purple-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
