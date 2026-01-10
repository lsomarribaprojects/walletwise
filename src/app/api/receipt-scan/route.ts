import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

interface ReceiptData {
  monto: number | null
  comercio: string | null
  categoria: string | null
  fecha: string | null
  descripcion: string | null
  metodoPago: string | null
  confianza: number
}

// Categorias deben coincidir con EXPENSE_CATEGORIES en categoryColors.ts
const CATEGORIAS_GASTO = [
  'Nomina',
  'Equipo',
  'Renta',
  'Software',
  'Marketing',
  'Transporte',
  'Comida',
  'Entretenimiento',
  'Otros'
]

export async function POST(request: NextRequest) {
  try {
    const { image, cuentas } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporciono imagen' },
        { status: 400 }
      )
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      )
    }

    // Prepare the prompt for receipt analysis
    const systemPrompt = `Eres un experto en analizar recibos y facturas. Extrae la informacion del recibo de la imagen.

IMPORTANTE: Responde SOLO con un JSON valido, sin texto adicional ni markdown.

El JSON debe tener exactamente esta estructura:
{
  "monto": <numero o null>,
  "comercio": "<nombre del comercio o null>",
  "categoria": "<una de las categorias permitidas o null>",
  "fecha": "<fecha en formato YYYY-MM-DD o null>",
  "descripcion": "<descripcion breve de la compra o null>",
  "metodoPago": "<metodo de pago detectado o null>",
  "confianza": <numero entre 0 y 1>
}

Categorias permitidas: ${CATEGORIAS_GASTO.join(', ')}

Cuentas del usuario (para detectar metodo de pago): ${cuentas?.join(', ') || 'No especificadas'}

Reglas:
- Si no puedes leer un campo, usa null
- El monto debe ser un numero sin simbolos
- La confianza indica que tan seguro estas de los datos extraidos (0-1)
- Intenta identificar si el pago fue con alguna de las cuentas del usuario
- Si detectas tarjeta de credito/debito, indica el nombre de la tarjeta si es visible`

    // Call OpenRouter API with vision model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://walletwise-app.vercel.app',
        'X-Title': 'Walletwise Receipt Scanner'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: systemPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', errorText)
      return NextResponse.json(
        { error: 'Error al procesar la imagen' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No se pudo analizar la imagen' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let receiptData: ReceiptData
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      receiptData = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content)
      // Return default structure if parsing fails
      receiptData = {
        monto: null,
        comercio: null,
        categoria: null,
        fecha: null,
        descripcion: content.substring(0, 100),
        metodoPago: null,
        confianza: 0.3
      }
    }

    // Validate and sanitize the response
    const sanitizedData: ReceiptData = {
      monto: typeof receiptData.monto === 'number' ? receiptData.monto : null,
      comercio: typeof receiptData.comercio === 'string' ? receiptData.comercio : null,
      categoria: CATEGORIAS_GASTO.includes(receiptData.categoria || '')
        ? receiptData.categoria
        : null,
      fecha: typeof receiptData.fecha === 'string' ? receiptData.fecha : null,
      descripcion: typeof receiptData.descripcion === 'string' ? receiptData.descripcion : null,
      metodoPago: typeof receiptData.metodoPago === 'string' ? receiptData.metodoPago : null,
      confianza: typeof receiptData.confianza === 'number'
        ? Math.min(1, Math.max(0, receiptData.confianza))
        : 0.5
    }

    return NextResponse.json(sanitizedData)

  } catch (error) {
    console.error('Receipt scan error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
