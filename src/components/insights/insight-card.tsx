'use client'

import {
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  Brain,
  Layers,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InsightCardProps {
  id: string
  insightType: string
  contentMd: string
  severity: string | null
  generatedAt: string | Date
  onDismiss: (id: string) => void
  isDismissing?: boolean
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  procrastination: { icon: Clock, color: 'text-orange-500', label: 'Procrastination' },
  workload: { icon: Layers, color: 'text-indigo-500', label: 'Workload' },
  priority: { icon: Target, color: 'text-red-500', label: 'Priority' },
  streak: { icon: TrendingUp, color: 'text-green-500', label: 'Streak' },
  gap: { icon: Brain, color: 'text-purple-500', label: 'Knowledge Gap' },
  time: { icon: Clock, color: 'text-blue-500', label: 'Time Patterns' },
  topic: { icon: Tag, color: 'text-teal-500', label: 'Topics' },
}

const severityStyles: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  positive: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    badgeText: 'Positive',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    badgeText: 'Info',
  },
  warning: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    badgeText: 'Warning',
  },
}

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function InsightCard({
  id,
  insightType,
  contentMd,
  severity,
  generatedAt,
  onDismiss,
  isDismissing,
}: InsightCardProps) {
  const type = typeConfig[insightType] ?? {
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    label: insightType,
  }
  const sev = severityStyles[severity ?? 'info'] ?? severityStyles.info

  const Icon = type.icon

  return (
    <div
      className={cn(
        'rounded-lg border border-border border-l-4 p-4 shadow-sm transition-colors',
        sev.border,
        sev.bg
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', type.color)} />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{type.label}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', sev.badge)}>
              {sev.badgeText}
            </span>
          </div>
          <p className="text-sm text-foreground">{contentMd}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generated {timeAgo(generatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          disabled={isDismissing}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Dismiss insight"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
