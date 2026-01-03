'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/actions/auth'
import { NeuInput } from '@/shared/components/ui/NeuInput'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { NeuCard } from '@/shared/components/ui/NeuCard'
import { Wallet, Eye, EyeOff } from 'lucide-react'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signup(formData)

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
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Walletwise</h1>
            </div>
            <p className="text-gray-500">Crea tu cuenta gratis</p>
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
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
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
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            Crear Cuenta
          </NeuButton>

          <p className="text-center text-sm text-gray-500">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Inicia sesion
            </Link>
          </p>
        </form>
      </NeuCard>

      <p className="text-center text-xs text-gray-400 mt-6">
        &copy; 2026 Sinsajo Creators. Todos los derechos reservados.
      </p>
    </div>
  )
}
