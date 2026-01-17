'use client'

import { useSpeakButton } from '../hooks/useTTS'

interface SpeakButtonProps {
  text: string | (() => string)
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
}

export function SpeakButton({
  text,
  size = 'md',
  className = '',
  showLabel = false,
}: SpeakButtonProps) {
  const { isAvailable, isSpeaking, onClick } = useSpeakButton(text)

  if (!isAvailable) return null

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full bg-neu-bg shadow-neu hover:shadow-neu-sm
        flex items-center justify-center gap-2
        transition-all active:shadow-neu-inset
        ${isSpeaking ? 'text-blue-500' : 'text-gray-600'}
        ${className}
      `}
      title={isSpeaking ? 'Detener' : 'Escuchar'}
      aria-label={isSpeaking ? 'Detener lectura' : 'Leer en voz alta'}
    >
      {isSpeaking ? (
        <svg
          className="w-5 h-5 animate-pulse"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {isSpeaking ? 'Detener' : 'Escuchar'}
        </span>
      )}
    </button>
  )
}
