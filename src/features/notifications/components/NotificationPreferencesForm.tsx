'use client'

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '../hooks/useNotifications'
import {
  NotificationCategory,
  NOTIFICATION_CATEGORY_LABELS,
  NotificationPreferences,
} from '../types'
import { NeuCard, NeuButton } from '@/shared/components/ui'

export function NotificationPreferencesForm() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences()
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences])

  if (isLoading || !localPrefs) {
    return (
      <NeuCard>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </NeuCard>
    )
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev?.[key as keyof typeof prev],
    }))
  }

  const handleCategoryToggle = (category: NotificationCategory) => {
    const current = localPrefs.categories_enabled || []
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    setLocalPrefs((prev) => ({
      ...prev,
      categories_enabled: updated,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updatePreferences(localPrefs)
    } finally {
      setIsSaving(false)
    }
  }

  const allCategories = Object.keys(NOTIFICATION_CATEGORY_LABELS) as NotificationCategory[]

  return (
    <div className="space-y-6">
      {/* In-app notifications */}
      <NeuCard>
        <h3 className="font-semibold text-gray-800 mb-4">Notificaciones en App</h3>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700">Habilitar notificaciones</span>
          <div
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${localPrefs.in_app_enabled ? 'bg-blue-500' : 'bg-gray-300'}
            `}
            onClick={() => handleToggle('in_app_enabled')}
          >
            <div
              className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${localPrefs.in_app_enabled ? 'translate-x-6' : 'translate-x-0.5'}
              `}
            />
          </div>
        </label>
      </NeuCard>

      {/* Email notifications */}
      <NeuCard>
        <h3 className="font-semibold text-gray-800 mb-4">Notificaciones por Email</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Recibir emails</span>
            <div
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${localPrefs.email_enabled ? 'bg-blue-500' : 'bg-gray-300'}
              `}
              onClick={() => handleToggle('email_enabled')}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${localPrefs.email_enabled ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </div>
          </label>

          {localPrefs.email_enabled && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">Frecuencia</label>
              <select
                value={localPrefs.email_frequency}
                onChange={(e) =>
                  setLocalPrefs((prev) => ({
                    ...prev,
                    email_frequency: e.target.value as NotificationPreferences['email_frequency'],
                  }))
                }
                className="w-full px-4 py-2 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700"
              >
                <option value="instant">Instantaneo</option>
                <option value="daily">Resumen diario</option>
                <option value="weekly">Resumen semanal</option>
                <option value="never">Nunca</option>
              </select>
            </div>
          )}
        </div>
      </NeuCard>

      {/* Categories */}
      <NeuCard>
        <h3 className="font-semibold text-gray-800 mb-4">Categorias</h3>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona las categorias de las que deseas recibir notificaciones
        </p>

        <div className="space-y-3">
          {allCategories.map((category) => {
            const isEnabled = localPrefs.categories_enabled?.includes(category)
            return (
              <label
                key={category}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-gray-700">
                  {NOTIFICATION_CATEGORY_LABELS[category]}
                </span>
                <div
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}
                  `}
                  onClick={() => handleCategoryToggle(category)}
                >
                  <div
                    className={`
                      absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                      ${isEnabled ? 'translate-x-6' : 'translate-x-0.5'}
                    `}
                  />
                </div>
              </label>
            )
          })}
        </div>
      </NeuCard>

      {/* Quiet hours */}
      <NeuCard>
        <h3 className="font-semibold text-gray-800 mb-4">Horas de Silencio</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700">Habilitar horas de silencio</span>
            <div
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${localPrefs.quiet_hours_enabled ? 'bg-blue-500' : 'bg-gray-300'}
              `}
              onClick={() => handleToggle('quiet_hours_enabled')}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                  ${localPrefs.quiet_hours_enabled ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </div>
          </label>

          {localPrefs.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Desde</label>
                <input
                  type="time"
                  value={localPrefs.quiet_hours_start || '22:00'}
                  onChange={(e) =>
                    setLocalPrefs((prev) => ({
                      ...prev,
                      quiet_hours_start: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Hasta</label>
                <input
                  type="time"
                  value={localPrefs.quiet_hours_end || '08:00'}
                  onChange={(e) =>
                    setLocalPrefs((prev) => ({
                      ...prev,
                      quiet_hours_end: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700"
                />
              </div>
            </div>
          )}
        </div>
      </NeuCard>

      {/* Save button */}
      <NeuButton
        variant="primary"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Guardando...' : 'Guardar Preferencias'}
      </NeuButton>
    </div>
  )
}
