'use client'

import { useState } from 'react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { NotificationList, NotificationPreferencesForm } from '@/features/notifications'
import { NeuButton, NeuCard } from '@/shared/components/ui'

type Tab = 'all' | 'unread' | 'settings'

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead,
    markAllRead,
    archive,
    deleteNotification,
    refresh,
  } = useNotifications()

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications

  if (error) {
    return (
      <div className="p-6">
        <NeuCard className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <NeuButton variant="secondary" onClick={refresh} className="mt-4">
            Reintentar
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-gray-500 text-sm">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && activeTab !== 'settings' && (
          <NeuButton variant="secondary" onClick={markAllRead}>
            Marcar todo leido
          </NeuButton>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'all'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-neu-bg shadow-neu-sm text-gray-600 hover:shadow-neu'
            }
          `}
        >
          Todas
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
            ${activeTab === 'unread'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-neu-bg shadow-neu-sm text-gray-600 hover:shadow-neu'
            }
          `}
        >
          Sin leer
          {unreadCount > 0 && (
            <span
              className={`
                w-5 h-5 rounded-full text-xs flex items-center justify-center
                ${activeTab === 'unread' ? 'bg-white/20' : 'bg-red-500 text-white'}
              `}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'settings'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-neu-bg shadow-neu-sm text-gray-600 hover:shadow-neu'
            }
          `}
        >
          Preferencias
        </button>
      </div>

      {/* Content */}
      {activeTab === 'settings' ? (
        <NotificationPreferencesForm />
      ) : isLoading && filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Cargando notificaciones...</p>
        </div>
      ) : (
        <NotificationList
          notifications={filteredNotifications}
          onMarkRead={markRead}
          onArchive={archive}
          onDelete={deleteNotification}
          emptyMessage={
            activeTab === 'unread'
              ? 'No hay notificaciones sin leer'
              : 'No hay notificaciones'
          }
        />
      )}
    </div>
  )
}
