// lib/ai/models.ts
// Configuración de modelos disponibles (safe para cliente y servidor)

// Modelos disponibles para el CFO Agent
// Referencia: https://ai.google.dev/gemini-api/docs/models
export const AGENT_MODELS = {
  // Gemini 2.5 - Ultima generación estable
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'El mas nuevo, rapido y potente',
    speed: 'fast',
    supportsImages: true,
    useGoogleSDK: true,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Maximo poder con pensamiento adaptativo',
    speed: 'medium',
    supportsImages: true,
    useGoogleSDK: true,
  },
  // Gemini 2.0 - Generación anterior (se retira marzo 2026)
  'gemini-2-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Rapido y multimodal',
    speed: 'fast',
    supportsImages: true,
    useGoogleSDK: true,
  },
  'gemini-2-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    description: 'Ultra economico y rapido',
    speed: 'fast',
    supportsImages: true,
    useGoogleSDK: true,
  },
} as const

export type AgentModelKey = keyof typeof AGENT_MODELS

// Modelo por defecto - Gemini 2.5 Flash (el más nuevo y capaz)
export const DEFAULT_MODEL: AgentModelKey = 'gemini-2.5-flash'
