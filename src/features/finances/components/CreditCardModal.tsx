'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard as CreditCardIcon } from 'lucide-react'
import { NeuCard, NeuButton, NeuInput } from '@/shared/components/ui'
import { CREDIT_CARD_COLORS, COMMON_BANKS, type CreditCardInput, type CreditCard } from '../types/creditCards'

interface CreditCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (card: CreditCardInput) => Promise<void>
  editCard?: CreditCard | null
}

const initialFormState: CreditCardInput = {
  nombre: '',
  banco: '',
  ultimos_digitos: '',
  tasa_interes_anual: 0,
  limite_credito: 0,
  saldo_actual: 0,
  fecha_corte: undefined,
  fecha_pago: undefined,
  pago_minimo: undefined,
  color: '#9333EA',
}

export function CreditCardModal({ isOpen, onClose, onSave, editCard }: CreditCardModalProps) {
  const [form, setForm] = useState<CreditCardInput>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomBank, setShowCustomBank] = useState(false)
  const [customBankName, setCustomBankName] = useState('')

  const isEditMode = !!editCard

  useEffect(() => {
    if (editCard) {
      const bankIsCustom = editCard.banco && !COMMON_BANKS.includes(editCard.banco as typeof COMMON_BANKS[number])
      setForm({
        nombre: editCard.nombre,
        banco: bankIsCustom ? 'Otro' : (editCard.banco || ''),
        ultimos_digitos: editCard.ultimos_digitos || '',
        tasa_interes_anual: editCard.tasa_interes_anual,
        limite_credito: editCard.limite_credito,
        saldo_actual: editCard.saldo_actual,
        fecha_corte: editCard.fecha_corte || undefined,
        fecha_pago: editCard.fecha_pago || undefined,
        pago_minimo: editCard.pago_minimo || undefined,
        color: editCard.color || '#9333EA',
      })
      if (bankIsCustom) {
        setShowCustomBank(true)
        setCustomBankName(editCard.banco || '')
      } else {
        setShowCustomBank(false)
        setCustomBankName('')
      }
    } else {
      setForm(initialFormState)
      setShowCustomBank(false)
      setCustomBankName('')
    }
    setError(null)
  }, [editCard, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validaciones
    if (!form.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (form.tasa_interes_anual <= 0 || form.tasa_interes_anual > 100) {
      setError('La tasa de interes debe estar entre 0 y 100%')
      return
    }
    if (form.limite_credito <= 0) {
      setError('El limite de credito debe ser mayor a 0')
      return
    }
    if (form.ultimos_digitos && form.ultimos_digitos.length !== 4) {
      setError('Los ultimos digitos deben ser exactamente 4')
      return
    }
    if (showCustomBank && !customBankName.trim()) {
      setError('Ingresa el nombre del banco')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = {
        ...form,
        banco: showCustomBank ? customBankName.trim() : form.banco,
      }
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <NeuCard size="lg" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CreditCardIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">
              {isEditMode ? 'Editar Tarjeta' : 'Nueva Tarjeta de Credito'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombre de la tarjeta *
            </label>
            <NeuInput
              type="text"
              placeholder="Ej: Mi Visa Oro"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Banco
            </label>
            <select
              className="w-full px-4 py-3 bg-neu-bg shadow-neu-inset rounded-lg text-gray-700 focus:outline-none"
              value={form.banco}
              onChange={(e) => {
                const value = e.target.value
                setForm({ ...form, banco: value })
                if (value === 'Otro') {
                  setShowCustomBank(true)
                } else {
                  setShowCustomBank(false)
                  setCustomBankName('')
                }
              }}
            >
              <option value="">Seleccionar banco...</option>
              {COMMON_BANKS.map((bank) => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Banco personalizado */}
          {showCustomBank && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nombre del banco *
              </label>
              <NeuInput
                type="text"
                placeholder="Escribe el nombre del banco"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
              />
            </div>
          )}

          {/* Últimos 4 dígitos */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Ultimos 4 digitos
            </label>
            <NeuInput
              type="text"
              placeholder="1234"
              maxLength={4}
              value={form.ultimos_digitos}
              onChange={(e) => setForm({ ...form, ultimos_digitos: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          {/* Tasa de interés y Límite */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Tasa APR (%) *
              </label>
              <NeuInput
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="45.00"
                value={form.tasa_interes_anual || ''}
                onChange={(e) => setForm({ ...form, tasa_interes_anual: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Limite de credito *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <NeuInput
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000.00"
                  className="pl-7"
                  value={form.limite_credito || ''}
                  onChange={(e) => setForm({ ...form, limite_credito: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Saldo actual (deuda) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Saldo actual (deuda)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <NeuInput
                type="number"
                min="0"
                step="0.01"
                placeholder="15000.00"
                className="pl-7"
                value={form.saldo_actual || ''}
                onChange={(e) => setForm({ ...form, saldo_actual: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Fechas de corte y pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Dia de corte
              </label>
              <NeuInput
                type="number"
                min="1"
                max="31"
                placeholder="15"
                value={form.fecha_corte || ''}
                onChange={(e) => setForm({ ...form, fecha_corte: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Dia limite de pago
              </label>
              <NeuInput
                type="number"
                min="1"
                max="31"
                placeholder="5"
                value={form.fecha_pago || ''}
                onChange={(e) => setForm({ ...form, fecha_pago: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>

          {/* Pago mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Pago minimo mensual
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <NeuInput
                type="number"
                min="0"
                step="0.01"
                placeholder="500.00"
                className="pl-7"
                value={form.pago_minimo || ''}
                onChange={(e) => setForm({ ...form, pago_minimo: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {CREDIT_CARD_COLORS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, color: value })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: value }}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <NeuButton
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </NeuButton>
            <NeuButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Agregar'}
            </NeuButton>
          </div>
        </form>
      </NeuCard>
    </div>
  )
}
