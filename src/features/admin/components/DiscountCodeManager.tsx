'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Percent, DollarSign, Loader2 } from 'lucide-react'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { NeuInput } from '@/shared/components/ui/NeuInput'
import { NeuCard } from '@/shared/components/ui/NeuCard'
import { adminService } from '../services/adminService'
import type { DiscountCode, DiscountCodeCreate } from '../types'

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newCode, setNewCode] = useState<DiscountCodeCreate>({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    max_uses: null,
    min_purchase: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null,
    applicable_tiers: ['pro', 'premium'],
    is_active: true,
  })

  useEffect(() => {
    loadCodes()
  }, [])

  async function loadCodes() {
    try {
      setIsLoading(true)
      const data = await adminService.getDiscountCodes()
      setCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando codigos')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!newCode.code.trim()) {
      setError('El codigo es requerido')
      return
    }

    try {
      setError(null)
      const created = await adminService.createDiscountCode(newCode)
      setCodes([created, ...codes])
      setIsCreating(false)
      setNewCode({
        code: '',
        description: '',
        type: 'percentage',
        value: 10,
        max_uses: null,
        min_purchase: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: null,
        applicable_tiers: ['pro', 'premium'],
        is_active: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando codigo')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este codigo de descuento?')) return

    try {
      await adminService.deleteDiscountCode(id)
      setCodes(codes.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando')
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await adminService.toggleDiscountCode(id, !currentActive)
      setCodes(codes.map(c => c.id === id ? { ...c, is_active: !currentActive } : c))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Codigos de Descuento</h2>
          <p className="text-sm text-gray-500 mt-1">
            {codes.length} codigos | {codes.filter(c => c.is_active).length} activos
          </p>
        </div>
        <NeuButton onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Codigo
        </NeuButton>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <NeuCard className="p-6 space-y-4">
          <h3 className="font-medium text-gray-800">Nuevo Codigo de Descuento</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Codigo *</label>
              <NeuInput
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Descripcion</label>
              <NeuInput
                value={newCode.description || ''}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="20% descuento verano"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={newCode.type}
                onChange={(e) => setNewCode({ ...newCode, type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-4 py-2.5 rounded-xl bg-neu-bg shadow-neu-inset text-gray-700 focus:outline-none"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Valor {newCode.type === 'percentage' ? '(%)' : '($)'}
              </label>
              <NeuInput
                type="number"
                value={newCode.value}
                onChange={(e) => setNewCode({ ...newCode, value: parseFloat(e.target.value) || 0 })}
                min="0"
                step={newCode.type === 'percentage' ? '1' : '0.01'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Usos Maximos</label>
              <NeuInput
                type="number"
                value={newCode.max_uses || ''}
                onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Ilimitado"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Compra Minima ($)</label>
              <NeuInput
                type="number"
                value={newCode.min_purchase}
                onChange={(e) => setNewCode({ ...newCode, min_purchase: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Valido desde</label>
              <NeuInput
                type="date"
                value={newCode.valid_from.split('T')[0]}
                onChange={(e) => setNewCode({ ...newCode, valid_from: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Valido hasta</label>
              <NeuInput
                type="date"
                value={newCode.valid_until?.split('T')[0] || ''}
                onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value || null })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <NeuButton variant="secondary" onClick={() => setIsCreating(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </NeuButton>
            <NeuButton onClick={handleCreate}>
              <Check className="w-4 h-4 mr-2" />
              Crear Codigo
            </NeuButton>
          </div>
        </NeuCard>
      )}

      {/* Codes List */}
      <div className="space-y-3">
        {codes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay codigos de descuento creados
          </div>
        ) : (
          codes.map((code) => (
            <NeuCard key={code.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${code.type === 'percentage' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}
                  `}>
                    {code.type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-800">{code.code}</span>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                      `}>
                        {code.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {code.type === 'percentage' ? `${code.value}% descuento` : `$${code.value} descuento`}
                      {code.description && ` - ${code.description}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Usos: {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ' (ilimitado)'}
                      {code.valid_until && ` | Expira: ${new Date(code.valid_until).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <NeuButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggle(code.id, code.is_active)}
                  >
                    {code.is_active ? 'Desactivar' : 'Activar'}
                  </NeuButton>
                  <NeuButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(code.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </NeuButton>
                </div>
              </div>
            </NeuCard>
          ))
        )}
      </div>
    </div>
  )
}
