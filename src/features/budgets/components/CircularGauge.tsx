'use client'

interface CircularGaugeProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

export function CircularGauge({
  percentage,
  size = 120,
  strokeWidth = 8,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  // Colores según porcentaje
  const getStrokeColor = () => {
    if (percentage <= 50) return '#22C55E' // green-500
    if (percentage <= 75) return '#FBBF24' // yellow-500
    if (percentage <= 90) return '#F97316' // orange-500
    return '#EF4444' // red-500
  }

  const getBackgroundColor = () => {
    if (percentage <= 50) return '#DCFCE7' // green-100
    if (percentage <= 75) return '#FEF3C7' // yellow-100
    if (percentage <= 90) return '#FFEDD5' // orange-100
    return '#FEE2E2' // red-100
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getBackgroundColor()}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              percentage > 100
                ? 'text-red-600'
                : percentage > 90
                ? 'text-orange-600'
                : percentage > 75
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}
          >
            {percentage.toFixed(0)}%
          </div>
          {percentage > 100 && (
            <div className="text-xs text-red-600 font-medium mt-1">
              Excedido
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
