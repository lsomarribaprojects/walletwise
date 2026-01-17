'use client'

import { Notification } from '../types'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export function NotificationList({
  notifications,
  onMarkRead,
  onArchive,
  onDelete,
  emptyMessage = 'No hay notificaciones',
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔔</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  // Group by date
  const groupedNotifications = groupByDate(notifications)

  return (
    <div className="space-y-6">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-3 px-1">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string

    if (date.toDateString() === today.toDateString()) {
      label = 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Ayer'
    } else if (isThisWeek(date)) {
      label = 'Esta semana'
    } else if (isThisMonth(date)) {
      label = 'Este mes'
    } else {
      label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    }

    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(notification)
  })

  return groups
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  return date >= startOfWeek
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return (
    date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  )
}
