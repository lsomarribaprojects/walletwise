'use client'

import { useState } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ArrowRightLeft,
  PieChart,
  Calendar,
  Bot,
  CheckCircle2,
  Sparkles,
  Wallet,
  Target,
  TrendingUp,
} from 'lucide-react'

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userName?: string
}

interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
  color: string
  features: {
    title: string
    description: string
    path?: string
  }[]
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Bienvenido a Walletwise',
    description: 'Tu asistente financiero inteligente para tomar el control de tu dinero',
    icon: Sparkles,
    color: 'purple',
    features: [
      {
        title: 'Gestion inteligente',
        description: 'Rastrea todos tus ingresos y gastos en un solo lugar',
      },
      {
        title: 'CFO Virtual con IA',
        description: 'Recibe consejos personalizados basados en tus habitos financieros',
      },
      {
        title: 'Visualizaciones claras',
        description: 'Graficos y reportes para entender tu situacion financiera',
      },
    ],
  },
  {
    id: 2,
    title: 'Configura tus Cuentas',
    description: 'El primer paso es agregar las cuentas donde manejas tu dinero',
    icon: CreditCard,
    color: 'blue',
    features: [
      {
        title: 'Cuentas de banco',
        description: 'Agrega tus cuentas de debito y credito (Nubank, Bancoppel, etc.)',
        path: '/dashboard',
      },
      {
        title: 'Efectivo',
        description: 'Lleva el control del dinero que tienes en mano',
        path: '/dashboard',
      },
      {
        title: 'Ahorros e Inversiones',
        description: 'Rastrea tus cuentas de ahorro y portafolios de inversion',
        path: '/dashboard',
      },
    ],
  },
  {
    id: 3,
    title: 'Registra Transacciones',
    description: 'Cada vez que gastes o recibas dinero, registralo aqui',
    icon: ArrowRightLeft,
    color: 'green',
    features: [
      {
        title: 'Ingresos',
        description: 'Salario, ventas, freelance, o cualquier entrada de dinero',
        path: '/dashboard',
      },
      {
        title: 'Gastos',
        description: 'Compras, servicios, comida, entretenimiento, etc.',
        path: '/dashboard',
      },
      {
        title: 'Transferencias',
        description: 'Mueve dinero entre tus cuentas sin afectar el balance total',
        path: '/dashboard',
      },
    ],
  },
  {
    id: 4,
    title: 'Gastos Recurrentes',
    description: 'Configura tus gastos fijos para que se registren automaticamente',
    icon: Calendar,
    color: 'amber',
    features: [
      {
        title: 'Gastos Mensuales',
        description: 'Netflix, Spotify, renta, luz, internet - se registran cada mes',
        path: '/finanzas/gastos-mensuales',
      },
      {
        title: 'Gastos Anuales',
        description: 'Seguros, membresías, dominios web - se registran una vez al año',
        path: '/finanzas/gastos-anuales',
      },
      {
        title: 'Automatizacion',
        description: 'El sistema crea las transacciones en la fecha que indiques',
        path: '/finanzas/gastos-mensuales',
      },
    ],
  },
  {
    id: 5,
    title: 'Analiza con el CFO',
    description: 'Tu CFO virtual analiza tus finanzas y te da recomendaciones',
    icon: Bot,
    color: 'pink',
    features: [
      {
        title: 'Analisis de flujo de caja',
        description: '"Analiza mi flujo de caja" - Ve cuanto entra vs cuanto sale',
        path: '/agent',
      },
      {
        title: 'Reducir gastos',
        description: '"Donde puedo reducir gastos?" - Identifica areas de ahorro',
        path: '/agent',
      },
      {
        title: 'Proyecciones',
        description: '"Proyecta mis finanzas a 6 meses" - Planifica tu futuro',
        path: '/agent',
      },
    ],
  },
  {
    id: 6,
    title: 'Listo para empezar!',
    description: 'Ya conoces todas las herramientas. Es hora de tomar el control.',
    icon: Target,
    color: 'purple',
    features: [
      {
        title: 'Paso 1: Crear cuentas',
        description: 'Ve al Dashboard y crea tus cuentas bancarias',
      },
      {
        title: 'Paso 2: Registrar balance actual',
        description: 'Agrega el saldo actual de cada cuenta',
      },
      {
        title: 'Paso 3: Configurar recurrentes',
        description: 'Agrega tus gastos fijos mensuales',
      },
    ],
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', light: 'bg-purple-50' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', light: 'bg-amber-50' },
  pink: { bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-200', light: 'bg-pink-50' },
}

export function OnboardingWizard({ isOpen, onClose, onComplete, userName }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const colors = colorClasses[step.color]
  const Icon = step.icon
  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
      onClose()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className={`h-full ${colors.bg} transition-all duration-500`}
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Icon & Title */}
          <div className="text-center mb-6">
            <div className={`inline-flex p-4 rounded-2xl ${colors.light} mb-4`}>
              <Icon className={`w-10 h-10 ${colors.text}`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isFirstStep && userName ? `Hola ${userName}!` : step.title}
            </h2>
            <p className="text-gray-500">{step.description}</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-xl border ${colors.border} ${colors.light}`}
              >
                <CheckCircle2 className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="font-medium text-gray-800">{feature.title}</p>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0 rounded-b-3xl">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              isFirstStep
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? `${colors.bg} w-6`
                    : index < currentStep
                    ? colors.bg
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`flex items-center gap-1 px-5 py-2 rounded-xl font-medium text-white transition-colors ${colors.bg} hover:opacity-90`}
          >
            {isLastStep ? 'Empezar!' : 'Siguiente'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
