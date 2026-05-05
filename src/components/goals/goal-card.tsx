'use client'

import { Target, Calendar, CheckCircle2, IndianRupee } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GoalResponse, GoalStatus } from '@/lib/types/goals'

const categoryColors: Record<string, 'green' | 'blue' | 'default' | 'orange' | 'yellow'> = {
  fitness: 'green',
  learning: 'blue',
  work: 'default',
  personal: 'orange',
  financial: 'yellow',
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface GoalCardProps {
  goal: GoalResponse
  onClick: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const isFinancial = goal.category === 'financial' && goal.targetAmount

  const totalTasks = goal.taskCount ?? 0
  const completedTasks = goal.completedTaskCount ?? 0
  const hasTaskProgress = !isFinancial && totalTasks > 0
  const progressPct = isFinancial
    ? (goal.financialProgress ?? 0)
    : goal.status === 'completed'
      ? 100
      : hasTaskProgress
        ? Math.round((completedTasks / totalTasks) * 100)
        : null

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
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={categoryVariant} className="text-xs">
            {goal.category}
          </Badge>
          {isFinancial && goal.expenseCategoryName && (
            <span className="text-xs text-muted-foreground">
              {goal.expenseCategoryName}
            </span>
          )}
          {isFinancial && goal.expenseTag && !goal.expenseCategoryName && (
            <span className="text-xs text-muted-foreground">
              #{goal.expenseTag}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {progressPct !== null ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={cn('h-full rounded-full transition-all', getProgressColor(progressPct))}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          {isFinancial && progressPct === 0 && (goal.currentAmount ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground/70 mt-1">Log expenses to see progress</p>
          )}
        </div>
      ) : (
        goal.status === 'active' && !isFinancial && (
          <p className="mt-3 text-xs text-muted-foreground/70">Link tasks to track progress</p>
        )
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {isFinancial ? (
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {formatCurrency(goal.currentAmount ?? 0)} / {formatCurrency(goal.targetAmount!)}
            </span>
          ) : (
            totalTasks > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedTasks}/{totalTasks} tasks
              </span>
            )
          )}
        </div>
        {isFinancial && goal.startDate && goal.targetDate ? (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        ) : goal.targetDate ? (
          <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-medium')}>
            <Calendar className="h-3.5 w-3.5" />
            {isOverdue ? 'Overdue' : new Date(goal.targetDate).toLocaleDateString()}
          </span>
        ) : null}
      </div>
    </button>
  )
}
