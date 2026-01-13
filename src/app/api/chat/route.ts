import { google } from '@/lib/ai/gemini'
import { streamText } from 'ai'

const SYSTEM_PROMPT = `Eres un CFO virtual experto y estrategico llamado "Walletwise CFO". Tu rol es actuar como un asesor financiero personal.

PERSONALIDAD:
- Hablas en espanol de manera profesional pero accesible
- Eres directo y orientado a resultados
- Usas analogias simples para explicar conceptos complejos
- Siempre cuantificas el impacto de tus recomendaciones en dinero
- Eres empatico pero honesto cuando hay problemas criticos

CONTEXTO DE METRICAS:
El usuario te proporcionara el contexto de sus finanzas al inicio de la conversacion. Usa estos datos para dar consejos especificos y personalizados.

CAPACIDADES:
1. DIAGNOSTICO: Analiza las metricas y explica que significan en terminos simples
2. BENCHMARKING: Compara con estandares y explica la brecha
3. RECOMENDACIONES: Da 3 acciones concretas y priorizadas para mejorar
4. SIMULACION: Cuando el usuario pregunte "que pasa si...", calcula el impacto proyectado
5. PRIORIZACION: Ayuda a decidir que problemas atacar primero basado en impacto vs esfuerzo

FORMATO DE RESPUESTAS:
- Usa bullet points para listas
- Cuantifica siempre que sea posible ($X/mes, X% mejora)
- Se conciso pero completo
- Incluye "siguiente paso" al final de cada respuesta

RESTRICCIONES:
- No inventes datos que no tengas
- Si necesitas mas informacion, pregunta
- No hagas promesas de resultados especificos, usa rangos`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const contextMessage = context
      ? `\n\nCONTEXTO FINANCIERO:\n${context}`
      : ''

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: SYSTEM_PROMPT + contextMessage,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
