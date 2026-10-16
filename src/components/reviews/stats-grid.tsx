'use client'

import { CheckCircle2, XCircle, FileText, Brain } from 'lucide-react'
import { AnimatedNumber } from '@/components/motion/animated-number'

interface StatsGridProps {
  tasksCompleted: number
  tasksMissed: number
  notesCreated: number
  cardsReviewed: number
}

const stats = [
  {
    key: 'tasksCompleted' as const,
    label: 'Tasks done',
    icon: CheckCircle2,
    color: 'text-retro-mint',
    accent: 'border-t-retro-mint',
  },
  {
    key: 'tasksMissed' as const,
    label: 'Tasks missed',
    icon: XCircle,
    color: 'text-retro-pink',
    accent: 'border-t-retro-pink',
  },
  {
    key: 'notesCreated' as const,
    label: 'Notes created',
    icon: FileText,
    color: 'text-retro-blue',
    accent: 'border-t-retro-blue',
  },
  {
    key: 'cardsReviewed' as const,
    label: 'Cards reviewed',
    icon: Brain,
    color: 'text-retro-orange',
    accent: 'border-t-retro-yellow',
  },
]

export function StatsGrid(props: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className={`surface-glass flex flex-col items-center gap-1.5 rounded-2xl border-t-3 p-4 ${stat.accent}`}
          >
            <Icon className={`h-5 w-5 ${stat.color}`} />
            <AnimatedNumber
              value={props[stat.key]}
              className="font-display text-2xl font-bold tabular-nums text-retro-dark"
              data-testid={`stat-${stat.key}`}
            />
            <span className="text-center font-mono text-[11px] uppercase tracking-wider text-retro-dark/50">
              {stat.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
