/**
 * ScoreHistoryChart
 * Gráfico de línea con historial de credit scores
 */

'use client'

import { useMemo } from 'react'
import type { CreditScore } from '../types'
import { getScoreColor } from '../types'

interface ScoreHistoryChartProps {
  scores: CreditScore[]
  height?: number
  className?: string
}

export function ScoreHistoryChart({ scores, height = 300, className = '' }: ScoreHistoryChartProps) {
  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (scores.length === 0) return null

    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
    )

    const minScore = 300
    const maxScore = 850
    const scoreRange = maxScore - minScore

    // Calcular puntos para el path
    const padding = 40
    const chartWidth = 100 // porcentaje
    const chartHeight = height - padding * 2

    const points = sortedScores.map((score, index) => {
      const x = (index / (sortedScores.length - 1)) * chartWidth
      const y = ((maxScore - score.score) / scoreRange) * chartHeight

      return { x, y, score: score.score, date: score.score_date }
    })

    // Crear path SVG
    const pathD =
      points.length === 1
        ? `M ${points[0].x} ${points[0].y}`
        : points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    // Crear área debajo de la línea
    const areaD =
      points.length === 1
        ? ''
        : `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

    return { points, pathD, areaD, sortedScores }
  }, [scores, height])

  if (!chartData || scores.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score History</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No score history available
        </div>
      </div>
    )
  }

  const { points, pathD, areaD, sortedScores } = chartData
  const latestScore = sortedScores[sortedScores.length - 1].score
  const color = getScoreColor(latestScore)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Score History</h3>
        <div className="text-sm text-gray-500">
          {sortedScores.length} {sortedScores.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <GridLines height={height} />

          {/* Area under line */}
          <path
            d={areaD}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={color}
                className="cursor-pointer hover:r-2 transition-all"
              >
                <title>{`${point.score} on ${formatDate(point.date)}`}</title>
              </circle>
            </g>
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 -ml-10">
          <span>850</span>
          <span>740</span>
          <span>670</span>
          <span>580</span>
          <span>300</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{formatDate(sortedScores[0].score_date)}</span>
        <span>{formatDate(sortedScores[sortedScores.length - 1].score_date)}</span>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTES INTERNOS
// =====================================================

function GridLines({ height }: { height: number }) {
  const lines = [
    { y: 0, label: '850' },
    { y: 20, label: '740' },
    { y: 40, label: '670' },
    { y: 60, label: '580' },
    { y: 100, label: '300' }
  ]

  return (
    <g>
      {lines.map((line, index) => (
        <line
          key={index}
          x1="0"
          y1={(line.y / 100) * height}
          x2="100"
          y2={(line.y / 100) * height}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      ))}
    </g>
  )
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// =====================================================
// COMPACT VERSION (Mini chart for cards)
// =====================================================

interface MiniChartProps {
  scores: CreditScore[]
  height?: number
}

export function MiniScoreChart({ scores, height = 60 }: MiniChartProps) {
  const chartData = useMemo(() => {
    if (scores.length === 0) return null

    const sortedScores = [...scores].sort(
      (a, b) => new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
    )

    const minScore = Math.min(...sortedScores.map(s => s.score))
    const maxScore = Math.max(...sortedScores.map(s => s.score))
    const scoreRange = maxScore - minScore || 1

    const points = sortedScores.map((score, index) => {
      const x = (index / (sortedScores.length - 1)) * 100
      const y = ((maxScore - score.score) / scoreRange) * height

      return { x, y }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    return { pathD, latestScore: sortedScores[sortedScores.length - 1].score }
  }, [scores, height])

  if (!chartData) return null

  const color = getScoreColor(chartData.latestScore)

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path
        d={chartData.pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
