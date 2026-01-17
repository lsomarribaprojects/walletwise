'use client'

import { useEffect, useCallback } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationPreferences } from '../types'

/**
 * Hook principal para notificaciones
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    loadUnreadCount,
    markRead,
    markAllRead,
    archive,
    remove,
    addNotification,
  } = useNotificationStore()

  // Load on mount
  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [loadNotifications, loadUnreadCount])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notification = payload.new as Notification
          addNotification(notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addNotification])

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markRead(id)
    },
    [markRead]
  )

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead()
  }, [markAllRead])

  const handleArchive = useCallback(
    async (id: string) => {
      await archive(id)
    },
    [archive]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id)
    },
    [remove]
  )

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
    archive: handleArchive,
    deleteNotification: handleDelete,
    refresh: loadNotifications,
  }
}

/**
 * Hook para el conteo de notificaciones no leidas
 */
export function useUnreadCount() {
  const { unreadCount, loadUnreadCount } = useNotificationStore()

  useEffect(() => {
    loadUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  return unreadCount
}

/**
 * Hook para preferencias de notificaciones
 */
export function useNotificationPreferences() {
  const { preferences, loadPreferences, savePreferences, isLoading } = useNotificationStore()

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      await savePreferences(updates)
    },
    [savePreferences]
  )

  return {
    preferences,
    isLoading,
    updatePreferences,
    refresh: loadPreferences,
  }
}
