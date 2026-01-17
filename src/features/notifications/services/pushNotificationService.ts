import { createClient } from '@/lib/supabase/client'

// =====================================================
// PUSH NOTIFICATION SERVICE
// =====================================================

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported')
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Get the service worker registration
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported')
  }

  const registration = await navigator.serviceWorker.ready
  return registration
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Not supported in this browser')
    return null
  }

  const permission = await requestPermission()
  if (permission !== 'granted') {
    console.warn('[Push] Permission denied')
    return null
  }

  try {
    const registration = await getServiceWorkerRegistration()

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Create new subscription using VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.warn('[Push] VAPID public key not configured')
        return null
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    }

    // Save subscription to Supabase
    await saveSubscriptionToDatabase(subscriptionData)

    console.log('[Push] Subscribed successfully')
    return subscriptionData
  } catch (error) {
    console.error('[Push] Subscription failed:', error)
    throw error
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration()
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      await removeSubscriptionFromDatabase(subscription.endpoint)
      console.log('[Push] Unsubscribed successfully')
      return true
    }

    return false
  } catch (error) {
    console.error('[Push] Unsubscription failed:', error)
    throw error
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await getServiceWorkerRegistration()
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}

/**
 * Save subscription to Supabase
 */
async function saveSubscriptionToDatabase(subscription: PushSubscriptionData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: navigator.userAgent,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'endpoint',
  })

  if (error) {
    console.error('[Push] Failed to save subscription:', error)
    throw error
  }
}

/**
 * Remove subscription from database
 */
async function removeSubscriptionFromDatabase(endpoint: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[Push] Failed to remove subscription:', error)
  }
}

/**
 * Show local notification (for testing or fallback)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) return

  const permission = Notification.permission
  if (permission !== 'granted') return

  const registration = await getServiceWorkerRegistration()

  await registration.showNotification(title, {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    ...options,
  })
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Convert URL-safe base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return window.btoa(binary)
}
