import { google } from '@/lib/ai/gemini'
import { AGENT_MODELS, DEFAULT_MODEL, type AgentModelKey } from '@/lib/ai/models'
import { closeAndParseJson } from '@/lib/ai/closeAndParseJson'
import { streamText } from 'ai'
import { createApiClient } from '@/lib/supabase/api'

// Obtener system prompt personalizado del usuario
async function getUserSystemPrompt(): Promise<string | null> {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('user_config')
      .select('agent_system_prompt')
      .eq('user_id', user.id)
      .single()

    return data?.agent_system_prompt || null
  } catch {
    return null
  }
}

// Ejecutar query de finanzas directamente
async function queryFinances(options: {
  periodo: string
  tipo?: string
  categoria?: string
  incluirCategoria?: boolean
  incluirComparativa?: boolean
}) {
  const supabase = createApiClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  // Calcular fechas según período
  let inicio: string, fin: string
  switch (options.periodo) {
    case 'mes_actual':
      inicio = new Date(year, month, 1).toISOString().split('T')[0]
      fin = new Date(year, month + 1, 0).toISOString().split('T')[0]
      break
    case 'mes_anterior':
      inicio = new Date(year, month - 1, 1).toISOString().split('T')[0]
      fin = new Date(year, month, 0).toISOString().split('T')[0]
      break
    case 'quincena':
      inicio = new Date(year, month, day - 15).toISOString().split('T')[0]
      fin = now.toISOString().split('T')[0]
      break
    default:
      inicio = new Date(year, month, 1).toISOString().split('T')[0]
      fin = now.toISOString().split('T')[0]
  }

  let query = supabase
    .from('transacciones')
    .select('*')
    .gte('fecha_hora', `${inicio}T00:00:00`)
    .lte('fecha_hora', `${fin}T23:59:59`)
    .order('fecha_hora', { ascending: false })

  if (options.tipo && options.tipo !== 'todos') {
    query = query.eq('tipo', options.tipo)
  }
  if (options.categoria) {
    query = query.eq('categoria', options.categoria)
  }

  const { data: transacciones } = await query

  const ingresos = transacciones?.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0) || 0
  const gastos = transacciones?.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0) || 0

  const result: Record<string, unknown> = {
    periodo: { inicio, fin },
    totales: { ingresos, gastos, balance: ingresos - gastos, count: transacciones?.length || 0 }
  }

  if (options.incluirCategoria) {
    const cats: Record<string, number> = {}
    transacciones?.forEach(t => {
      cats[t.categoria] = (cats[t.categoria] || 0) + Number(t.monto)
    })
    const total = Object.values(cats).reduce((s, v) => s + v, 0)
    result.porCategoria = Object.entries(cats)
      .map(([cat, monto]) => ({ categoria: cat, monto, porcentaje: total > 0 ? Math.round(monto / total * 100) : 0 }))
      .sort((a, b) => b.monto - a.monto)
  }

  return result
}

async function getRecurringExpenses() {
  const supabase = createApiClient()
  const { data } = await supabase
    .from('gastos_mensuales')
    .select('*')
    .eq('activo', true)
    .order('monto', { ascending: false })

  const total = data?.reduce((s, g) => s + Number(g.monto), 0) || 0
  return {
    gastos: data?.map(g => ({ nombre: g.nombre_app, categoria: g.categoria, monto: g.monto, dia: g.dia_de_cobro })),
    totalMensual: total
  }
}

// Obtener tarjetas de crédito del usuario
async function getCreditCards() {
  const supabase = createApiClient()
  const { data } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('activa', true)
    .order('saldo_actual', { ascending: false })

  if (!data || data.length === 0) {
    return null
  }

  // Calcular métricas
  const deudaTotal = data.reduce((s, c) => s + Number(c.saldo_actual), 0)
  const limiteTotal = data.reduce((s, c) => s + Number(c.limite_credito), 0)
  const utilizacion = limiteTotal > 0 ? (deudaTotal / limiteTotal) * 100 : 0

  // Tasa promedio ponderada
  const tasaPonderada = deudaTotal > 0
    ? data.reduce((s, c) => s + (Number(c.tasa_interes_anual) * Number(c.saldo_actual)), 0) / deudaTotal
    : 0

  // Intereses mensuales proyectados
  const interesesMensuales = data.reduce((s, c) => {
    const tasaMensual = Number(c.tasa_interes_anual) / 12 / 100
    return s + (Number(c.saldo_actual) * tasaMensual)
  }, 0)

  // Pago mínimo total
  const pagoMinimoTotal = data.reduce((s, c) =>
    s + (Number(c.pago_minimo) || Number(c.saldo_actual) * 0.03), 0)

  return {
    tarjetas: data.map(c => ({
      nombre: c.nombre,
      banco: c.banco,
      saldo: c.saldo_actual,
      limite: c.limite_credito,
      utilizacion: Math.round((Number(c.saldo_actual) / Number(c.limite_credito)) * 100),
      apr: c.tasa_interes_anual,
      pagoMinimo: c.pago_minimo || Math.round(Number(c.saldo_actual) * 0.03),
      fechaPago: c.fecha_pago
    })),
    metricas: {
      deudaTotal,
      limiteTotal,
      utilizacion: Math.round(utilizacion * 10) / 10,
      tasaPromedio: Math.round(tasaPonderada * 10) / 10,
      interesesMensuales: Math.round(interesesMensuales),
      pagoMinimoTotal: Math.round(pagoMinimoTotal)
    }
  }
}

// Detectar qué datos necesita la pregunta
function detectDataNeeds(prompt: string): {
  needsFinances: boolean
  needsRecurring: boolean
  needsCreditCards: boolean
  periodo: string
  tipo: string
  categoria: boolean
} {
  const lower = prompt.toLowerCase()
  return {
    needsFinances: /gast|ingres|balance|cuanto|dinero|transacci|mes|quincena|semana/.test(lower),
    needsRecurring: /fijo|recurrent|suscripci|mensual/.test(lower),
    needsCreditCards: /tarjeta|credito|deuda|interes|apr|pago minimo|avalancha|bola de nieve|liquidar|score/.test(lower),
    periodo: lower.includes('quincena') ? 'quincena' : lower.includes('anterior') ? 'mes_anterior' : 'mes_actual',
    tipo: lower.includes('gasto') ? 'gasto' : lower.includes('ingreso') ? 'ingreso' : 'todos',
    categoria: /categor|en que|donde|mayor/.test(lower)
  }
}

const DEFAULT_SYSTEM_PROMPT = `Eres un CFO virtual experto con acceso a datos financieros reales del usuario.

MEMORIA: Tienes acceso al historial de la conversacion. Recuerda nombres, preferencias y contexto previo.

CAPACIDADES DE ASESORIA DE DEUDA:
1. Conoces todas las tarjetas de credito del usuario con sus tasas APR y saldos
2. Puedes calcular planes de pago con dos estrategias:
   - AVALANCHA: Pagar primero la de mayor tasa (ahorra mas en intereses, matematicamente optimo)
   - BOLA DE NIEVE: Pagar primero la de menor saldo (victorias rapidas, psicologicamente motivador)
3. Cuando el usuario mencione dinero disponible para pagar deuda, calcula como distribuirlo
4. Siempre muestra el ahorro en intereses comparado con solo pagar minimos
5. Alerta sobre tarjetas con alta utilizacion (>70%) que afectan score crediticio
6. Calcula intereses mensuales: saldo * (APR / 12 / 100)
7. Si el usuario quiere liquidar deuda, calcula meses y total de intereses

FORMATO DE RESPUESTA (OBLIGATORIO - responde SOLO con este JSON):
{
  "actions": [
    { "_type": "think", "text": "razonamiento breve" },
    { "_type": "analyze", "metric": "nombre", "value": 123, "status": "good|warning|critical", "insight": "1 linea" },
    { "_type": "calculate", "label": "descripcion", "formula": "formula", "result": 123, "unit": "MXN" },
    { "_type": "recommend", "priority": "high|medium|low", "title": "titulo", "description": "1-2 lineas", "impact": "cuantificado" },
    { "_type": "alert", "severity": "info|warning|critical", "message": "mensaje corto" },
    { "_type": "message", "text": "respuesta directa al usuario" }
  ]
}

REGLAS:
1. SIEMPRE responde con JSON valido en el formato de arriba
2. Tienes acceso a datos REALES - usalos para responder con precision
3. SE CONCISO - Maximo 3-4 acciones por respuesta
4. Responde lo que preguntan, no agregues info innecesaria
5. 1 insight valioso > 10 obviedades
6. Sin emojis. Sin relleno.
7. Si analizas una imagen de recibo, extrae: monto total, comercio, fecha, y items si son visibles
8. Para asesoria de deuda, siempre incluye el ahorro vs solo pagar minimos`

// Tipo para mensajes del historial
interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
    const { prompt, context, model: modelKey, images = [], history = [] } = await req.json() as {
      prompt: string
      context?: string
      model?: string
      images?: string[]
      history?: HistoryMessage[]
    }

    // Seleccionar modelo (siempre usar Google SDK ahora)
    const selectedModel = AGENT_MODELS[modelKey as AgentModelKey] || AGENT_MODELS[DEFAULT_MODEL]
    const modelId = selectedModel.id

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Detectar qué datos necesita
    const needs = detectDataNeeds(prompt)
    const hasImages = images.length > 0

    // Ejecutar todo en un async IIFE para no bloquear el Response
    ;(async () => {
      let dataContext = ''

      try {
        // Cargar system prompt personalizado del usuario
        const customPrompt = await getUserSystemPrompt()
        const baseSystemPrompt = customPrompt || DEFAULT_SYSTEM_PROMPT

        // Obtener datos de Supabase si es necesario
        if (needs.needsFinances) {
          const data = await queryFinances({
            periodo: needs.periodo,
            tipo: needs.tipo,
            incluirCategoria: needs.categoria
          })
          await writer.write(encoder.encode(`data: ${JSON.stringify({ _type: 'tool_result', tool: 'queryFinances', data, complete: true })}\n\n`))
          dataContext += `\n\nDATOS FINANCIEROS (${needs.periodo}):\n${JSON.stringify(data, null, 2)}`
        }

        if (needs.needsRecurring) {
          const data = await getRecurringExpenses()
          await writer.write(encoder.encode(`data: ${JSON.stringify({ _type: 'tool_result', tool: 'getRecurringExpenses', data, complete: true })}\n\n`))
          dataContext += `\n\nGASTOS RECURRENTES:\n${JSON.stringify(data, null, 2)}`
        }

        if (needs.needsCreditCards) {
          const data = await getCreditCards()
          if (data) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ _type: 'tool_result', tool: 'getCreditCards', data, complete: true })}\n\n`))
            dataContext += `\n\nTARJETAS DE CREDITO:\n${JSON.stringify(data, null, 2)}`
          }
        }

        const contextMessage = context ? `\n\nCONTEXTO:\n${context}` : ''
        const systemPrompt = baseSystemPrompt + contextMessage + dataContext +
          (hasImages ? `\n\nANALISIS DE IMAGEN: Analiza el recibo/imagen y extrae todos los datos relevantes (monto, comercio, fecha, items).` : '')

        // Construir contenido del mensaje con imágenes si las hay
        const userContent = hasImages
          ? [
              ...images.map((b: string) => ({
                type: 'image' as const,
                image: b.startsWith('data:') ? b : `data:image/jpeg;base64,${b}`
              })),
              { type: 'text' as const, text: prompt }
            ]
          : prompt

        // Construir mensajes con historial previo
        const previousMessages = history.slice(-10).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))

        // Usar Google Gemini directamente
        const { textStream } = streamText({
          model: google(modelId),
          system: systemPrompt,
          messages: [
            ...previousMessages,
            { role: 'user' as const, content: userContent }
          ],
          temperature: 0,
        })

        let buffer = ''
        let cursor = 0

        for await (const text of textStream) {
          buffer += text

          let cleanBuffer = buffer
          if (cleanBuffer.startsWith('```json')) cleanBuffer = cleanBuffer.slice(7)
          else if (cleanBuffer.startsWith('```')) cleanBuffer = cleanBuffer.slice(3)
          if (cleanBuffer.endsWith('```')) cleanBuffer = cleanBuffer.slice(0, -3)
          cleanBuffer = cleanBuffer.trim()

          const parsed = closeAndParseJson(cleanBuffer) as { actions?: unknown[] } | null
          if (!parsed?.actions) continue

          while (cursor < parsed.actions.length) {
            const action = parsed.actions[cursor]
            const isComplete = cursor < parsed.actions.length - 1 || cleanBuffer.endsWith(']}')
            await writer.write(encoder.encode(`data: ${JSON.stringify({ ...action as object, complete: isComplete })}\n\n`))
            if (isComplete) cursor++
            else break
          }
        }
        await writer.write(encoder.encode('data: [DONE]\n\n'))
      } catch (error) {
        console.error('Agent stream error:', error)
        await writer.write(encoder.encode(`data: ${JSON.stringify({ _type: 'alert', severity: 'critical', message: String(error), complete: true })}\n\n`))
      } finally {
        await writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), { status: 500 })
  }
}
