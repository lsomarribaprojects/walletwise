/**
 * Cron Job: Ejecutar Detectores de Alertas
 * Ruta: /api/cron/alerts
 *
 * @description
 * Ejecuta todos los detectores de alertas y crea las alertas detectadas.
 * Configurar para ejecutar diariamente a las 8:00 AM.
 *
 * @vercelCron
 * {
 *   "path": "/api/cron/alerts",
 *   "schedule": "0 8 * * *"
 * }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAllDetectors } from '@/features/alerts/services/alertDetectors'
import { createAlerts } from '@/features/alerts/services/alertService'

export async function GET(request: Request) {
  try {
    // Verificar autenticación (opcional: agregar token de autorización)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ejecutar detectores
    const result = await runAllDetectors()

    // Crear alertas detectadas
    let createdAlerts = []
    if (result.alerts.length > 0) {
      createdAlerts = await createAlerts(result.alerts)
    }

    return NextResponse.json({
      success: true,
      detector_run: result.detector_name,
      detected_at: result.detected_at,
      alerts_detected: result.alerts.length,
      alerts_created: createdAlerts.length,
      details: {
        by_type: result.alerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        by_priority: result.alerts.reduce((acc, alert) => {
          const priority = alert.priority || 'medium'
          acc[priority] = (acc[priority] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })
  } catch (error) {
    console.error('Error running alert detectors:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint para ejecutar manualmente (testing)
 */
export async function POST() {
  return GET(new Request('http://localhost/api/cron/alerts'))
}
