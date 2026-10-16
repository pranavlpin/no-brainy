'use client'

import Link from 'next/link'
import { ArrowRight, CalendarCheck, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardLabel } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { SaveStatus } from '@/components/ui/save-status'
import { useDraftSave } from '@/hooks/use-draft-save'
import { useGoals } from '@/hooks/use-goals'
import { useTasks } from '@/hooks/use-tasks'
import { formatDateKey } from '@/lib/dates'
import { nextWeekStart } from '@/lib/reviews/weeks'
import { cn } from '@/lib/utils'
import type { WeeklyOutcome, WeeklyReviewResponse } from '@/lib/types/reviews'

interface WeeklyEditorProps {
  review: WeeklyReviewResponse
  today: string
  save: (patch: Partial<WeeklyReviewResponse>, version: string) => Promise<WeeklyReviewResponse>
  reload: () => Promise<WeeklyReviewResponse | undefined>
  /** Optional activity block rendered above the questions. */
  activity?: React.ReactNode
}

const OUTCOME_IDS = ['first', 'second', 'third'] as const

const FIELDS = [
  { key: 'stopDoing', testId: 'week-stop', label: 'Stop', hint: 'What cost more than it gave?' },
  { key: 'keepDoing', testId: 'week-keep', label: 'Keep', hint: 'What quietly worked?' },
  {
    key: 'startTrying',
    testId: 'week-try',
    label: 'Try',
    hint: 'One small experiment for next week.',
  },
] as const

/**
 * The weekly adjustment: Stop / Keep / Try, up to three next-week outcomes,
 * and next week's first action, which is planned onto Monday. Saves through
 * the draft queue so the state is always truthful.
 */
export function WeeklyEditor({ review, today, save, reload, activity }: WeeklyEditorProps) {
  const draft = useDraftSave<WeeklyReviewResponse>('weekly-review', review, save, reload)
  const value = draft.value ?? review
  const { data: goals } = useGoals({ status: 'active' })
  const { data: openTasks } = useTasks({
    status: 'active',
    sortBy: 'priority',
    sortOrder: 'desc',
    pageSize: 100,
  })
  const nextMonday = nextWeekStart(review.weekStart)
  const isCurrentOrPast = review.weekStart <= today

  const outcomeText = (id: string) => value.outcomes.find((o) => o.id === id)?.text ?? ''
  const setOutcome = (id: string, text: string) => {
    const rest = value.outcomes.filter((o) => o.id !== id)
    const next: WeeklyOutcome[] = text.trim() ? [...rest, { id, text }] : rest
    next.sort(
      (a, b) =>
        OUTCOME_IDS.indexOf(a.id as (typeof OUTCOME_IDS)[number]) -
        OUTCOME_IDS.indexOf(b.id as (typeof OUTCOME_IDS)[number])
    )
    draft.change({ outcomes: next })
  }

  return (
    <div className="space-y-5" data-testid={`weekly-review-${review.weekStart}`}>
      {activity}

      {goals && goals.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-retro-mint/20">
              <Target className="h-4 w-4 text-retro-dark" />
            </span>
            <div>
              <CardLabel>Goals this week</CardLabel>
              <p className="text-sm font-medium text-retro-dark">Practice and progress, no score</p>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {goals.map((g) => {
              const target = g.weeklyPracticeTarget ?? 0
              return (
                <li key={g.id} className="rounded-xl bg-background/70 px-3 py-2">
                  <Link
                    href={`/goals/${g.id}`}
                    className="text-sm font-medium text-retro-dark hover:underline"
                  >
                    {g.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-retro-dark/60">
                    {target > 0
                      ? `${g.practiceCount ?? 0}/${target} practice days`
                      : `${g.practiceCount ?? 0} practice days`}
                    {' · '}
                    {g.outcomePercent != null
                      ? `${g.outcomePercent}% to target`
                      : `${g.completedTaskCount ?? 0}/${g.taskCount ?? 0} actions`}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card>
        <CardLabel>One small adjustment</CardLabel>
        <h2 className="mt-1 font-display text-lg font-semibold text-retro-dark">
          Keep what helps. Change what doesn&apos;t.
        </h2>
        <div className="mt-4 space-y-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 flex items-baseline justify-between text-sm font-medium text-retro-dark">
                {f.label}
                <span className="font-mono text-[11px] font-normal text-retro-dark/50">
                  {f.hint}
                </span>
              </span>
              <textarea
                data-testid={f.testId}
                value={value[f.key]}
                onChange={(e) =>
                  draft.change({ [f.key]: e.target.value } as Partial<WeeklyReviewResponse>)
                }
                rows={2}
                maxLength={5000}
                className="w-full resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel>Next week, enough looks like…</CardLabel>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to three outcomes. Leaving space is a valid choice.
        </p>
        <div className="mt-3 space-y-2">
          {OUTCOME_IDS.map((id, index) => (
            <input
              key={id}
              data-testid={`week-outcome-${index + 1}`}
              aria-label={`Next-week outcome ${index + 1}`}
              value={outcomeText(id)}
              maxLength={500}
              onChange={(e) => setOutcome(id, e.target.value)}
              placeholder={index === 0 ? 'The one that matters most' : 'Optional'}
              className="w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm text-retro-dark placeholder:text-retro-dark/30 focus:border-retro-blue focus:outline-none focus:ring-2 focus:ring-retro-blue/30"
            />
          ))}
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <label
            htmlFor="week-next-action"
            className="flex items-center gap-2 text-sm font-medium text-retro-dark"
          >
            <CalendarCheck className="h-4 w-4 text-retro-blue" />
            Next week&apos;s first action
          </label>
          <p className="mb-2 mt-0.5 font-mono text-[11px] text-retro-dark/50">
            Planned for{' '}
            {formatDateKey(nextMonday, { weekday: 'long', day: 'numeric', month: 'short' })}. Its
            deadline is untouched.
          </p>
          <Select
            id="week-next-action"
            data-testid="week-next-action"
            value={value.nextTaskId ?? ''}
            onChange={(e) => draft.change({ nextTaskId: e.target.value || null })}
          >
            <option value="">Choose an open task…</option>
            {value.nextTask && !(openTasks ?? []).some((t) => t.id === value.nextTask!.id) && (
              <option value={value.nextTask.id}>{value.nextTask.title}</option>
            )}
            {(openTasks ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <SaveStatus
          state={draft.state}
          durable={draft.durable}
          retry={draft.retry}
          resolve={draft.resolve}
        />
        <div className="flex items-center gap-3">
          {value.closedAt && (
            <span className={cn('font-mono text-xs text-retro-dark/60')} role="status">
              Adjusted {formatDateKey(value.closedAt.slice(0, 10))}
            </span>
          )}
          <Button
            data-testid="week-save"
            disabled={draft.state === 'saving' || draft.state === 'conflict' || !isCurrentOrPast}
            onClick={() => {
              draft.change({ closedAt: value.closedAt ?? new Date().toISOString() })
              void draft.flush()
            }}
          >
            {value.closedAt ? 'Save changes' : 'Save weekly adjustment'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
