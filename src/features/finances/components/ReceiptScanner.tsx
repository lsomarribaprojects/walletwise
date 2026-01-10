'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, Sparkles, RotateCcw, Check } from 'lucide-react'
import { NeuButton } from '@/shared/components/ui/NeuButton'

export interface ExtractedReceiptData {
  monto: number | null
  comercio: string | null
  categoria: string | null
  fecha: string | null
  descripcion: string | null
  metodoPago: string | null
  confianza: number
}

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedReceiptData) => void
  onClose: () => void
  cuentas: string[]
}

export function ReceiptScanner({ onDataExtracted, onClose, cuentas }: ReceiptScannerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
      setError(null)
      setExtractedData(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setStream(mediaStream)
      setShowCamera(true)
      setError(null)

      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      setError('No se pudo acceder a la camara. Usa la opcion de subir imagen.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setImage(dataUrl)
      setExtractedData(null)
      stopCamera()
    }
  }, [stopCamera])

  const processImage = useCallback(async () => {
    if (!image) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/receipt-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          cuentas
        })
      })

      if (!response.ok) {
        throw new Error('Error al procesar el recibo')
      }

      const data: ExtractedReceiptData = await response.json()
      setExtractedData(data)
    } catch (err) {
      console.error('Processing error:', err)
      setError('Error al analizar el recibo. Intenta con otra imagen.')
    } finally {
      setIsProcessing(false)
    }
  }, [image, cuentas])

  const handleUseData = useCallback(() => {
    if (extractedData) {
      onDataExtracted(extractedData)
      onClose()
    }
  }, [extractedData, onDataExtracted, onClose])

  const resetScanner = useCallback(() => {
    setImage(null)
    setExtractedData(null)
    setError(null)
    stopCamera()
  }, [stopCamera])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neu-bg/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-neu-bg shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff,0_4px_30px_rgba(0,0,0,0.1)] rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Escanear Recibo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neu-bg shadow-neu hover:shadow-neu-inset transition-shadow"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Camera view */}
        {showCamera && (
          <div className="mb-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="p-3 bg-white/90 rounded-full shadow-lg"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="p-4 bg-purple-500 rounded-full shadow-lg"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image preview */}
        {image && !showCamera && (
          <div className="mb-4">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={image}
                alt="Recibo capturado"
                className="w-full h-auto max-h-64 object-contain"
              />
              <button
                onClick={resetScanner}
                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-lg"
              >
                <RotateCcw className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}

        {/* No image state */}
        {!image && !showCamera && (
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Toma una foto o sube una imagen del recibo
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <NeuButton
                  onClick={startCamera}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Usar Camara
                </NeuButton>
                <NeuButton
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir Imagen
                </NeuButton>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Extracted data preview */}
        {extractedData && (
          <div className="mb-4 p-4 bg-purple-50 rounded-2xl border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">Datos extraidos</span>
              <span className="text-xs text-purple-600 ml-auto">
                {Math.round(extractedData.confianza * 100)}% confianza
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {extractedData.monto && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-medium">${extractedData.monto.toFixed(2)}</span>
                </div>
              )}
              {extractedData.comercio && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Comercio:</span>
                  <span className="font-medium">{extractedData.comercio}</span>
                </div>
              )}
              {extractedData.categoria && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoria:</span>
                  <span className="font-medium">{extractedData.categoria}</span>
                </div>
              )}
              {extractedData.fecha && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{extractedData.fecha}</span>
                </div>
              )}
              {extractedData.metodoPago && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Metodo de pago:</span>
                  <span className="font-medium">{extractedData.metodoPago}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Action buttons */}
        {image && !showCamera && (
          <div className="flex gap-3">
            {!extractedData ? (
              <NeuButton
                onClick={processImage}
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Extraer Datos
                  </>
                )}
              </NeuButton>
            ) : (
              <>
                <NeuButton
                  onClick={resetScanner}
                  variant="secondary"
                  className="flex-1"
                >
                  Otra Imagen
                </NeuButton>
                <NeuButton
                  onClick={handleUseData}
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Usar Datos
                </NeuButton>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
