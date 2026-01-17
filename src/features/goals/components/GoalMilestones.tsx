'use client'

import { Milestone } from '../types'

interface GoalMilestonesProps {
  milestones: Milestone[]
  currentAmount: number
  targetAmount: number
}

export function GoalMilestones({
  milestones,
  currentAmount,
  targetAmount,
}: GoalMilestonesProps) {
  const currentPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">Hitos</h4>

      {/* Timeline */}
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div
          className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-green-400 to-green-600 transition-all duration-500"
          style={{
            height: `${Math.min(currentPercentage, 100)}%`,
          }}
        />

        {/* Milestone items */}
        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const milestonePercentage = (milestone.targetAmount / targetAmount) * 100
            const isReached = !!milestone.reachedAt
            const isNext = !isReached && currentPercentage < milestonePercentage &&
              (index === 0 || milestones[index - 1].reachedAt)

            return (
              <div
                key={milestone.id}
                className={`relative flex items-center gap-4 pl-2 ${
                  isNext ? 'scale-105' : ''
                } transition-transform`}
              >
                {/* Circle indicator */}
                <div
                  className={`
                    relative z-10 w-5 h-5 rounded-full flex items-center justify-center
                    ${isReached
                      ? 'bg-green-500 text-white'
                      : isNext
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-500'
                    }
                  `}
                >
                  {isReached ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs">{milestone.icon || '🎯'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isReached
                          ? 'text-green-600'
                          : isNext
                            ? 'text-blue-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {milestone.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ${milestone.targetAmount.toLocaleString('es-MX')}
                    </span>
                  </div>

                  {isReached && milestone.reachedAt && (
                    <p className="text-xs text-green-500 mt-0.5">
                      Alcanzado el {new Date(milestone.reachedAt).toLocaleDateString('es-MX')}
                    </p>
                  )}

                  {isNext && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      Faltan ${(milestone.targetAmount - currentAmount).toLocaleString('es-MX')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
