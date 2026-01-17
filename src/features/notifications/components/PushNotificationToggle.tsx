'use client'

import { usePushNotifications } from '../hooks/usePushNotifications'
import { Bell, BellOff, Loader2, AlertCircle, Check } from 'lucide-react'

interface PushNotificationToggleProps {
  className?: string
}

export function PushNotificationToggle({ className = '' }: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-gray-100 rounded-xl ${className}`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <BellOff className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-700">Notificaciones Push</p>
          <p className="text-sm text-gray-500">No soportado en este navegador</p>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-3 p-4 bg-red-50 rounded-xl ${className}`}>
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-700">Notificaciones Push</p>
          <p className="text-sm text-red-600">
            Bloqueadas. Habilitalas en la configuracion de tu navegador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isSubscribed ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5 text-green-600" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
      </div>

      <div className="flex-1">
        <p className="font-medium text-gray-700">Notificaciones Push</p>
        <p className="text-sm text-gray-500">
          {isSubscribed
            ? 'Recibiras alertas en tiempo real'
            : 'Activa para recibir alertas importantes'}
        </p>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>

      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${isSubscribed ? 'bg-purple-600' : 'bg-gray-200'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  )
}

/**
 * Compact version for settings or dropdowns
 */
export function PushNotificationCompactToggle({ className = '' }: PushNotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  if (!isSupported || permission === 'denied') {
    return null
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
        ${isSubscribed
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <Check className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {isSubscribed ? 'Push activo' : 'Activar push'}
      </span>
    </button>
  )
}
