/**
 * AlertDropdown Component
 * Dropdown con lista de alertas recientes
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { AlertBell } from './AlertBell'
import { AlertCard } from './AlertCard'
import { useAlerts } from '../hooks/useAlerts'
import Link from 'next/link'

interface AlertDropdownProps {
  maxAlerts?: number
  className?: string
}

export function AlertDropdown({ maxAlerts = 5, className = '' }: AlertDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    unreadAlerts,
    unreadCount,
    isLoading,
    markRead,
    dismiss,
    markAllRead
  } = useAlerts({
    is_dismissed: false,
    include_expired: false
  })

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismiss(id)
    } catch (error) {
      console.error('Error dismissing:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const alertsToShow = unreadAlerts.slice(0, maxAlerts)

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Botón de campana */}
      <AlertBell onClick={handleToggle} />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] z-50">
          <div className="bg-neu-bg rounded-xl shadow-neu border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Alertas
                  {unreadCount > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({unreadCount} nueva{unreadCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </h3>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>

            {/* Lista de alertas */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando...</p>
                </div>
              ) : alertsToShow.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    No tienes alertas nuevas
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {alertsToShow.map((alert) => (
                    <div key={alert.id} className="p-3">
                      <AlertCard
                        alert={alert}
                        onRead={handleMarkRead}
                        onDismiss={handleDismiss}
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {alertsToShow.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-medium text-purple-600 hover:underline"
                >
                  Ver todas las alertas
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
