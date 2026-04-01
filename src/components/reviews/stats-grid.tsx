'use client'

import { CheckCircle2, XCircle, FileText, Brain } from 'lucide-react'

interface StatsGridProps {
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
}

const stats = [
  {
    key: 'tasksCompleted' as const,
    label: 'Tasks Completed',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    key: 'tasksMissed' as const,
    label: 'Tasks Missed',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    key: 'notesCreated' as const,
    label: 'Notes Created',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    key: 'cardsReviewed' as const,
    label: 'Cards Reviewed',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
]

export function StatsGrid(props: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className={`flex flex-col items-center gap-2 rounded-lg border border-border p-4 ${stat.bg}`}
          >
            <Icon className={`h-5 w-5 ${stat.color}`} />
            <span className="text-2xl font-bold tabular-nums">
              {props[stat.key]}
            </span>
            <span className="text-xs text-muted-foreground text-center">
              {stat.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
