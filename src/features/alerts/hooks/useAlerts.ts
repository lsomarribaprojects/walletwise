/**
 * Hook de Alertas
 * Acceso simplificado al estado de alertas del usuario
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Alert, AlertFilters, AlertsSummary } from '../types'
import {
  getAlerts,
  getActiveAlerts,
  getAlertsSummary,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  dismissMany
} from '../services/alertService'

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useAlerts(filters?: AlertFilters) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<AlertsSummary | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar alertas
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [alertsData, summaryData, count] = await Promise.all([
        getAlerts(filters),
        getAlertsSummary(),
        getUnreadCount()
      ])

      setAlerts(alertsData)
      setSummary(summaryData)
      setUnreadCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando alertas')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Cargar al montar y cuando cambien los filtros
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Marcar como leída
  const markRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id)
      setAlerts(prev => prev.map(a =>
        a.id === id ? { ...a, is_read: true } : a
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking alert as read:', err)
      throw err
    }
  }, [])

  // Marcar todas como leídas
  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead()
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
      throw err
    }
  }, [])

  // Descartar alerta
  const dismiss = useCallback(async (id: string) => {
    try {
      await dismissAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
      // Actualizar contador si la alerta no estaba leída
      const alert = alerts.find(a => a.id === id)
      if (alert && !alert.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error dismissing alert:', err)
      throw err
    }
  }, [alerts])

  // Descartar múltiples
  const dismissMultiple = useCallback(async (ids: string[]) => {
    try {
      await dismissMany(ids)
      const dismissedUnread = alerts.filter(a => ids.includes(a.id) && !a.is_read).length
      setAlerts(prev => prev.filter(a => !ids.includes(a.id)))
      setUnreadCount(prev => Math.max(0, prev - dismissedUnread))
    } catch (err) {
      console.error('Error dismissing multiple alerts:', err)
      throw err
    }
  }, [alerts])

  // Filtros rápidos
  const unreadAlerts = alerts.filter(a => !a.is_read && !a.is_dismissed)
  const highPriorityAlerts = alerts.filter(a => a.priority === 'high' && !a.is_dismissed)
  const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.is_dismissed)
  const opportunityAlerts = alerts.filter(a => a.type === 'opportunity' && !a.is_dismissed)

  return {
    // Estado
    alerts,
    unreadAlerts,
    highPriorityAlerts,
    warningAlerts,
    opportunityAlerts,
    summary,
    unreadCount,
    isLoading,
    error,

    // Acciones
    refresh: fetchAlerts,
    markRead,
    markAllRead,
    dismiss,
    dismissMultiple,

    // Helpers
    hasUnread: unreadCount > 0,
    hasHighPriority: highPriorityAlerts.length > 0
  }
}

// =====================================================
// HOOK PARA ALERTAS ACTIVAS (NO LEÍDAS)
// =====================================================

export function useActiveAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchActive = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getActiveAlerts()
      setAlerts(data)
    } catch (error) {
      console.error('Error fetching active alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActive()
  }, [fetchActive])

  return {
    alerts,
    isLoading,
    refresh: fetchActive,
    count: alerts.length
  }
}

// =====================================================
// HOOK PARA CONTADOR DE ALERTAS NO LEÍDAS
// =====================================================

export function useUnreadCount() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getUnreadCount()
      setCount(data)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount()

    // Opcional: Polling cada 30 segundos para mantener actualizado
    const interval = setInterval(fetchCount, 30000)

    return () => clearInterval(interval)
  }, [fetchCount])

  return {
    count,
    isLoading,
    refresh: fetchCount,
    hasUnread: count > 0
  }
}

// =====================================================
// HOOK PARA UNA ALERTA ESPECÍFICA
// =====================================================

export function useAlert(alertId: string | null) {
  const [alert, setAlert] = useState<Alert | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!alertId) {
      setAlert(null)
      return
    }

    setIsLoading(true)
    getAlerts()
      .then(alerts => {
        const found = alerts.find(a => a.id === alertId)
        setAlert(found || null)
      })
      .catch(error => console.error('Error fetching alert:', error))
      .finally(() => setIsLoading(false))
  }, [alertId])

  return {
    alert,
    isLoading
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default useAlerts
