/**
 * Store de Alertas
 * Maneja el estado global de alertas con Zustand
 */

import { create } from 'zustand'
import type { Alert, AlertsSummary, AlertFilters } from '../types'
import {
  getAlerts,
  getAlertsSummary,
  getUnreadCount,
  markAsRead,
  dismissAlert
} from '../services/alertService'

// =====================================================
// TIPOS DEL STORE
// =====================================================

interface AlertState {
  // Estado
  alerts: Alert[]
  summary: AlertsSummary | null
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastFetched: Date | null

  // Acciones
  fetchAlerts: (filters?: AlertFilters) => Promise<void>
  fetchSummary: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  dismiss: (id: string) => Promise<void>
  refresh: () => Promise<void>
  clearAlerts: () => void

  // Getters computados
  getUnreadAlerts: () => Alert[]
  getHighPriorityAlerts: () => Alert[]
  getAlertsByType: (type: Alert['type']) => Alert[]
}

// =====================================================
// STORE
// =====================================================

export const useAlertStore = create<AlertState>((set, get) => ({
  // Estado inicial
  alerts: [],
  summary: null,
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Acciones
  fetchAlerts: async (filters) => {
    set({ isLoading: true, error: null })

    try {
      const alerts = await getAlerts(filters)
      set({
        alerts,
        isLoading: false,
        lastFetched: new Date()
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading alerts',
        isLoading: false
      })
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await getAlertsSummary()
      set({ summary })
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  },

  markAsRead: async (id) => {
    try {
      await markAsRead(id)

      // Actualizar estado local
      set(state => ({
        alerts: state.alerts.map(a =>
          a.id === id ? { ...a, is_read: true } : a
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))

      // Refrescar summary
      get().fetchSummary()
    } catch (error) {
      console.error('Error marking as read:', error)
      throw error
    }
  },

  dismiss: async (id) => {
    try {
      await dismissAlert(id)

      // Actualizar estado local
      const alert = get().alerts.find(a => a.id === id)
      const wasUnread = alert && !alert.is_read

      set(state => ({
        alerts: state.alerts.filter(a => a.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }))

      // Refrescar summary
      get().fetchSummary()
    } catch (error) {
      console.error('Error dismissing alert:', error)
      throw error
    }
  },

  refresh: async () => {
    await Promise.all([
      get().fetchAlerts(),
      get().fetchSummary(),
      get().fetchUnreadCount()
    ])
  },

  clearAlerts: () => {
    set({
      alerts: [],
      summary: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null
    })
  },

  // Getters
  getUnreadAlerts: () => {
    return get().alerts.filter(a => !a.is_read && !a.is_dismissed)
  },

  getHighPriorityAlerts: () => {
    return get().alerts.filter(a => a.priority === 'high' && !a.is_dismissed)
  },

  getAlertsByType: (type) => {
    return get().alerts.filter(a => a.type === type && !a.is_dismissed)
  }
}))

// =====================================================
// SELECTORES
// =====================================================

export const selectAlerts = (state: AlertState) => state.alerts
export const selectUnreadCount = (state: AlertState) => state.unreadCount
export const selectSummary = (state: AlertState) => state.summary
export const selectIsLoading = (state: AlertState) => state.isLoading
export const selectError = (state: AlertState) => state.error
export const selectHasUnread = (state: AlertState) => state.unreadCount > 0
