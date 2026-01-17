'use client'

import { useRouter } from 'next/navigation'
import { Notification, NOTIFICATION_TYPE_CONFIG } from '../types'

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationItem({
  notification,
  onMarkRead,
  onArchive,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter()
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type]

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const timeAgo = getTimeAgo(notification.created_at)

  return (
    <div
      className={`
        p-4 rounded-xl transition-all cursor-pointer
        ${notification.is_read ? 'bg-gray-50' : 'bg-white shadow-sm'}
        hover:bg-gray-100
      `}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: typeConfig.bgColor }}
        >
          <span className="text-lg">{notification.icon || typeConfig.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-medium ${
                notification.is_read ? 'text-gray-600' : 'text-gray-800'
              }`}
            >
              {notification.title}
            </h4>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            )}
          </div>

          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{timeAgo}</span>

            {/* Actions */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {notification.action_url && notification.action_label && (
                <button
                  onClick={() => router.push(notification.action_url!)}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  {notification.action_label}
                </button>
              )}
              <button
                onClick={() => onArchive(notification.id)}
                className="text-xs text-gray-400 hover:text-gray-600"
                title="Archivar"
              >
                Archivar
              </button>
              <button
                onClick={() => onDelete(notification.id)}
                className="text-xs text-red-400 hover:text-red-600"
                title="Eliminar"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes}m`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}
