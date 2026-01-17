'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signup, signInWithGoogle } from '@/actions/auth'
import { NeuInput } from '@/shared/components/ui/NeuInput'
import { NeuButton } from '@/shared/components/ui/NeuButton'
import { NeuCard } from '@/shared/components/ui/NeuCard'
import { Wallet, Eye, EyeOff } from 'lucide-react'

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)

    const result = await signInWithGoogle()

    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
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
            variant="solid"
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            Crear Cuenta
          </NeuButton>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neu-bg text-gray-500">O continua con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-gray-700 font-medium">
              {googleLoading ? 'Conectando...' : 'Google'}
            </span>
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="text-purple-600 hover:underline">
              Inicia sesion
            </Link>
          </p>
        </form>
      </NeuCard>

      <div className="text-center mt-6 space-y-2">
        <Link
          href="https://www.sinsajocreators.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-xs text-gray-400">Desarrollado por</span>
          <Image
            src="/sinsajo-logo.png"
            alt="Sinsajo Creators"
            width={20}
            height={20}
            className="inline-block"
          />
          <span className="text-xs font-medium text-purple-600 hover:text-purple-700">Sinsajo Creators</span>
        </Link>
        <p className="text-xs text-gray-400">
          &copy; 2026 Sinsajo Creators. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
