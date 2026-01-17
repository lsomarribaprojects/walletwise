'use client'

import { useState, useEffect, useCallback } from 'react'
import { ttsService } from '../services/ttsService'
import type { TTSVoice, TTSSettings, TTSContentType } from '../types'

/**
 * Hook principal para Text-to-Speech
 */
export function useTTS() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [settings, setSettings] = useState<TTSSettings>(ttsService.getSettings())

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = () => {
      setIsAvailable(ttsService.isAvailable())
      setVoices(ttsService.getSpanishVoices())
    }

    // Initial check
    checkAvailability()

    // Check again after voices load (Chrome loads async)
    const timeout = setTimeout(checkAvailability, 1000)

    return () => clearTimeout(timeout)
  }, [])

  // Update speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(ttsService.isSpeaking())
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const speak = useCallback(async (text: string) => {
    if (!isAvailable) return
    setIsSpeaking(true)
    try {
      await ttsService.speak(text)
    } finally {
      setIsSpeaking(false)
    }
  }, [isAvailable])

  const speakContent = useCallback(
    async (type: TTSContentType, data: Record<string, unknown>) => {
      if (!isAvailable) return
      setIsSpeaking(true)
      try {
        await ttsService.speakContent(type, data)
      } finally {
        setIsSpeaking(false)
      }
    },
    [isAvailable]
  )

  const stop = useCallback(() => {
    ttsService.stop()
    setIsSpeaking(false)
  }, [])

  const pause = useCallback(() => {
    ttsService.pause()
  }, [])

  const resume = useCallback(() => {
    ttsService.resume()
  }, [])

  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    ttsService.setSettings(newSettings)
    setSettings(ttsService.getSettings())
  }, [])

  return {
    isAvailable,
    isSpeaking,
    voices,
    settings,
    speak,
    speakContent,
    stop,
    pause,
    resume,
    updateSettings,
  }
}

/**
 * Hook para el boton de lectura de texto
 */
export function useSpeakButton(text: string | (() => string)) {
  const { isAvailable, isSpeaking, speak, stop } = useTTS()

  const handleClick = useCallback(() => {
    if (isSpeaking) {
      stop()
    } else {
      const textToSpeak = typeof text === 'function' ? text() : text
      speak(textToSpeak)
    }
  }, [isSpeaking, text, speak, stop])

  return {
    isAvailable,
    isSpeaking,
    onClick: handleClick,
  }
}
