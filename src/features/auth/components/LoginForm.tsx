'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login } from '@/actions/auth'
import { NeuInput } from '@/shared/components/ui/NeuInput'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { NeuCard } from '@/shared/components/ui/NeuCard'
import { Wallet, Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <NeuCard size="lg" className="w-full">
        <form action={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Walletwise</h1>
            </div>
            <p className="text-gray-500">Ingresa a tu cuenta</p>
          </div>

          <NeuInput
            name="email"
            type="email"
            label="Email"
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />

          <div className="relative">
            <NeuInput
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <NeuButton
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
            isLoading={loading}
          >
            Iniciar Sesion
          </NeuButton>

          <div className="text-center space-y-2">
            <Link
              href="/forgot-password"
              className="text-sm text-purple-600 hover:underline block"
            >
              Olvidaste tu password?
            </Link>
            <p className="text-sm text-gray-500">
              No tienes cuenta?{' '}
              <Link href="/signup" className="text-purple-600 hover:underline">
                Registrate
              </Link>
            </p>
          </div>
        </form>
      </NeuCard>

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
  )
}
