'use client'

import {
  CheckCircle2,
  BookOpen,
  Brain,
  Flame,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import { StatCard } from '@/components/analytics/stat-card'
import { BarChart } from '@/components/analytics/bar-chart'
import { HorizontalBar } from '@/components/analytics/horizontal-bar'
import { ActivityHeatmap } from '@/components/analytics/activity-heatmap'
import { ExpenseAnalyticsSection } from '@/components/analytics/expense-analytics'
import { InsightsWidget } from '@/components/insights/insights-widget'
import { cn } from '@/lib/utils'

function ChartCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground p-5 shadow-sm',
        className
      )}
    >
      <h3 className="mb-4 text-sm font-semibold font-mono text-foreground">{title}</h3>
      {children}
    </div>
  )
}

function FlashcardStatsBar({
  stats,
}: {
  stats: { total: number; new: number; learning: number; review: number; mastered: number }
}) {
  if (stats.total === 0) {
    return <p className="text-sm text-muted-foreground">No flashcards yet</p>
  }

  const segments = [
    { label: 'New', value: stats.new, color: 'bg-blue-400' },
    { label: 'Learning', value: stats.learning, color: 'bg-yellow-400' },
    { label: 'Review', value: stats.review, color: 'bg-orange-400' },
    { label: 'Mastered', value: stats.mastered, color: 'bg-green-500' },
  ]

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-full">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className={cn('h-full transition-all', seg.color)}
              style={{ width: `${(seg.value / stats.total) * 100}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <div className={cn('h-2.5 w-2.5 rounded-full', seg.color)} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompletionRateChart({
  data,
}: {
  data: { date: string; completed: number; total: number }[]
}) {
  const maxCompleted = Math.max(...data.map((d) => d.completed), 1)

  return (
    <div className="flex items-end gap-px" style={{ height: 120 }}>
      {data.map((day) => {
        const rate = day.total > 0 ? day.completed / day.total : 0
        const barHeight =
          maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0

        return (
          <div
            key={day.date}
            className="flex-1 rounded-t transition-all bg-primary"
            style={{
              height: `${Math.max(barHeight, day.completed > 0 ? 4 : 0)}%`,
              minHeight: day.completed > 0 ? 2 : 0,
              opacity: Math.max(rate, 0.15),
            }}
            title={`${day.date}: ${day.completed}/${day.total}`}
          />
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border border-border bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-lg border border-border bg-muted"
          />
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useAnalytics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-retro-dark">Analytics</h1>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-retro-dark">Analytics</h1>
        <p className="text-muted-foreground">
          Failed to load analytics data. Please try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-retro-dark">Analytics</h1>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          value={data.totalTasksCompleted}
          label="Tasks Completed"
        />
        <StatCard
          icon={BookOpen}
          value={data.totalBooksRead}
          label="Books Read"
        />
        <StatCard
          icon={Brain}
          value={data.totalCardsReviewed}
          label="Cards Reviewed"
        />
        <StatCard
          icon={TrendingUp}
          value={`${data.habitCompletionRate}%`}
          label="Habit Completion"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Completion Rate */}
        <ChartCard title="Task Completion (Last 30 Days)">
          <CompletionRateChart data={data.taskCompletionRate} />
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{data.taskCompletionRate[0]?.date.slice(5)}</span>
            <span>
              {data.taskCompletionRate[data.taskCompletionRate.length - 1]?.date.slice(5)}
            </span>
          </div>
        </ChartCard>

        {/* Tasks by Priority */}
        <ChartCard title="Tasks by Priority">
          <HorizontalBar
            data={data.tasksByPriority.map((p) => ({
              label: p.priority,
              value: p.completed,
              total: p.count,
            }))}
          />
        </ChartCard>

        {/* Productivity by Day */}
        <ChartCard title="Productivity by Day">
          <BarChart
            data={data.tasksByDay.map((d) => ({
              label: d.day,
              value: d.count,
            }))}
            height={160}
          />
        </ChartCard>

        {/* Notes Created */}
        <ChartCard title="Notes Created (Last 8 Weeks)">
          <BarChart
            data={data.notesCreatedPerWeek.map((w) => ({
              label: w.week,
              value: w.count,
            }))}
            height={160}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Total notes: {data.totalNotes}
          </p>
        </ChartCard>

        {/* Flashcard Stats */}
        <ChartCard title="Flashcard Progress">
          <FlashcardStatsBar stats={data.flashcardStats} />
          <p className="mt-3 text-xs text-muted-foreground">
            {data.flashcardStats.total} total cards
          </p>
        </ChartCard>

        {/* Review Streak */}
        <ChartCard title="Review Streak">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="flex items-center gap-2">
              {data.reviewStreak > 0 && (
                <Flame className="h-8 w-8 text-orange-500" />
              )}
              <span className="text-5xl font-bold tabular-nums text-card-foreground">
                {data.reviewStreak}
              </span>
            </div>
            <span className="mt-2 text-sm text-muted-foreground">
              consecutive day{data.reviewStreak !== 1 ? 's' : ''}
            </span>
          </div>
        </ChartCard>

        {/* Most Active Hours */}
        <ChartCard title="Most Active Hours" className="md:col-span-2">
          <ActivityHeatmap data={data.mostActiveHours} />
        </ChartCard>

        {/* Expense Analytics */}
        <ChartCard title="Expenses" className="md:col-span-2">
          <ExpenseAnalyticsSection />
        </ChartCard>

        {/* AI Insights Widget */}
        <div className="md:col-span-2">
          <InsightsWidget />
        </div>
      </div>
    </div>
  )
}
