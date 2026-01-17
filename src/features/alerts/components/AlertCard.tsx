/**
 * AlertCard Component
 * Card individual de alerta con acciones (leer, descartar)
 */

'use client'

import { useState } from 'react'
import type { Alert } from '../types'
import Link from 'next/link'

interface AlertCardProps {
  alert: Alert
  onRead?: (id: string) => void
  onDismiss?: (id: string) => void
  compact?: boolean
}

export function AlertCard({ alert, onRead, onDismiss, compact = false }: AlertCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRead = async () => {
    if (!onRead || alert.is_read) return
    setIsProcessing(true)
    try {
      await onRead(alert.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDismiss) return
    setIsProcessing(true)
    try {
      await onDismiss(alert.id)
    } finally {
      setIsProcessing(false)
    }
  }

  // Estilos según tipo
  const typeStyles = {
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    opportunity: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    milestone: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    recommendation: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
  }

  const iconColors = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    opportunity: 'text-blue-600 dark:text-blue-400',
    milestone: 'text-green-600 dark:text-green-400',
    recommendation: 'text-purple-600 dark:text-purple-400'
  }

  const textColors = {
    warning: 'text-yellow-800 dark:text-yellow-200',
    opportunity: 'text-blue-800 dark:text-blue-200',
    milestone: 'text-green-800 dark:text-green-200',
    recommendation: 'text-purple-800 dark:text-purple-200'
  }

  // Icono según tipo
  const getIcon = () => {
    switch (alert.type) {
      case 'warning':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        )
      case 'opportunity':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        )
      case 'milestone':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )
      case 'recommendation':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        )
    }
  }

  // Indicador de prioridad
  const getPriorityIndicator = () => {
    if (alert.priority === 'high') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Alta
        </span>
      )
    }
    if (alert.priority === 'medium' && !compact) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
          Media
        </span>
      )
    }
    return null
  }

  const CardContent = (
    <div
      className={`
        relative border-2 rounded-lg p-4 transition-all duration-200
        ${typeStyles[alert.type]}
        ${alert.is_read ? 'opacity-60' : 'opacity-100'}
        ${!alert.is_read ? 'hover:shadow-md' : ''}
        ${isProcessing ? 'pointer-events-none opacity-50' : ''}
      `}
      onClick={handleRead}
      role={alert.is_read ? undefined : 'button'}
      tabIndex={alert.is_read ? undefined : 0}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Icono */}
          <svg
            className={`flex-shrink-0 w-5 h-5 ${iconColors[alert.type]}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {getIcon()}
          </svg>

          {/* Título */}
          <h3 className={`font-semibold text-sm ${textColors[alert.type]}`}>
            {alert.title}
          </h3>

          {/* Badge no leída */}
          {!alert.is_read && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>

        {/* Prioridad y botón descartar */}
        <div className="flex items-center gap-2">
          {getPriorityIndicator()}

          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Descartar alerta"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mensaje */}
      {!compact && (
        <p className={`text-sm mb-3 ${textColors[alert.type]} opacity-90`}>
          {alert.message}
        </p>
      )}

      {/* Acción */}
      {alert.action_href && alert.action_label && !compact && (
        <Link
          href={alert.action_href}
          className={`
            inline-flex items-center gap-1 text-sm font-medium
            ${textColors[alert.type]}
            hover:underline
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {alert.action_label}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}

      {/* Timestamp */}
      {!compact && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {new Date(alert.created_at).toLocaleString('es-MX', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  )

  return CardContent
}
