'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, TrendingDown, ArrowRightLeft, Check, Loader2, Camera } from 'lucide-react'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { NeuInput } from '@/shared/components/ui/NeuInput'
import { NeuSelect } from '@/shared/components/ui/NeuSelect'
import {
  TipoTransaccion,
  TransactionInput,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CuentaDB,
} from '../types'
import { TRANSFER_CATEGORY } from '@/lib/categoryColors'
import { ReceiptScanner, ExtractedReceiptData } from './ReceiptScanner'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionInput) => Promise<void>
  onUpdate?: (id: string, data: Partial<TransactionInput>) => Promise<void>
  initialTipo?: TipoTransaccion
  cuentas?: CuentaDB[]
  editTransaction?: {
    id: string
    tipo: TipoTransaccion
    monto: number
    categoria: string
    cuenta: string
    cuenta_destino?: string | null
    descripcion?: string | null
  } | null
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  initialTipo,
  cuentas = [],
  editTransaction,
}: AddTransactionModalProps) {
  const isEditMode = !!editTransaction
  const cuentasList = cuentas.map(c => c.nombre)
  const defaultCuenta = cuentasList[0] || ''

  const [tipo, setTipo] = useState<TipoTransaccion>(initialTipo || 'gasto')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [cuenta, setCuenta] = useState<string>(defaultCuenta)
  const [cuentaDestino, setCuentaDestino] = useState<string>(cuentasList[1] || defaultCuenta)
  const [descripcion, setDescripcion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  // Populate form when editing or sync tipo when initialTipo changes
  useEffect(() => {
    if (editTransaction && isOpen) {
      setTipo(editTransaction.tipo)
      setMonto(String(editTransaction.monto))
      setCategoria(editTransaction.categoria)
      setCuenta(editTransaction.cuenta)
      setCuentaDestino(editTransaction.cuenta_destino || cuentasList[1] || '')
      setDescripcion(editTransaction.descripcion || '')
    } else if (initialTipo && isOpen) {
      setTipo(initialTipo)
    }
  }, [editTransaction, initialTipo, isOpen, cuentasList])

  // Update default cuenta when cuentas change
  useEffect(() => {
    if (cuentasList.length > 0 && !cuenta) {
      setCuenta(cuentasList[0])
      if (cuentasList.length > 1) {
        setCuentaDestino(cuentasList[1])
      }
    }
  }, [cuentasList, cuenta])

  // Categorías según tipo (transferencias usan categoría fija)
  const categories = tipo === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  // Cuentas disponibles para destino (excluir la cuenta origen)
  const cuentasDestinoList = cuentasList.filter((c) => c !== cuenta)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingresa un monto valido')
      return
    }

    // Validar categoría solo para gasto/ingreso
    if (tipo !== 'transferencia' && !categoria) {
      setError('Selecciona una categoria')
      return
    }

    // Validar cuentas diferentes para transferencia
    if (tipo === 'transferencia' && cuenta === cuentaDestino) {
      setError('Las cuentas origen y destino deben ser diferentes')
      return
    }

    setIsLoading(true)

    try {
      const transactionData = {
        tipo,
        monto: montoNum,
        categoria: tipo === 'transferencia' ? TRANSFER_CATEGORY : categoria,
        cuenta,
        cuenta_destino: tipo === 'transferencia' ? cuentaDestino : undefined,
        descripcion: descripcion || undefined,
      }

      if (isEditMode && onUpdate && editTransaction) {
        await onUpdate(editTransaction.id, transactionData)
      } else {
        await onSubmit(transactionData)
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        resetForm()
        onClose()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTipo('gasto')
    setMonto('')
    setCategoria('')
    setCuenta(defaultCuenta)
    setCuentaDestino(cuentasList[1] || defaultCuenta)
    setDescripcion('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Handle data extracted from receipt scanner
  const handleReceiptData = (data: ExtractedReceiptData) => {
    // Set tipo to 'gasto' since receipts are expenses
    setTipo('gasto')

    // Fill in the extracted data
    if (data.monto) {
      setMonto(String(data.monto))
    }

    if (data.categoria) {
      // Cast to check if categoria is valid
      const validCategories: readonly string[] = EXPENSE_CATEGORIES
      if (validCategories.includes(data.categoria)) {
        setCategoria(data.categoria)
      }
    }

    // Build description from extracted info
    const descParts: string[] = []
    if (data.comercio) descParts.push(data.comercio)
    if (data.descripcion && data.descripcion !== data.comercio) {
      descParts.push(data.descripcion)
    }
    if (descParts.length > 0) {
      setDescripcion(descParts.join(' - '))
    }

    // Try to match payment method to user's accounts
    if (data.metodoPago) {
      const matchedAccount = cuentasList.find(c =>
        c.toLowerCase().includes(data.metodoPago!.toLowerCase()) ||
        data.metodoPago!.toLowerCase().includes(c.toLowerCase())
      )
      if (matchedAccount) {
        setCuenta(matchedAccount)
      }
    }

    setShowScanner(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Glassmorphic overlay that matches neumorphic aesthetic */}
      <div
        className="absolute inset-0 bg-neu-bg/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal - Enhanced shadow for depth against glassmorphic backdrop */}
      <div className="relative bg-neu-bg shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff,0_4px_30px_rgba(0,0,0,0.1)] rounded-3xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Editar Transaccion' : 'Nueva Transaccion'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                onClick={() => setShowScanner(true)}
                className="p-2 rounded-xl bg-purple-100 hover:bg-purple-200 transition-colors"
                title="Escanear recibo"
              >
                <Camera className="w-5 h-5 text-purple-600" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-neu-bg shadow-neu hover:shadow-neu-inset transition-shadow"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Success state */}
        {success ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-medium text-gray-700">
              {isEditMode ? 'Actualizado' : 'Guardado'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo selector - Neumorphic style (3 opciones) */}
            <div className="grid grid-cols-3 gap-2">
              {(['gasto', 'ingreso', 'transferencia'] as TipoTransaccion[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTipo(t)
                    setCategoria('')
                  }}
                  className={`
                    flex items-center justify-center gap-1.5 p-3 rounded-xl font-medium text-sm
                    transition-all duration-200
                    ${
                      tipo === t
                        ? `bg-neu-bg shadow-neu-inset ${
                            t === 'gasto'
                              ? 'text-red-500'
                              : t === 'ingreso'
                              ? 'text-emerald-500'
                              : 'text-sky-500'
                          }`
                        : 'bg-neu-bg shadow-neu text-gray-500 hover:shadow-neu-sm'
                    }
                  `}
                >
                  {t === 'gasto' ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : t === 'ingreso' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <ArrowRightLeft className="w-4 h-4" />
                  )}
                  {t === 'transferencia' ? 'Transfer' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Monto */}
            <NeuInput
              label="Monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />

            {/* Categoria - Solo para gasto/ingreso */}
            {tipo !== 'transferencia' && (
              <NeuSelect
                label="Categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                options={[
                  { value: '', label: 'Selecciona...' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
                required
              />
            )}

            {/* Cuenta Origen */}
            <NeuSelect
              label={tipo === 'transferencia' ? 'Cuenta Origen' : 'Cuenta'}
              value={cuenta}
              onChange={(e) => {
                const newCuenta = e.target.value
                setCuenta(newCuenta)
                // Si la cuenta destino es igual, cambiarla
                if (newCuenta === cuentaDestino) {
                  const available = cuentasList.filter((c) => c !== newCuenta)
                  if (available.length > 0) setCuentaDestino(available[0])
                }
              }}
              options={cuentasList.length > 0
                ? cuentasList.map((c) => ({ value: c, label: c }))
                : [{ value: '', label: 'Crea una cuenta primero' }]
              }
              required
            />

            {/* Cuenta Destino - Solo para transferencias */}
            {tipo === 'transferencia' && (
              <NeuSelect
                label="Cuenta Destino"
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
                options={cuentasDestinoList.map((c) => ({ value: c, label: c }))}
                required
              />
            )}

            {/* Descripcion */}
            <NeuInput
              label="Descripcion (opcional)"
              type="text"
              placeholder={
                tipo === 'transferencia'
                  ? 'Ej: Retiro para gastos en efectivo...'
                  : 'Detalle de la transaccion...'
              }
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <NeuButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Guardando...'}
                </span>
              ) : isEditMode ? (
                'Actualizar Transaccion'
              ) : tipo === 'transferencia' ? (
                'Guardar Transferencia'
              ) : (
                'Guardar Transaccion'
              )}
            </NeuButton>
          </form>
        )}
      </div>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <ReceiptScanner
          onDataExtracted={handleReceiptData}
          onClose={() => setShowScanner(false)}
          cuentas={cuentasList}
        />
      )}
    </div>
  )
}
