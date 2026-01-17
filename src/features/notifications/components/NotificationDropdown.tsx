'use client'

import { useRouter } from 'next/navigation'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    markRead,
    markAllRead,
    archive,
    deleteNotification,
  } = useNotifications()

  const recentNotifications = notifications.slice(0, 5)

  const handleViewAll = () => {
    onClose()
    router.push('/notifications')
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Marcar todo leido
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔔</div>
            <p className="text-gray-500 text-sm">No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markRead}
                onArchive={archive}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleViewAll}
            className="w-full py-2 text-center text-sm text-blue-500 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  )
}
