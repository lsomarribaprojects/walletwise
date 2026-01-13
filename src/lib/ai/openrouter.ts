// lib/ai/openrouter.ts
// DEPRECATED: Este archivo se mantiene por compatibilidad
// Usar '@/lib/ai/gemini' para el nuevo SDK de Google AI

// Re-export modelos para compatibilidad
export { AGENT_MODELS, DEFAULT_MODEL, type AgentModelKey } from './models'

// Re-export Google provider como openrouter para compatibilidad
export { google as openrouter } from './gemini'
