'use client'

import { useLanguage, Language } from '@/shared/i18n'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-neu-bg shadow-neu hover:shadow-neu-sm text-gray-600 hover:text-purple-600 transition-all text-xs font-medium"
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Espanol'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="uppercase">{language}</span>
    </button>
  )
}
