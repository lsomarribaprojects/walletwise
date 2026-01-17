import { create } from 'zustand'
import type { Notification, NotificationPreferences } from '../types'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getPreferences,
  updatePreferences,
} from '../services/notificationService'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: string | null

  // Actions
  loadNotifications: () => Promise<void>
  loadUnreadCount: () => Promise<void>
  loadPreferences: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  archive: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  savePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,

  loadNotifications: async () => {
    set({ isLoading: true, error: null })
    try {
      const notifications = await getNotifications()
      set({ notifications, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error loading notifications',
        isLoading: false,
      })
    }
  },

  loadUnreadCount: async () => {
    try {
      const unreadCount = await getUnreadCount()
      set({ unreadCount })
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  },

  loadPreferences: async () => {
    try {
      const preferences = await getPreferences()
      set({ preferences })
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  },

  markRead: async (id) => {
    try {
      await markAsRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  },

  markAllRead: async () => {
    try {
      await markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      }))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  },

  archive: async (id) => {
    try {
      await archiveNotification(id)
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.is_read)
          ? state.unreadCount - 1
          : state.unreadCount,
      }))
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  },

  remove: async (id) => {
    try {
      await deleteNotification(id)
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.is_read)
          ? state.unreadCount - 1
          : state.unreadCount,
      }))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },

  savePreferences: async (updates) => {
    try {
      const preferences = await updatePreferences(updates)
      set({ preferences })
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  },

  // For real-time updates
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },
}))
