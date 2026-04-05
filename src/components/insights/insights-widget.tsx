'use client'

import Link from 'next/link'
import {
  Clock,
  Target,
  TrendingUp,
  Brain,
  Layers,
  Tag,
  AlertTriangle,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useInsights } from '@/hooks/use-insights'
import { cn } from '@/lib/utils'

const typeIcons: Record<string, LucideIcon> = {
  procrastination: Clock,
  workload: Layers,
  priority: Target,
  streak: TrendingUp,
  gap: Brain,
  time: Clock,
  topic: Tag,
}

const severityColors: Record<string, string> = {
  positive: 'text-green-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

export function InsightsWidget() {
  const { data, isLoading } = useInsights()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">AI Insights</h3>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const insights = data?.insights.slice(0, 3) ?? []

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
        <Link
          href="/insights"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No insights yet.{' '}
          <Link href="/insights" className="text-primary hover:underline">
            Generate some
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const Icon = typeIcons[insight.insightType] ?? AlertTriangle
            const iconColor = severityColors[insight.severity ?? 'info'] ?? 'text-muted-foreground'

            return (
              <div
                key={insight.id}
                className="flex items-start gap-2.5 rounded-md bg-muted/50 p-2.5"
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} />
                <p className="text-xs text-foreground line-clamp-2">{insight.contentMd}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
