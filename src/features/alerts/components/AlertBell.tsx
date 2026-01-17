/**
 * AlertBell Component
 * Icono de campana con badge de contador de alertas no leídas
 */

'use client'

import { useUnreadCount } from '../hooks/useAlerts'

interface AlertBellProps {
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AlertBell({ onClick, className = '', size = 'md' }: AlertBellProps) {
  const { count, isLoading } = useUnreadCount()

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const badgeSizeClasses = {
    sm: 'text-xs min-w-[16px] h-4',
    md: 'text-xs min-w-[18px] h-[18px]',
    lg: 'text-sm min-w-[20px] h-5'
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-xl
        transition-all duration-200
        bg-neu-bg shadow-neu hover:shadow-neu-sm
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
        ${className}
      `}
      aria-label={`Alertas${count > 0 ? ` (${count} no leídas)` : ''}`}
      disabled={isLoading}
    >
      {/* Icono de campana */}
      <svg
        className={`${sizeClasses[size]} text-gray-600`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge de contador */}
      {count > 0 && (
        <span
          className={`
            absolute -top-1 -right-1
            ${badgeSizeClasses[size]}
            flex items-center justify-center
            bg-red-500 text-white font-bold rounded-full
            animate-pulse
          `}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Indicator de loading */}
      {isLoading && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
      )}
    </button>
  )
}
