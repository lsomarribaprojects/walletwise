/**
 * OpenRouter Client - Multi-Model AI Architecture
 *
 * Un solo cliente para múltiples modelos de IA, seleccionando
 * el mejor modelo para cada tipo de tarea.
 *
 * @see https://openrouter.ai/docs
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

// =====================================================
// TIPOS
// =====================================================

export type AIModel =
  | 'google/gemini-2.5-pro-preview'      // OCR, visión, documentos
  | 'google/gemini-2.5-flash-preview'    // Rápido y económico
  | 'openai/o3-mini'                     // Razonamiento complejo (económico)
  | 'openai/gpt-4o-mini'                 // Queries rápidas
  | 'openai/gpt-4o'                      // General purpose
  | 'anthropic/claude-sonnet-4'          // Chat CFO, análisis
  | 'anthropic/claude-haiku-3.5'         // Ultra económico

export type TaskType =
  | 'ocr'           // Escaneo de recibos/documentos
  | 'analysis'      // Análisis financiero complejo
  | 'chat'          // Conversación con CFO
  | 'quick'         // Queries rápidas (categorización, etc.)
  | 'calculation'   // Cálculos matemáticos/financieros

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | OpenRouterContent[]
}

export interface OpenRouterContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface OpenRouterOptions {
  model?: AIModel
  task?: TaskType
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// =====================================================
// CONFIGURACIÓN DE MODELOS POR TAREA
// =====================================================

/**
 * Mapeo de tareas a modelos óptimos
 * Basado en benchmarks y análisis de costo/calidad
 */
export const MODEL_FOR_TASK: Record<TaskType, AIModel> = {
  ocr: 'google/gemini-2.5-pro-preview',      // Mejor para visión/OCR
  analysis: 'openai/o3-mini',                 // Mejor razonamiento
  chat: 'anthropic/claude-sonnet-4',          // Mejor para conversación
  quick: 'openai/gpt-4o-mini',                // Más económico para queries simples
  calculation: 'openai/o3-mini'               // Mejor para matemáticas
}

/**
 * Costos por modelo (USD por 1M tokens)
 * Referencia para estimación de costos
 */
export const MODEL_COSTS: Record<AIModel, { input: number; output: number }> = {
  'google/gemini-2.5-pro-preview': { input: 1.25, output: 10.00 },
  'google/gemini-2.5-flash-preview': { input: 0.075, output: 0.30 },
  'openai/o3-mini': { input: 1.10, output: 4.40 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-sonnet-4': { input: 3.00, output: 15.00 },
  'anthropic/claude-haiku-3.5': { input: 0.80, output: 4.00 }
}

/**
 * Modelos que soportan visión/imágenes
 */
export const VISION_MODELS: AIModel[] = [
  'google/gemini-2.5-pro-preview',
  'google/gemini-2.5-flash-preview',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-sonnet-4'
]

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Llamada simple a OpenRouter (sin streaming)
 */
export async function callAI(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const model = options.model || MODEL_FOR_TASK[options.task || 'chat']

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no está configurado')
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://walletwise.app',
      'X-Title': 'WalletWise CFO'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: false
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * Llamada con streaming a OpenRouter
 * Retorna un AsyncGenerator que yield cada chunk de texto
 */
export async function* streamAI(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): AsyncGenerator<string, void, unknown> {
  const model = options.model || MODEL_FOR_TASK[options.task || 'chat']

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no está configurado')
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://walletwise.app',
      'X-Title': 'WalletWise CFO'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

/**
 * Analizar imagen con visión (OCR de recibos)
 */
export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    }
  ]

  return callAI(messages, {
    model: 'google/gemini-2.5-pro-preview',
    temperature: 0.1  // Baja temperatura para precisión en OCR
  })
}

/**
 * Análisis financiero complejo (usa modelo de razonamiento)
 */
export async function analyzeFinancial(
  context: string,
  question: string
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: `Eres un analista financiero experto. Analiza los datos proporcionados
y responde con precisión matemática. Muestra tus cálculos paso a paso cuando sea relevante.
Usa formato estructurado con secciones claras.`
    },
    {
      role: 'user',
      content: `CONTEXTO FINANCIERO:\n${context}\n\nPREGUNTA:\n${question}`
    }
  ]

  return callAI(messages, {
    task: 'analysis',
    temperature: 0.3
  })
}

/**
 * Query rápida (categorización, validaciones, etc.)
 */
export async function quickQuery(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: OpenRouterMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  return callAI(messages, {
    task: 'quick',
    temperature: 0.3,
    maxTokens: 500
  })
}

/**
 * Chat con CFO (streaming)
 */
export async function* chatWithCFO(
  messages: OpenRouterMessage[],
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  const fullMessages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  yield* streamAI(fullMessages, {
    task: 'chat',
    temperature: 0.7,
    maxTokens: 2000
  })
}

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Detecta el tipo de tarea basado en el contenido del mensaje
 */
export function detectTaskType(message: string): TaskType {
  const lower = message.toLowerCase()

  // Palabras clave para cálculos/proyecciones
  if (
    lower.includes('calcula') ||
    lower.includes('cuánto') ||
    lower.includes('cuanto') ||
    lower.includes('proyección') ||
    lower.includes('proyeccion') ||
    lower.includes('simula') ||
    lower.includes('escenario')
  ) {
    return 'calculation'
  }

  // Palabras clave para análisis
  if (
    lower.includes('analiza') ||
    lower.includes('compara') ||
    lower.includes('estrategia') ||
    lower.includes('qué pasa si') ||
    lower.includes('que pasa si') ||
    lower.includes('recomienda')
  ) {
    return 'analysis'
  }

  // Default: chat
  return 'chat'
}

/**
 * Estima el costo de una llamada
 */
export function estimateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model]
  return (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000
}

/**
 * Verifica si un modelo soporta visión
 */
export function supportsVision(model: AIModel): boolean {
  return VISION_MODELS.includes(model)
}

// =====================================================
// COMPATIBILIDAD LEGACY
// =====================================================

// Re-export para compatibilidad con código existente
export { AGENT_MODELS, DEFAULT_MODEL, type AgentModelKey } from './models'
export { google as openrouter } from './gemini'
