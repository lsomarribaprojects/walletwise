'use client'

import { ReportFormat, REPORT_FORMAT_CONFIG } from '../types'

interface ReportFormatSelectorProps {
  selected: ReportFormat
  onSelect: (format: ReportFormat) => void
}

export function ReportFormatSelector({
  selected,
  onSelect,
}: ReportFormatSelectorProps) {
  const formats = Object.entries(REPORT_FORMAT_CONFIG) as [ReportFormat, typeof REPORT_FORMAT_CONFIG[ReportFormat]][]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Formato de Exportacion</h3>
      <div className="flex gap-3">
        {formats.map(([format, config]) => {
          const isSelected = selected === format

          return (
            <button
              key={format}
              onClick={() => onSelect(format)}
              className={`
                flex-1 p-4 rounded-xl text-center transition-all
                ${isSelected
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
                  : 'bg-neu-bg shadow-neu hover:shadow-neu-sm'
                }
              `}
            >
              <span className="text-3xl">{config.icon}</span>
              <p className="mt-2 font-medium text-gray-800">{config.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
