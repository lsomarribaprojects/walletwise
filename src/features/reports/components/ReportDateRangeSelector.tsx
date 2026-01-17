'use client'

import { useState } from 'react'
import { ReportFilters } from '../types'
import { useReportFilters } from '../hooks/useReports'
import { NeuInput } from '@/shared/components/ui'

interface ReportDateRangeSelectorProps {
  filters: ReportFilters
  onChange: (filters: ReportFilters) => void
}

type PresetRange = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom'

export function ReportDateRangeSelector({
  filters,
  onChange,
}: ReportDateRangeSelectorProps) {
  const [preset, setPreset] = useState<PresetRange>('this_month')
  const {
    getThisMonthFilter,
    getLastMonthFilter,
    getThisYearFilter,
    getLast3MonthsFilter,
    getLast6MonthsFilter,
  } = useReportFilters()

  const presets: { value: PresetRange; label: string }[] = [
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: 'last_3_months', label: 'Ultimos 3 meses' },
    { value: 'last_6_months', label: 'Ultimos 6 meses' },
    { value: 'this_year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' },
  ]

  const handlePresetChange = (newPreset: PresetRange) => {
    setPreset(newPreset)

    if (newPreset !== 'custom') {
      let newFilters: ReportFilters

      switch (newPreset) {
        case 'this_month':
          newFilters = getThisMonthFilter()
          break
        case 'last_month':
          newFilters = getLastMonthFilter()
          break
        case 'last_3_months':
          newFilters = getLast3MonthsFilter()
          break
        case 'last_6_months':
          newFilters = getLast6MonthsFilter()
          break
        case 'this_year':
          newFilters = getThisYearFilter()
          break
        default:
          return
      }

      onChange(newFilters)
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setPreset('custom')
    onChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Periodo</h3>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePresetChange(p.value)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${preset === p.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-neu-bg shadow-neu-sm text-gray-600 hover:shadow-neu'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Fecha Inicio</label>
          <NeuInput
            type="date"
            value={filters.dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">Fecha Fin</label>
          <NeuInput
            type="date"
            value={filters.dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            min={filters.dateRange.startDate}
          />
        </div>
      </div>
    </div>
  )
}
