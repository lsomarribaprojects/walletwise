'use client'

import { useState, useMemo } from 'react'
import { Trash2, Pencil, TrendingUp, TrendingDown, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Transaction, TipoTransaccion } from '../types'
import { formatCurrency, formatDateFull } from '../services/analytics'
import { getCategoryColor } from '@/lib/categoryColors'
import { useLanguage } from '@/shared/i18n'

interface TransactionsTableProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
  isLoading?: boolean
}

type FilterType = 'todos' | TipoTransaccion
type SortField = 'fecha_hora' | 'monto' | 'categoria'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export function TransactionsTable({
  transactions,
  onDelete,
  onEdit,
  isLoading = false,
}: TransactionsTableProps) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<FilterType>('todos')
  const [sortField, setSortField] = useState<SortField>('fecha_hora')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(20)

  // Filtrar
  const filtered =
    filter === 'todos'
      ? transactions
      : transactions.filter((t) => t.tipo === filter)

  // Ordenar
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'fecha_hora':
          comparison = new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
          break
        case 'monto':
          comparison = Number(a.monto) - Number(b.monto)
          break
        case 'categoria':
          comparison = a.categoria.localeCompare(b.categoria)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filtered, sortField, sortDirection])

  // Paginación
  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sorted.slice(startIndex, startIndex + pageSize)
  }, [sorted, currentPage, pageSize])

  // Reset página cuando cambia filtro o pageSize
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="bg-neu-bg shadow-neu rounded-2xl p-6">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-700">{t.dashboard.transactions}</h3>
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'ingreso', 'gasto', 'transferencia'] as FilterType[]).map((f) => {
            const labels: Record<FilterType, string> = {
              todos: t.dashboard.all,
              ingreso: t.dashboard.income,
              gasto: t.dashboard.expense,
              transferencia: t.dashboard.transfer,
            }
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    filter === f
                      ? 'bg-neu-bg shadow-neu-inset text-blue-600'
                      : 'bg-neu-bg shadow-neu text-gray-600 hover:shadow-neu-sm'
                  }
                `}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          {t.dashboard.loading}
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          {t.dashboard.noTransactions}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">{t.dashboard.type}</th>
                <th
                  className="pb-3 font-medium cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('fecha_hora')}
                >
                  {t.dashboard.date}
                  <SortIndicator field="fecha_hora" />
                </th>
                <th
                  className="pb-3 font-medium cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('categoria')}
                >
                  {t.dashboard.category}
                  <SortIndicator field="categoria" />
                </th>
                <th className="pb-3 font-medium">{t.dashboard.account}</th>
                <th className="pb-3 font-medium">{t.dashboard.description}</th>
                <th
                  className="pb-3 font-medium text-right cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('monto')}
                >
                  {t.dashboard.amount}
                  <SortIndicator field="monto" />
                </th>
                <th className="pb-3 font-medium text-center">{t.dashboard.actions}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4">
                    <div
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                        ${
                          tx.tipo === 'ingreso'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.tipo === 'gasto'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-sky-100 text-sky-700'
                        }
                      `}
                    >
                      {tx.tipo === 'ingreso' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : tx.tipo === 'gasto' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <ArrowRightLeft className="w-3 h-3" />
                      )}
                      {tx.tipo}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">
                    {formatDateFull(tx.fecha_hora)}
                  </td>
                  <td className="py-4">
                    <span
                      className="px-2 py-1 rounded text-xs text-white font-medium"
                      style={{ backgroundColor: getCategoryColor(tx.categoria) }}
                    >
                      {tx.categoria}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-600">
                    {tx.tipo === 'transferencia' && tx.cuenta_destino
                      ? `${tx.cuenta} → ${tx.cuenta_destino}`
                      : tx.cuenta || '-'}
                  </td>
                  <td className="py-4 text-sm text-gray-500 max-w-xs truncate">
                    {tx.descripcion || '-'}
                  </td>
                  <td
                    className={`
                      py-4 text-sm font-semibold text-right
                      ${
                        tx.tipo === 'ingreso'
                          ? 'text-emerald-600'
                          : tx.tipo === 'gasto'
                          ? 'text-red-600'
                          : 'text-sky-600'
                      }
                    `}
                  >
                    {tx.tipo === 'ingreso' ? '+' : tx.tipo === 'gasto' ? '-' : '↔'}
                    {formatCurrency(Number(tx.monto))}
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-2 rounded-lg transition-all duration-200 bg-neu-bg shadow-neu hover:shadow-neu-inset text-gray-500 hover:text-blue-500"
                        title={t.dashboard.editAction}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className={`
                          p-2 rounded-lg transition-all duration-200
                          ${
                            confirmDelete === tx.id
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-neu-bg shadow-neu hover:shadow-neu-inset text-gray-500 hover:text-red-500'
                          }
                        `}
                        title={confirmDelete === tx.id ? t.dashboard.confirmDelete : t.dashboard.deleteAction}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer con paginación y total */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
        {/* Controles de paginación */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Selector de tamaño de página */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t.dashboard.show}:</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  className={`
                    px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      pageSize === size
                        ? 'bg-neu-bg shadow-neu-inset text-blue-600'
                        : 'bg-neu-bg shadow-neu text-gray-600 hover:shadow-neu-sm'
                    }
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Navegación de páginas */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'bg-neu-bg shadow-neu hover:shadow-neu-sm text-gray-600'
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[100px] text-center">
                {t.dashboard.page} {currentPage} {t.dashboard.of} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'bg-neu-bg shadow-neu hover:shadow-neu-sm text-gray-600'
                  }
                `}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{sorted.length} {t.dashboard.totalTransactions}</span>
          <span className="font-medium">
            {t.dashboard.filteredBalance}:{' '}
            <span
              className={
                sorted.reduce(
                  (sum, item) =>
                    sum +
                    (item.tipo === 'ingreso'
                      ? Number(item.monto)
                      : item.tipo === 'gasto'
                      ? -Number(item.monto)
                      : 0), // Transferencias no afectan el balance filtrado
                  0
                ) >= 0
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }
            >
              {formatCurrency(
                sorted.reduce(
                  (sum, item) =>
                    sum +
                    (item.tipo === 'ingreso'
                      ? Number(item.monto)
                      : item.tipo === 'gasto'
                      ? -Number(item.monto)
                      : 0),
                  0
                )
              )}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
