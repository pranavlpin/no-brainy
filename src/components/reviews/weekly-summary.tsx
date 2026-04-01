'use client'

import { CheckCircle2, FileText, Brain, TrendingUp, Flame } from 'lucide-react'
import { getMoodEmoji } from './mood-selector'
import type { WeeklySummaryResponse } from '@/lib/types/reviews'

interface WeeklySummaryProps {
  data: WeeklySummaryResponse
}

export function WeeklySummary({ data }: WeeklySummaryProps) {
  return (
    <div className="space-y-6">
      {/* Week header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          Week of {formatDate(data.startDate)} &ndash; {formatDate(data.endDate)}
        </h3>
        <p className="text-sm text-muted-foreground">{data.week}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          value={data.totalTasksCompleted}
          label="Tasks Completed"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-500" />}
          value={data.totalNotesCreated}
          label="Notes Created"
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-purple-500" />}
          value={data.totalCardsReviewed}
          label="Cards Reviewed"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
          value={`${data.completionRate}%`}
          label="Completion Rate"
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          value={data.streak}
          label="Day Streak"
        />
      </div>

      {/* Day-by-day breakdown */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
          Daily Breakdown
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {data.dailyBreakdown.map((day) => {
            const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString(
              'en-US',
              { weekday: 'short' }
            )
            return (
              <div
                key={day.date}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center ${
                  day.hasReview
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {dayLabel}
                </span>
                <span className="text-sm">
                  {day.hasReview ? getMoodEmoji(day.mood) || '\u2713' : '\u2014'}
                </span>
                {day.hasReview && (
                  <span className="text-[10px] text-muted-foreground">
                    {day.tasksCompleted}t
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3">
      {icon}
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
