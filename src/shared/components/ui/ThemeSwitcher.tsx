'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/shared/contexts/ThemeContext'

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-xl
        bg-neu-bg shadow-neu hover:shadow-neu-sm
        dark:bg-neu-dark-bg dark:shadow-neu-dark dark:hover:shadow-neu-dark-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
        ${className}
      `}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-600" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  )
}
