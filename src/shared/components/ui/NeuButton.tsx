'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'icon' | 'solid'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function NeuButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: NeuButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  }

  const variantClasses = {
    primary: 'bg-neu-bg shadow-neu hover:shadow-neu-inset active:shadow-neu-inset text-purple-600 font-semibold',
    secondary: 'bg-neu-bg shadow-neu hover:shadow-neu-inset active:shadow-neu-inset text-gray-600 font-medium',
    icon: 'bg-neu-bg shadow-neu hover:shadow-neu-inset active:shadow-neu-inset w-12 h-12 flex items-center justify-center rounded-full',
    solid: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold shadow-lg hover:shadow-xl',
  }

  return (
    <button
      className={`
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
