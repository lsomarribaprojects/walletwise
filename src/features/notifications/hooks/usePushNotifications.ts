'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed as checkIsSubscribed,
  showLocalNotification,
} from '../services/pushNotificationService'

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize state on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true)

      const supported = isPushSupported()
      setIsSupported(supported)

      if (supported) {
        setPermission(getPermissionStatus())

        try {
          const isCurrentlySubscribed = await checkIsSubscribed()
          setSubscribed(isCurrentlySubscribed)
        } catch (err) {
          console.error('[usePushNotifications] Error checking subscription:', err)
        }
      }

      setIsLoading(false)
    }

    init()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const subscription = await subscribeToPush()
      if (subscription) {
        setSubscribed(true)
        setPermission('granted')
      } else {
        setError('Failed to subscribe to push notifications')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[usePushNotifications] Subscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await unsubscribeFromPush()
      if (success) {
        setSubscribed(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[usePushNotifications] Unsubscribe error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Show a local notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return
    await showLocalNotification(title, options)
  }, [isSupported, permission])

  return {
    isSupported,
    permission,
    isSubscribed: subscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    showNotification,
  }
}
