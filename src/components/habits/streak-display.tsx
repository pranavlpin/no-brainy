'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  className?: string
}

export function StreakDisplay({ currentStreak, longestStreak, className }: StreakDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="flex items-center gap-2">
        {currentStreak > 0 && (
          <Flame className="h-6 w-6 text-orange-500" />
        )}
        <span className="text-3xl font-bold tabular-nums">{currentStreak}</span>
      </div>
      <span className="text-sm text-muted-foreground">day streak</span>
      <span className="text-xs text-muted-foreground mt-1">
        Longest: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
