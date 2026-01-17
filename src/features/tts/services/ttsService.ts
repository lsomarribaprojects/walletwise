import type { TTSVoice, TTSSettings, TTSContentType } from '../types'

/**
 * Servicio de Text-to-Speech usando Web Speech API
 */
class TTSService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private settings: TTSSettings = {
    enabled: true,
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    autoRead: false,
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      this.loadVoices()

      // Chrome carga voces de forma asincrona
      if (this.synth) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return
    this.voices = this.synth.getVoices()

    // Seleccionar voz en español por defecto si no hay una seleccionada
    if (!this.settings.voice && this.voices.length > 0) {
      const spanishVoice = this.voices.find(
        (v) => v.lang.startsWith('es') && v.name.toLowerCase().includes('female')
      ) || this.voices.find((v) => v.lang.startsWith('es')) || this.voices[0]

      if (spanishVoice) {
        this.settings.voice = spanishVoice.name
      }
    }
  }

  /**
   * Obtiene las voces disponibles
   */
  getVoices(): TTSVoice[] {
    return this.voices.map((v) => ({
      id: v.name,
      name: v.name,
      lang: v.lang,
      gender: v.name.toLowerCase().includes('female')
        ? 'female'
        : v.name.toLowerCase().includes('male')
          ? 'male'
          : 'neutral',
    }))
  }

  /**
   * Obtiene voces en español
   */
  getSpanishVoices(): TTSVoice[] {
    return this.getVoices().filter((v) => v.lang.startsWith('es'))
  }

  /**
   * Configura los settings
   */
  setSettings(settings: Partial<TTSSettings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  /**
   * Obtiene los settings actuales
   */
  getSettings(): TTSSettings {
    return { ...this.settings }
  }

  /**
   * Verifica si TTS está disponible
   */
  isAvailable(): boolean {
    return !!this.synth && this.voices.length > 0
  }

  /**
   * Verifica si está hablando
   */
  isSpeaking(): boolean {
    return this.synth?.speaking || false
  }

  /**
   * Reproduce texto
   */
  speak(text: string, options?: Partial<TTSSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || !this.settings.enabled) {
        resolve()
        return
      }

      // Cancelar cualquier habla anterior
      this.stop()

      const utterance = new SpeechSynthesisUtterance(text)

      // Aplicar settings
      const finalSettings = { ...this.settings, ...options }
      utterance.rate = finalSettings.rate
      utterance.pitch = finalSettings.pitch
      utterance.volume = finalSettings.volume

      // Seleccionar voz
      const voice = this.voices.find((v) => v.name === finalSettings.voice)
      if (voice) {
        utterance.voice = voice
      }

      // Eventos
      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(event.error))
      }

      this.currentUtterance = utterance
      this.synth.speak(utterance)
    })
  }

  /**
   * Pausa la reproduccion
   */
  pause(): void {
    this.synth?.pause()
  }

  /**
   * Reanuda la reproduccion
   */
  resume(): void {
    this.synth?.resume()
  }

  /**
   * Detiene la reproduccion
   */
  stop(): void {
    this.synth?.cancel()
    this.currentUtterance = null
  }

  /**
   * Genera texto para diferentes tipos de contenido
   */
  generateText(type: TTSContentType, data: Record<string, unknown>): string {
    switch (type) {
      case 'balance':
        return `Tu saldo actual es de ${formatCurrency(data.balance as number)}`

      case 'transaction':
        const txType = data.type === 'income' ? 'ingreso' : 'gasto'
        return `Nuevo ${txType} registrado: ${data.description} por ${formatCurrency(data.amount as number)}`

      case 'summary':
        return `Resumen financiero: Ingresos ${formatCurrency(data.income as number)}, Gastos ${formatCurrency(data.expenses as number)}, Ahorro ${formatCurrency(data.savings as number)}`

      case 'alert':
        return `Alerta: ${data.message}`

      case 'goal':
        return `Meta ${data.name}: Has alcanzado el ${data.percentage}% de tu objetivo`

      case 'tip':
        return `Consejo: ${data.message}`

      default:
        return String(data.text || '')
    }
  }

  /**
   * Habla contenido tipado
   */
  speakContent(type: TTSContentType, data: Record<string, unknown>): Promise<void> {
    const text = this.generateText(type, data)
    return this.speak(text)
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

// Singleton instance
export const ttsService = new TTSService()
