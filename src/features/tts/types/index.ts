// Tipos para Text-to-Speech

export interface TTSVoice {
  id: string
  name: string
  lang: string
  gender: 'male' | 'female' | 'neutral'
}

export interface TTSSettings {
  enabled: boolean
  voice: string
  rate: number // 0.5 - 2.0
  pitch: number // 0 - 2
  volume: number // 0 - 1
  autoRead: boolean // Auto-read important alerts
}

export interface TTSState {
  isSpeaking: boolean
  isPaused: boolean
  currentText: string | null
  queue: string[]
}

export type TTSContentType =
  | 'balance'        // Lectura de saldos
  | 'transaction'    // Lectura de transaccion
  | 'summary'        // Resumen financiero
  | 'alert'          // Alerta
  | 'goal'           // Progreso de meta
  | 'tip'            // Consejo financiero

export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  enabled: true,
  voice: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  autoRead: false,
}
