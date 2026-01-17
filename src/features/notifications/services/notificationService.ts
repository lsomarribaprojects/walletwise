import { createClient } from '@/lib/supabase/client'
import type {
  Notification,
  NotificationPreferences,
  CreateNotificationInput,
  NotificationCategory,
} from '../types'

// =====================================================
// NOTIFICATIONS CRUD
// =====================================================

/**
 * Obtener todas las notificaciones del usuario
 */
export async function getNotifications(
  limit: number = 50,
  includeArchived: boolean = false
): Promise<Notification[]> {
  const supabase = createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!includeArchived) {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Obtener notificaciones no leidas
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener conteo de notificaciones no leidas
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_unread_notification_count')

  if (error) {
    // Fallback si la función no existe
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('is_archived', false)

    return count || 0
  }

  return data || 0
}

/**
 * Marcar notificación como leida
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Marcar todas las notificaciones como leidas
 */
export async function markAllAsRead(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    // Fallback
    const { data: notifications } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)
      .select()

    return notifications?.length || 0
  }

  return data || 0
}

/**
 * Archivar notificación
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_archived: true })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Eliminar notificación
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Crear notificación (para uso interno/server)
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category || 'system',
      icon: input.icon,
      action_url: input.action_url,
      action_label: input.action_label,
      metadata: input.metadata || {},
      expires_at: input.expires_at,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// PREFERENCES
// =====================================================

/**
 * Obtener preferencias de notificaciones
 */
export async function getPreferences(): Promise<NotificationPreferences | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Actualizar preferencias de notificaciones
 */
export async function updatePreferences(
  updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<NotificationPreferences> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      ...updates,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Verificar si una categoría está habilitada
 */
export async function isCategoryEnabled(category: NotificationCategory): Promise<boolean> {
  const prefs = await getPreferences()
  if (!prefs || !prefs.in_app_enabled) return false
  return prefs.categories_enabled.includes(category)
}

// =====================================================
// NOTIFICATION HELPERS
// =====================================================

/**
 * Crear notificación de transacción
 */
export async function notifyTransaction(
  userId: string,
  type: 'income' | 'expense',
  amount: number,
  description: string
): Promise<void> {
  const isIncome = type === 'income'
  await createNotification({
    user_id: userId,
    title: isIncome ? 'Nuevo Ingreso' : 'Nuevo Gasto',
    message: `${description}: $${amount.toLocaleString('es-MX')}`,
    type: isIncome ? 'success' : 'info',
    category: 'transaction',
    icon: isIncome ? '💰' : '💸',
  })
}

/**
 * Crear notificación de presupuesto excedido
 */
export async function notifyBudgetExceeded(
  userId: string,
  budgetName: string,
  percentage: number
): Promise<void> {
  await createNotification({
    user_id: userId,
    title: 'Presupuesto Excedido',
    message: `Has gastado ${percentage.toFixed(0)}% de tu presupuesto "${budgetName}"`,
    type: 'warning',
    category: 'budget',
    icon: '📊',
    action_url: '/budgets',
    action_label: 'Ver presupuestos',
  })
}

/**
 * Crear notificación de meta alcanzada
 */
export async function notifyGoalReached(
  userId: string,
  goalName: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    title: '¡Meta Alcanzada!',
    message: `Felicidades! Has completado tu meta "${goalName}"`,
    type: 'achievement',
    category: 'goal',
    icon: '🎉',
    action_url: '/goals',
    action_label: 'Ver metas',
  })
}

/**
 * Crear notificación de recordatorio de pago
 */
export async function notifyPaymentReminder(
  userId: string,
  name: string,
  amount: number,
  dueDate: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    title: 'Recordatorio de Pago',
    message: `"${name}" ($${amount.toLocaleString('es-MX')}) vence el ${new Date(dueDate).toLocaleDateString('es-MX')}`,
    type: 'reminder',
    category: 'subscription',
    icon: '📅',
    action_url: '/subscriptions',
    action_label: 'Ver suscripciones',
  })
}
