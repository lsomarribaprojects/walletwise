import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Walletwise - Gestion Financiera Inteligente',
  description: 'Controla tus finanzas personales con insights inteligentes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
