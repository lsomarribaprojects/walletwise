'use client'

import Image from 'next/image'
import { NeuCard } from '@/shared/components/ui/NeuCard'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { Clock, LogOut, Wallet } from 'lucide-react'
import { signout } from '@/actions/auth'
import { useAuth } from '@/hooks/useAuth'

export default function PendingApprovalPage() {
  const { user, profile } = useAuth()

  const isRejected = profile?.status === 'rejected'

  return (
    <main className="min-h-screen bg-neu-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <NeuCard size="lg" className="w-full">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Walletwise</h1>
            </div>

            {/* Icon */}
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              isRejected ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <Clock className={`w-10 h-10 ${isRejected ? 'text-red-600' : 'text-amber-600'}`} />
            </div>

            {/* Status */}
            {isRejected ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800">
                  Acceso Denegado
                </h2>
                <p className="text-gray-500">
                  Lo sentimos, tu solicitud de acceso ha sido rechazada.
                  Si crees que esto es un error, contacta al administrador.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800">
                  Pendiente de Aprobacion
                </h2>
                <p className="text-gray-500">
                  Tu cuenta ha sido creada exitosamente. Un administrador
                  revisara tu solicitud y te dara acceso pronto.
                </p>
              </>
            )}

            {/* User info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Registrado como</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isRejected
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
              }`} />
              {isRejected ? 'Rechazado' : 'En espera de aprobacion'}
            </div>

            {/* Logout button */}
            <form action={signout}>
              <NeuButton
                type="submit"
                variant="secondary"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesion
              </NeuButton>
            </form>
          </div>
        </NeuCard>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-400">Desarrollado por</span>
            <Image
              src="/sinsajo-logo.png"
              alt="Sinsajo Creators"
              width={20}
              height={20}
              className="inline-block"
            />
            <span className="text-xs font-medium text-purple-600">Sinsajo Creators</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; 2026 Sinsajo Creators. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  )
}
