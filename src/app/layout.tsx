import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LanguageProvider } from '@/shared/i18n'
import { ThemeProvider } from '@/shared/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Walletwise - Gestion Financiera Inteligente',
  description: 'Controla tus finanzas personales con insights inteligentes y un CFO virtual.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Walletwise',
  },
}

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-neu-bg antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
