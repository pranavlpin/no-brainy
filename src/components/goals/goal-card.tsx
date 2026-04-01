'use client'

import { Target, Calendar, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GoalResponse, GoalStatus } from '@/lib/types/goals'

const categoryColors: Record<string, 'green' | 'blue' | 'default' | 'orange'> = {
  fitness: 'green',
  learning: 'blue',
  work: 'default',
  personal: 'orange',
}

const statusConfig: Record<GoalStatus, { label: string; variant: 'green' | 'blue' | 'yellow' | 'gray' }> = {
  active: { label: 'Active', variant: 'blue' },
  completed: { label: 'Completed', variant: 'green' },
  paused: { label: 'Paused', variant: 'yellow' },
  abandoned: { label: 'Abandoned', variant: 'gray' },
}

function getProgressColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 50) return 'bg-blue-500'
  if (pct >= 25) return 'bg-yellow-500'
  return 'bg-gray-400'
}

interface GoalCardProps {
  goal: GoalResponse
  onClick: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const totalTasks = goal.taskCount ?? 0
  const completedTasks = goal.completedTaskCount ?? 0
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const habitCount = goal.habits?.length ?? 0

  const isOverdue =
    goal.targetDate &&
    goal.status === 'active' &&
    new Date(goal.targetDate) < new Date()

  const statusCfg = statusConfig[goal.status]
  const categoryVariant = goal.category
    ? categoryColors[goal.category.toLowerCase()] ?? 'default'
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full rounded-lg bg-white p-4 text-left shadow-sm',
        'border border-border transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'dark:bg-gray-900'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-foreground line-clamp-1">{goal.title}</h3>
        </div>
        <Badge variant={statusCfg.variant} className="shrink-0">
          {statusCfg.label}
        </Badge>
      </div>

      {categoryVariant && goal.category && (
        <div className="mt-2">
          <Badge variant={categoryVariant} className="text-xs">
            {goal.category}
          </Badge>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={cn('h-full rounded-full transition-all', getProgressColor(progressPct))}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {totalTasks > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedTasks}/{totalTasks} tasks
            </span>
          )}
          {habitCount > 0 && (
            <span>{habitCount} habit{habitCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {goal.targetDate && (
          <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-medium')}>
            <Calendar className="h-3.5 w-3.5" />
            {isOverdue ? 'Overdue' : new Date(goal.targetDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  )
}
