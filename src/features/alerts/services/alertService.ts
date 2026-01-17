/**
 * Servicio de Alertas
 * CRUD y operaciones para gestionar alertas de usuario
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Alert,
  CreateAlertInput,
  UpdateAlertInput,
  AlertFilters,
  AlertsSummary
} from '../types'

/**
 * Obtener todas las alertas del usuario con filtros opcionales
 */
export async function getAlerts(filters?: AlertFilters): Promise<Alert[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('user_alerts')
    .select('*')
    .eq('user_id', user.id)

  // Aplicar filtros
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }
  if (filters?.is_read !== undefined) {
    query = query.eq('is_read', filters.is_read)
  }
  if (filters?.is_dismissed !== undefined) {
    query = query.eq('is_dismissed', filters.is_dismissed)
  }

  // Excluir expiradas por defecto
  if (!filters?.include_expired) {
    query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }

  return data || []
}

/**
 * Obtener alertas activas (no leídas y no descartadas)
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  return getAlerts({
    is_read: false,
    is_dismissed: false,
    include_expired: false
  })
}

/**
 * Obtener alerta por ID
 */
export async function getAlertById(id: string): Promise<Alert | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_alerts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching alert:', error)
    return null
  }

  return data
}

/**
 * Crear nueva alerta
 */
export async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('user_alerts')
    .insert({
      user_id: user.id,
      type: input.type,
      priority: input.priority || 'medium',
      title: input.title,
      message: input.message,
      action_label: input.action_label || null,
      action_href: input.action_href || null,
      expires_at: input.expires_at || null,
      metadata: input.metadata || {}
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Crear múltiples alertas en lote
 */
export async function createAlerts(inputs: CreateAlertInput[]): Promise<Alert[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const alerts = inputs.map(input => ({
    user_id: user.id,
    type: input.type,
    priority: input.priority || 'medium',
    title: input.title,
    message: input.message,
    action_label: input.action_label || null,
    action_href: input.action_href || null,
    expires_at: input.expires_at || null,
    metadata: input.metadata || {}
  }))

  const { data, error } = await supabase
    .from('user_alerts')
    .insert(alerts)
    .select()

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Actualizar una alerta (marcar como leída/descartada)
 */
export async function updateAlert(
  id: string,
  updates: UpdateAlertInput
): Promise<Alert> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_alerts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Marcar alerta como leída
 */
export async function markAsRead(id: string): Promise<Alert> {
  return updateAlert(id, { is_read: true })
}

/**
 * Marcar múltiples alertas como leídas
 */
export async function markManyAsRead(ids: string[]): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_alerts')
    .update({ is_read: true })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

/**
 * Marcar todas las alertas como leídas
 */
export async function markAllAsRead(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('user_alerts')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw new Error(error.message)
}

/**
 * Descartar alerta
 */
export async function dismissAlert(id: string): Promise<Alert> {
  return updateAlert(id, { is_dismissed: true })
}

/**
 * Descartar múltiples alertas
 */
export async function dismissMany(ids: string[]): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_alerts')
    .update({ is_dismissed: true })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

/**
 * Obtener conteo de alertas no leídas
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase.rpc('get_unread_alerts_count', {
    user_uuid: user.id
  })

  if (error) {
    console.error('Error getting unread count:', error)
    // Fallback: contar manualmente
    const alerts = await getActiveAlerts()
    return alerts.filter(a => !a.is_read).length
  }

  return data || 0
}

/**
 * Obtener resumen de alertas
 */
export async function getAlertsSummary(): Promise<AlertsSummary> {
  const activeAlerts = await getActiveAlerts()
  const unreadAlerts = activeAlerts.filter(a => !a.is_read)

  const summary: AlertsSummary = {
    total_unread: unreadAlerts.length,
    by_type: {
      warning: unreadAlerts.filter(a => a.type === 'warning').length,
      opportunity: unreadAlerts.filter(a => a.type === 'opportunity').length,
      milestone: unreadAlerts.filter(a => a.type === 'milestone').length,
      recommendation: unreadAlerts.filter(a => a.type === 'recommendation').length
    },
    by_priority: {
      low: unreadAlerts.filter(a => a.priority === 'low').length,
      medium: unreadAlerts.filter(a => a.priority === 'medium').length,
      high: unreadAlerts.filter(a => a.priority === 'high').length
    },
    latest_alert: activeAlerts[0] || null
  }

  return summary
}

/**
 * Eliminar alerta (hard delete)
 * Solo para uso administrativo o limpieza
 */
export async function deleteAlert(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_alerts')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Limpiar alertas antiguas descartadas
 * Ejecutar periódicamente (90+ días)
 */
export async function cleanupOldAlerts(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('cleanup_old_alerts')

  if (error) {
    console.error('Error cleaning up old alerts:', error)
    return 0
  }

  return data || 0
}
