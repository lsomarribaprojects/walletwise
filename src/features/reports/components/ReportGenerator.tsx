'use client'

import { useState, useEffect } from 'react'
import { useReports, useReportFilters } from '../hooks/useReports'
import { ReportTypeSelector } from './ReportTypeSelector'
import { ReportFormatSelector } from './ReportFormatSelector'
import { ReportDateRangeSelector } from './ReportDateRangeSelector'
import { ReportPreview } from './ReportPreview'
import type { ReportType, ReportFormat, ReportFilters, ReportConfig } from '../types'
import { NeuButton, NeuCard } from '@/shared/components/ui'

interface ReportGeneratorProps {
  isPremium?: boolean
}

export function ReportGenerator({ isPremium = false }: ReportGeneratorProps) {
  const { getThisMonthFilter } = useReportFilters()
  const {
    isGenerating,
    isLoadingPreview,
    preview,
    error,
    generateReport,
    loadPreview,
    clearPreview,
  } = useReports()

  const [reportType, setReportType] = useState<ReportType | null>(null)
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [filters, setFilters] = useState<ReportFilters>(getThisMonthFilter())
  const [step, setStep] = useState<'type' | 'options' | 'preview'>('type')

  // Load preview when entering preview step
  useEffect(() => {
    if (step === 'preview' && reportType) {
      const config: ReportConfig = {
        type: reportType,
        format,
        filters,
        includeSummary: true,
        includeCharts: true,
      }
      loadPreview(config)
    }
  }, [step, reportType, format, filters, loadPreview])

  const handleTypeSelect = (type: ReportType) => {
    setReportType(type)
    setStep('options')
  }

  const handleBack = () => {
    if (step === 'options') {
      setStep('type')
    } else if (step === 'preview') {
      setStep('options')
      clearPreview()
    }
  }

  const handleNext = () => {
    if (step === 'options') {
      setStep('preview')
    }
  }

  const handleGenerate = async () => {
    if (!reportType) return

    const config: ReportConfig = {
      type: reportType,
      format,
      filters,
      includeSummary: true,
      includeCharts: true,
    }

    try {
      await generateReport(config)
    } catch (err) {
      // Error is handled by the hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['type', 'options', 'preview'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s
                  ? 'bg-blue-500 text-white'
                  : i < ['type', 'options', 'preview'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {i < ['type', 'options', 'preview'].indexOf(step) ? '✓' : i + 1}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-1 mx-2 rounded ${
                  i < ['type', 'options', 'preview'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 'type' && (
        <ReportTypeSelector
          selected={reportType}
          onSelect={handleTypeSelect}
          isPremium={isPremium}
        />
      )}

      {step === 'options' && (
        <div className="space-y-8">
          <ReportDateRangeSelector
            filters={filters}
            onChange={setFilters}
          />
          <ReportFormatSelector
            selected={format}
            onSelect={setFormat}
          />
        </div>
      )}

      {step === 'preview' && preview && (
        <ReportPreview data={preview} isLoading={isLoadingPreview} />
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-4 pt-4">
        {step !== 'type' && (
          <NeuButton
            variant="secondary"
            onClick={handleBack}
            className="flex-1"
          >
            Atras
          </NeuButton>
        )}

        {step === 'options' && (
          <NeuButton
            variant="primary"
            onClick={handleNext}
            className="flex-1"
          >
            Vista Previa
          </NeuButton>
        )}

        {step === 'preview' && (
          <NeuButton
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || isLoadingPreview}
            className="flex-1"
          >
            {isGenerating ? 'Generando...' : `Descargar ${format.toUpperCase()}`}
          </NeuButton>
        )}
      </div>
    </div>
  )
}
