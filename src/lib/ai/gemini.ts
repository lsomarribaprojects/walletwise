// lib/ai/gemini.ts
// Cliente de Google Gemini AI - GRATIS y con soporte de imágenes

import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Provider de Google Gemini
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
})

// Modelos disponibles de Gemini
export const GEMINI_MODELS = {
  // Gemini 2.0 Flash - El más nuevo y rápido
  'gemini-2-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Más rápido, multimodal (imágenes, audio)',
    supportsImages: true,
  },
  // Gemini 1.5 Flash - Rápido y económico
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Rápido y eficiente para tareas generales',
    supportsImages: true,
  },
  // Gemini 1.5 Pro - Más potente
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Más potente para análisis complejos',
    supportsImages: true,
  },
} as const

export type GeminiModelKey = keyof typeof GEMINI_MODELS
export const DEFAULT_GEMINI_MODEL: GeminiModelKey = 'gemini-2-flash'
