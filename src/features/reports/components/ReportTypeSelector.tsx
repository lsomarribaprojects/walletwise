'use client'

import { ReportType, REPORT_TYPE_CONFIG } from '../types'
import { NeuCard } from '@/shared/components/ui'

interface ReportTypeSelectorProps {
  selected: ReportType | null
  onSelect: (type: ReportType) => void
  isPremium?: boolean
}

export function ReportTypeSelector({
  selected,
  onSelect,
  isPremium = false,
}: ReportTypeSelectorProps) {
  const reportTypes = Object.entries(REPORT_TYPE_CONFIG) as [ReportType, typeof REPORT_TYPE_CONFIG[ReportType]][]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Tipo de Reporte</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reportTypes.map(([type, config]) => {
          const isLocked = config.requiresPremium && !isPremium
          const isSelected = selected === type

          return (
            <button
              key={type}
              onClick={() => !isLocked && onSelect(type)}
              disabled={isLocked}
              className={`
                p-4 rounded-xl text-left transition-all
                ${isSelected
                  ? 'bg-blue-50 border-2 border-blue-400 shadow-md'
                  : isLocked
                    ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'bg-neu-bg shadow-neu hover:shadow-neu-sm'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{config.label}</span>
                    {config.requiresPremium && (
                      <span className="px-1.5 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                </div>
                {isSelected && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
