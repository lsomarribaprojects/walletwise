'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/shared/i18n'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="w-full py-4 px-6 bg-neu-bg border-t border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="text-sm text-gray-500">{t.footer.createdBy}</span>
        <Link
          href="https://www.sinsajocreators.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/sinsajo-logo.png"
            alt="Sinsajo Creators"
            width={24}
            height={24}
            className="rounded"
          />
          <span className="text-sm font-medium text-purple-600 hover:text-purple-700">
            Sinsajo Creators
          </span>
        </Link>
      </div>
    </footer>
  )
}
