'use client'

import { useState, useCallback } from 'react'
import type { ReportConfig, ReportData, ReportFilters } from '../types'
import {
  generateAndDownloadReport,
  getReportPreview,
  generateFilename,
} from '../services/reportService'

interface UseReportsReturn {
  isGenerating: boolean
  isLoadingPreview: boolean
  preview: ReportData | null
  error: string | null
  generateReport: (config: ReportConfig) => Promise<void>
  loadPreview: (config: ReportConfig) => Promise<void>
  clearPreview: () => void
}

export function useReports(): UseReportsReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [preview, setPreview] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(async (config: ReportConfig) => {
    setIsGenerating(true)
    setError(null)
    try {
      const filename = generateFilename(config)
      await generateAndDownloadReport(config, filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando reporte')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const loadPreview = useCallback(async (config: ReportConfig) => {
    setIsLoadingPreview(true)
    setError(null)
    try {
      const data = await getReportPreview(config)
      setPreview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando preview')
      throw err
    } finally {
      setIsLoadingPreview(false)
    }
  }, [])

  const clearPreview = useCallback(() => {
    setPreview(null)
    setError(null)
  }, [])

  return {
    isGenerating,
    isLoadingPreview,
    preview,
    error,
    generateReport,
    loadPreview,
    clearPreview,
  }
}

/**
 * Hook para obtener filtros predefinidos
 */
export function useReportFilters() {
  const getThisMonthFilter = (): ReportFilters => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    }
  }

  const getLastMonthFilter = (): ReportFilters => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    }
  }

  const getThisYearFilter = (): ReportFilters => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    }
  }

  const getLast3MonthsFilter = (): ReportFilters => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    }
  }

  const getLast6MonthsFilter = (): ReportFilters => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      dateRange: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
    }
  }

  return {
    getThisMonthFilter,
    getLastMonthFilter,
    getThisYearFilter,
    getLast3MonthsFilter,
    getLast6MonthsFilter,
  }
}
