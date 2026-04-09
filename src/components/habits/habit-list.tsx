'use client'

import { useState, useEffect } from 'react'
import { Check, Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { HabitResponse, HabitFrequency } from '@/lib/types/goals'
import { useLogHabit } from '@/hooks/use-goals'

const frequencyLabel: Record<HabitFrequency, { label: string; variant: 'blue' | 'green' | 'orange' }> = {
  daily: { label: 'Daily', variant: 'blue' },
  weekly: { label: 'Weekly', variant: 'green' },
  monthly: { label: 'Monthly', variant: 'orange' },
}

interface HabitListProps {
  habits: HabitResponse[]
  todayLogs: Record<string, boolean>
  goalNames?: Record<string, string>
}

function HabitRow({
  habit,
  isCheckedToday,
  goalName,
}: {
  habit: HabitResponse
  isCheckedToday: boolean
  goalName?: string
}) {
  const [optimisticChecked, setOptimisticChecked] = useState(isCheckedToday)
  const logMutation = useLogHabit(habit.id)

  // Sync with server state when it changes (after refetch)
  useEffect(() => {
    if (!logMutation.isPending) {
      setOptimisticChecked(isCheckedToday)
    }
  }, [isCheckedToday, logMutation.isPending])

  function handleToggle() {
    const newValue = !optimisticChecked
    setOptimisticChecked(newValue)
    const today = new Date().toISOString().slice(0, 10)
    logMutation.mutate(
      { logDate: today, completed: newValue },
      {
        onError: () => setOptimisticChecked(!newValue),
      }
    )
  }

  const streak = habit.currentStreak ?? 0
  const freq = frequencyLabel[habit.frequency]

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 dark:bg-gray-900">
      {/* Check-in button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-all',
          optimisticChecked
            ? 'border-green-500 bg-green-500 text-white scale-110'
            : 'border-gray-300 hover:border-green-400 dark:border-gray-600'
        )}
        aria-label={optimisticChecked ? 'Uncheck habit' : 'Check habit'}
      >
        {optimisticChecked && <Check className="h-4 w-4" />}
      </button>

      {/* Title and meta */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', optimisticChecked && 'text-muted-foreground line-through')}>
          {habit.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant={freq.variant} className="text-[10px] px-1.5 py-0">
            {freq.label}
          </Badge>
          {goalName && (
            <span className="text-xs text-muted-foreground truncate">
              {goalName}
            </span>
          )}
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-1 text-sm font-semibold text-orange-500 shrink-0">
          <Flame className="h-4 w-4" />
          <span>{streak}</span>
        </div>
      )}
    </div>
  )
}

export function HabitList({ habits, todayLogs, goalNames }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No habits yet. Create one to start tracking!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          isCheckedToday={todayLogs[habit.id] ?? false}
          goalName={habit.goalId && goalNames ? goalNames[habit.goalId] : undefined}
        />
      ))}
    </div>
  )
}
