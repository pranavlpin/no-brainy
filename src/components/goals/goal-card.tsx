'use client'
import { ArrowUpRight, Leaf } from 'lucide-react'
import type { GoalResponse } from '@/lib/types/goals'
/** Show outcome evidence and action completion as separate facts, never as interchangeable scores. */
export function GoalCard({
  goal,
  onClick,
  practiceCount,
}: {
  goal: GoalResponse
  onClick: () => void
  practiceCount?: number
}) {
  const financial = goal.category === 'financial'
  return (
    <button
      type="button"
      data-testid={`goal-${goal.id}`}
      onClick={onClick}
      className="surface group flex h-full w-full flex-col p-6 text-left transition duration-200 hover:-translate-y-1 hover:shadow-soft-lg focus-visible:outline-ring motion-reduce:transform-none"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Leaf className="h-5 w-5" />
        </span>
        <span className="eyebrow">{goal.status === 'abandoned' ? 'archived' : goal.status}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{goal.title}</h2>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {goal.successCriteria ||
          goal.description ||
          'Define what meaningful progress would look like.'}
      </p>
      <div className="mt-auto space-y-3 pt-6 text-sm">
        {financial ? (
          <p>
            ₹{(goal.currentAmount ?? 0).toLocaleString('en-IN')} of ₹
            {(goal.targetAmount ?? 0).toLocaleString('en-IN')} tracked
          </p>
        ) : (
          <p>
            {goal.measurement == null
              ? 'No measurement recorded yet.'
              : `${goal.measurement} ${goal.unit ?? ''}`}
            {goal.measurement != null && goal.target != null && (
              <span className="text-muted-foreground"> · target {goal.target}</span>
            )}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>
            {goal.completedTaskCount ?? 0}/{goal.taskCount ?? 0} actions complete
          </span>
          {practiceCount !== undefined && (
            <span>
              {practiceCount}
              {goal.weeklyPracticeTarget ? `/${goal.weeklyPracticeTarget}` : ''} practices this week
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
