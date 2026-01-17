'use client'

interface BudgetProgressBarProps {
  spent: number
  budget: number
  className?: string
}

export function BudgetProgressBar({
  spent,
  budget,
  className = '',
}: BudgetProgressBarProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0

  // Colores según porcentaje
  const getColorClasses = () => {
    if (percentage <= 50) {
      return 'bg-green-500'
    } else if (percentage <= 75) {
      return 'bg-yellow-500'
    } else if (percentage <= 90) {
      return 'bg-orange-500'
    } else {
      return 'bg-red-500'
    }
  }

  const getBgColorClasses = () => {
    if (percentage <= 50) {
      return 'bg-green-100'
    } else if (percentage <= 75) {
      return 'bg-yellow-100'
    } else if (percentage <= 90) {
      return 'bg-orange-100'
    } else {
      return 'bg-red-100'
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="font-medium text-gray-700">
          ${spent.toFixed(2)} / ${budget.toFixed(2)}
        </span>
        <span
          className={`font-semibold ${
            percentage > 100
              ? 'text-red-600'
              : percentage > 90
              ? 'text-orange-600'
              : percentage > 75
              ? 'text-yellow-600'
              : 'text-green-600'
          }`}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className={`w-full h-3 rounded-full ${getBgColorClasses()}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColorClasses()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {percentage > 100 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">Presupuesto excedido</span>
        </div>
      )}
    </div>
  )
}
