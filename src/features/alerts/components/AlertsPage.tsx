/**
 * AlertsPage Component
 * Página completa para gestionar alertas
 */

'use client'

import { useState } from 'react'
import { useAlerts } from '../hooks/useAlerts'
import { AlertCard } from './AlertCard'
import type { AlertType, AlertPriority } from '../types'

export function AlertsPage() {
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<AlertPriority | 'all'>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const {
    alerts,
    summary,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    dismiss,
    dismissMultiple
  } = useAlerts({
    is_dismissed: showDismissed ? undefined : false,
    type: filterType === 'all' ? undefined : filterType,
    priority: filterPriority === 'all' ? undefined : filterPriority
  })

  const handleDismissAll = async () => {
    const alertIds = alerts.map(a => a.id)
    if (alertIds.length === 0) return

    if (confirm(`¿Descartar todas las ${alertIds.length} alertas?`)) {
      await dismissMultiple(alertIds)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Alertas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus notificaciones y alertas financieras
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sin leer</div>
            <div className="text-2xl font-bold text-purple-600">{summary.total_unread}</div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 shadow">
            <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">Advertencias</div>
            <div className="text-2xl font-bold text-yellow-600">{summary.by_type.warning}</div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 shadow">
            <div className="text-sm text-blue-800 dark:text-blue-200 mb-1">Oportunidades</div>
            <div className="text-2xl font-bold text-blue-600">{summary.by_type.opportunity}</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow">
            <div className="text-sm text-green-800 dark:text-green-200 mb-1">Hitos</div>
            <div className="text-2xl font-bold text-green-600">{summary.by_type.milestone}</div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro por tipo */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Tipo:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="warning">Advertencias</option>
              <option value="opportunity">Oportunidades</option>
              <option value="milestone">Hitos</option>
              <option value="recommendation">Recomendaciones</option>
            </select>
          </div>

          {/* Filtro por prioridad */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">Prioridad:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as AlertPriority | 'all')}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>

          {/* Mostrar descartadas */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar descartadas
            </span>
          </label>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Acciones */}
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Marcar todas como leídas
            </button>
          )}

          {alerts.length > 0 && !showDismissed && (
            <button
              onClick={handleDismissAll}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Descartar todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay alertas
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showDismissed
              ? 'No tienes alertas descartadas'
              : 'Todas tus alertas están al día'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={markRead}
              onDismiss={dismiss}
            />
          ))}
        </div>
      )}
    </div>
  )
}
