/**
 * AlertBanner Component
 * Banner horizontal para alertas de alta prioridad
 * Se muestra en la parte superior de la página
 */

'use client'

import { useState } from 'react'
import type { Alert } from '../types'
import Link from 'next/link'

interface AlertBannerProps {
  alerts: Alert[]
  onDismiss?: (id: string) => void
  maxAlerts?: number
  autoRotate?: boolean
  rotateInterval?: number
}

export function AlertBanner({
  alerts,
  onDismiss,
  maxAlerts = 3,
  autoRotate = true,
  rotateInterval = 5000
}: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDismissing, setIsDismissing] = useState<string | null>(null)

  // Filtrar solo alertas de alta prioridad y no descartadas
  const highPriorityAlerts = alerts
    .filter(a => a.priority === 'high' && !a.is_dismissed)
    .slice(0, maxAlerts)

  // Auto-rotar alertas
  useState(() => {
    if (!autoRotate || highPriorityAlerts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highPriorityAlerts.length)
    }, rotateInterval)

    return () => clearInterval(interval)
  })

  if (highPriorityAlerts.length === 0) return null

  const currentAlert = highPriorityAlerts[currentIndex]

  const handleDismiss = async () => {
    if (!onDismiss || !currentAlert) return

    setIsDismissing(currentAlert.id)
    try {
      await onDismiss(currentAlert.id)
    } catch (error) {
      console.error('Error dismissing alert:', error)
    } finally {
      setIsDismissing(null)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? highPriorityAlerts.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % highPriorityAlerts.length)
  }

  // Estilos según tipo
  const typeStyles = {
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-100',
    opportunity: 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-100',
    milestone: 'bg-green-50 border-green-400 text-green-900 dark:bg-green-900/20 dark:border-green-600 dark:text-green-100',
    recommendation: 'bg-purple-50 border-purple-400 text-purple-900 dark:bg-purple-900/20 dark:border-purple-600 dark:text-purple-100'
  }

  const iconColors = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    opportunity: 'text-blue-600 dark:text-blue-400',
    milestone: 'text-green-600 dark:text-green-400',
    recommendation: 'text-purple-600 dark:text-purple-400'
  }

  const buttonColors = {
    warning: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
    opportunity: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
    milestone: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
    recommendation: 'text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200'
  }

  return (
    <div
      className={`
        relative border-l-4 px-4 py-3 transition-all duration-300
        ${typeStyles[currentAlert.type]}
        ${isDismissing === currentAlert.id ? 'opacity-0' : 'opacity-100'}
      `}
      role="alert"
    >
      <div className="flex items-center gap-3">
        {/* Icono */}
        <div className={`flex-shrink-0 ${iconColors[currentAlert.type]}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {currentAlert.type === 'warning' && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            )}
            {currentAlert.type === 'opportunity' && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            )}
            {currentAlert.type === 'milestone' && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            )}
            {currentAlert.type === 'recommendation' && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            )}
          </svg>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{currentAlert.title}</p>
          <p className="text-sm opacity-90 truncate">{currentAlert.message}</p>
        </div>

        {/* Acción */}
        {currentAlert.action_href && currentAlert.action_label && (
          <Link
            href={currentAlert.action_href}
            className={`
              flex-shrink-0 px-3 py-1 text-sm font-medium rounded
              border transition-colors
              ${buttonColors[currentAlert.type]}
              border-current hover:bg-white/20 dark:hover:bg-black/20
            `}
          >
            {currentAlert.action_label}
          </Link>
        )}

        {/* Controles */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Navegación (si hay múltiples alertas) */}
          {highPriorityAlerts.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${buttonColors[currentAlert.type]}`}
                aria-label="Alerta anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-xs opacity-75 px-1">
                {currentIndex + 1}/{highPriorityAlerts.length}
              </span>

              <button
                onClick={handleNext}
                className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${buttonColors[currentAlert.type]}`}
                aria-label="Siguiente alerta"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Botón descartar */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className={`p-1 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${buttonColors[currentAlert.type]}`}
              aria-label="Descartar alerta"
              disabled={isDismissing === currentAlert.id}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
