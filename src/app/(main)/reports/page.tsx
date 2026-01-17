'use client'

import { ReportGenerator } from '@/features/reports'
import { NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'

export default function ReportsPage() {
  const { t } = useLanguage()
  // TODO: Get from subscription status
  const isPremium = true

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t.reports.title}</h1>
        <p className="text-gray-500 text-sm">
          {t.reports.subtitle}
        </p>
      </div>

      {/* Report Generator */}
      <NeuCard>
        <ReportGenerator isPremium={isPremium} />
      </NeuCard>

      {/* Info card */}
      <NeuCard size="sm" className="bg-blue-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-medium text-gray-800">Tip</h4>
            <p className="text-sm text-gray-600 mt-1">
              PDF reports open in a print window where you can save as PDF.
              Excel and CSV files download directly.
            </p>
          </div>
        </div>
      </NeuCard>
    </div>
  )
}
