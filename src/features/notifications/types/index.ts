// Tipos para el sistema de notificaciones

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'achievement'
  | 'reminder'
  | 'alert'
  | 'system'

export type NotificationCategory =
  | 'transaction'
  | 'budget'
  | 'goal'
  | 'subscription'
  | 'loan'
  | 'alert'
  | 'account'
  | 'security'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  icon?: string
  action_url?: string
  action_label?: string
  metadata: Record<string, unknown>
  is_read: boolean
  is_archived: boolean
  read_at?: string
  expires_at?: string
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  in_app_enabled: boolean
  email_enabled: boolean
  email_frequency: 'instant' | 'daily' | 'weekly' | 'never'
  push_enabled: boolean
  categories_enabled: NotificationCategory[]
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationInput {
  user_id: string
  title: string
  message: string
  type?: NotificationType
  category?: NotificationCategory
  icon?: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, unknown>
  expires_at?: string
}

export interface NotificationTypeConfig {
  icon: string
  color: string
  bgColor: string
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  info: { icon: 'ℹ️', color: '#3B82F6', bgColor: '#EFF6FF' },
  success: { icon: '✅', color: '#22C55E', bgColor: '#F0FDF4' },
  warning: { icon: '⚠️', color: '#F59E0B', bgColor: '#FFFBEB' },
  error: { icon: '❌', color: '#EF4444', bgColor: '#FEF2F2' },
  achievement: { icon: '🏆', color: '#8B5CF6', bgColor: '#F5F3FF' },
  reminder: { icon: '🔔', color: '#6366F1', bgColor: '#EEF2FF' },
  alert: { icon: '🚨', color: '#EC4899', bgColor: '#FDF2F8' },
  system: { icon: '⚙️', color: '#6B7280', bgColor: '#F9FAFB' },
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  transaction: 'Transacciones',
  budget: 'Presupuestos',
  goal: 'Metas',
  subscription: 'Suscripciones',
  loan: 'Prestamos',
  alert: 'Alertas',
  account: 'Cuentas',
  security: 'Seguridad',
  system: 'Sistema',
}
