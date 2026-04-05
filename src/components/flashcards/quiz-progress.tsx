'use client'

import { useEffect, useState } from 'react'

interface QuizProgressProps {
  current: number
  total: number
  correctCount: number
  incorrectCount: number
  skippedCount: number
  timeLimitSec?: number | null
  startedAt?: string
  onTimeUp?: () => void
}

export function QuizProgress({
  current,
  total,
  correctCount,
  incorrectCount,
  skippedCount,
  timeLimitSec,
  startedAt,
  onTimeUp,
}: QuizProgressProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!timeLimitSec || !startedAt) return

    const startTime = new Date(startedAt).getTime()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, timeLimitSec - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        onTimeUp?.()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [timeLimitSec, startedAt, onTimeUp])

  const progressPercent = total > 0 ? (current / total) * 100 : 0
  const answered = correctCount + incorrectCount + skippedCount

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {Math.min(current + 1, total)} of {total}
        </span>

        <div className="flex items-center gap-3">
          {answered > 0 && (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-green-600">{correctCount}</span>
              <span>/</span>
              <span className="text-red-600">{incorrectCount}</span>
              {skippedCount > 0 && (
                <>
                  <span>/</span>
                  <span className="text-muted-foreground">{skippedCount}</span>
                </>
              )}
            </span>
          )}

          {timeLeft !== null && (
            <span
              className={`font-mono text-xs tabular-nums ${
                timeLeft <= 30 ? 'text-red-500 font-semibold' : ''
              }`}
            >
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
