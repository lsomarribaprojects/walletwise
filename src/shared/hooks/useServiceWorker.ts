'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
  error: string | null
}

/**
 * Hook para gestionar el Service Worker y estado offline
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    registration: null,
    error: null,
  })

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setState((prev) => ({ ...prev, isSupported: false }))
      return
    }

    setState((prev) => ({
      ...prev,
      isSupported: true,
      isOnline: navigator.onLine,
    }))

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('[SW] Registration successful:', registration.scope)

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                console.log('[SW] New content available, refresh to update')
              }
            })
          }
        })
      } catch (err) {
        console.error('[SW] Registration failed:', err)
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Registration failed',
        }))
      }
    }

    registerSW()

    // Listen for online/offline events
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * Force update the service worker
   */
  const update = async () => {
    if (state.registration) {
      await state.registration.update()
    }
  }

  /**
   * Unregister the service worker
   */
  const unregister = async () => {
    if (state.registration) {
      await state.registration.unregister()
      setState((prev) => ({ ...prev, isRegistered: false, registration: null }))
    }
  }

  return {
    ...state,
    update,
    unregister,
  }
}

/**
 * Hook para detectar estado offline simple
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
