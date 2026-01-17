'use client'

import { useTTS } from '../hooks/useTTS'
import { NeuCard, NeuButton } from '@/shared/components/ui'

export function TTSSettingsForm() {
  const { isAvailable, voices, settings, updateSettings, speak, isSpeaking, stop } =
    useTTS()

  if (!isAvailable) {
    return (
      <NeuCard>
        <div className="text-center py-8">
          <span className="text-4xl">🔇</span>
          <h3 className="mt-4 font-semibold text-gray-700">
            Text-to-Speech no disponible
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Tu navegador no soporta esta funcion o no tiene voces instaladas.
          </p>
        </div>
      </NeuCard>
    )
  }

  const handleTest = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak('Hola, soy tu asistente financiero de Walletwise. Te ayudaré a leer tu información financiera.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <NeuCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Lectura por Voz</h3>
            <p className="text-sm text-gray-500">
              Habilita la lectura en voz alta de tu informacion financiera
            </p>
          </div>
          <div
            className={`
              relative w-14 h-7 rounded-full transition-colors cursor-pointer
              ${settings.enabled ? 'bg-blue-500' : 'bg-gray-300'}
            `}
            onClick={() => updateSettings({ enabled: !settings.enabled })}
          >
            <div
              className={`
                absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform
                ${settings.enabled ? 'translate-x-7' : 'translate-x-0.5'}
              `}
            />
          </div>
        </div>
      </NeuCard>

      {settings.enabled && (
        <>
          {/* Voice Selection */}
          <NeuCard>
            <h3 className="font-semibold text-gray-800 mb-4">Voz</h3>
            {voices.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay voces en español disponibles
              </p>
            ) : (
              <select
                value={settings.voice}
                onChange={(e) => updateSettings({ voice: e.target.value })}
                className="w-full px-4 py-3 bg-neu-bg rounded-xl shadow-neu-inset text-gray-700"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            )}
          </NeuCard>

          {/* Speed */}
          <NeuCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Velocidad</h3>
              <span className="text-sm text-gray-500">{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Lento</span>
              <span>Normal</span>
              <span>Rapido</span>
            </div>
          </NeuCard>

          {/* Pitch */}
          <NeuCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Tono</h3>
              <span className="text-sm text-gray-500">{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Grave</span>
              <span>Normal</span>
              <span>Agudo</span>
            </div>
          </NeuCard>

          {/* Volume */}
          <NeuCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Volumen</h3>
              <span className="text-sm text-gray-500">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </NeuCard>

          {/* Auto-read alerts */}
          <NeuCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Leer Alertas Automaticamente</h3>
                <p className="text-sm text-gray-500">
                  Lee las alertas importantes en voz alta
                </p>
              </div>
              <div
                className={`
                  relative w-14 h-7 rounded-full transition-colors cursor-pointer
                  ${settings.autoRead ? 'bg-blue-500' : 'bg-gray-300'}
                `}
                onClick={() => updateSettings({ autoRead: !settings.autoRead })}
              >
                <div
                  className={`
                    absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform
                    ${settings.autoRead ? 'translate-x-7' : 'translate-x-0.5'}
                  `}
                />
              </div>
            </div>
          </NeuCard>

          {/* Test Button */}
          <NeuButton
            variant="secondary"
            onClick={handleTest}
            className="w-full"
          >
            {isSpeaking ? '⏹️ Detener' : '🔊 Probar Voz'}
          </NeuButton>
        </>
      )}
    </div>
  )
}
