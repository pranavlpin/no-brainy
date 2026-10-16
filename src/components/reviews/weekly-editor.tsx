'use client'
import Link from 'next/link'
import { useDraftSave } from '@/hooks/use-draft-save'
import { useGrowth } from '@/hooks/use-growth'
import { Button } from '@/components/ui/button'
import { SaveStatus } from '@/components/ui/save-status'
import { ErrorState, LoadingState } from '@/components/ui/workspace-states'
import { ReviewAnswer, ReviewAction, ReviewActivityView } from './review-fields'
import { addCalendarDays } from '@/lib/dates/calendar'
import type { WeeklyReviewResponse } from '@/lib/types/reviews'
/** A small weekly experiment, explicit commitments and visible source context without automatic scoring. */
export function WeeklyEditor({
  review,
  save,
  reload,
}: {
  review: WeeklyReviewResponse
  save: (patch: Partial<WeeklyReviewResponse>, version: string) => Promise<WeeklyReviewResponse>
  reload: () => Promise<WeeklyReviewResponse | undefined>
}) {
  const draft = useDraftSave('weekly-review', review, save, reload),
    value = draft.value!
  const growth = useGrowth(undefined, review.weekStart)
  const next = addCalendarDays(review.weekStart, 7)
  return (
    <div className="space-y-8">
      <ReviewActivityView activity={review.activity} />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Directions and practice</h2>
        <p className="text-sm text-muted-foreground">
          Current goal and project status, with practice recorded during this week.
        </p>
        {growth.isLoading ? (
          <LoadingState />
        ) : growth.isError ? (
          <ErrorState retry={() => void growth.refetch()} />
        ) : growth.data?.goals.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {growth.data.goals.map((goal) => (
              <article key={goal.id} className="surface p-5">
                <Link href={`/goals/${goal.id}`} className="font-medium hover:text-primary">
                  {goal.title}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  {goal.practiceCount} practices this week · {goal.completedTaskCount ?? 0}/
                  {goal.taskCount ?? 0} linked actions complete
                </p>
                {goal.successCriteria && <p className="mt-2 text-sm">{goal.successCriteria}</p>}
                {goal.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="mt-2 block text-sm text-primary"
                  >
                    {project.title} · {project.status}
                  </Link>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <p className="surface-soft p-5 text-sm text-muted-foreground">
            Your goals and practice will appear here as you add them.
          </p>
        )}
      </section>
      <section className="surface space-y-6 p-5 sm:p-8">
        <div>
          <p className="eyebrow">One small adjustment</p>
          <h2 className="mt-2 text-xl font-semibold">Keep what helps. Change what doesn’t.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reflect on obstacles without turning the week into a score.
          </p>
        </div>
        <ReviewAnswer
          id="week-stop"
          label="Stop"
          value={value.stopDoing}
          onChange={(stopDoing) => draft.change({ stopDoing })}
        />
        <ReviewAnswer
          id="week-keep"
          label="Keep"
          value={value.keepDoing}
          onChange={(keepDoing) => draft.change({ keepDoing })}
        />
        <ReviewAnswer
          id="week-try"
          label="Try"
          value={value.startTrying}
          onChange={(startTrying) => draft.change({ startTrying })}
        />
        <ReviewAnswer
          id="week-reflection"
          label="Weekly reflection (optional)"
          value={value.reflectionMd}
          onChange={(reflectionMd) => draft.change({ reflectionMd })}
        />
        <div>
          <h3 className="font-medium">Next week, enough looks like…</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose up to three outcomes. Leaving space is a valid choice.
          </p>
        </div>
        {(['first', 'second', 'third'] as const).map((id, index) => (
          <div key={id}>
            <label htmlFor={`outcome-${id}`} className="text-sm font-medium">
              Next-week outcome {index + 1}
            </label>
            <input
              id={`outcome-${id}`}
              className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm"
              maxLength={500}
              value={value.outcomes.find((item) => item.id === id)?.text ?? ''}
              onChange={(event) => {
                const remaining = value.outcomes.filter((item) => item.id !== id)
                draft.change({
                  outcomes: event.target.value.trim()
                    ? [...remaining, { id, text: event.target.value }]
                    : remaining,
                })
              }}
            />
          </div>
        ))}
        <ReviewAction
          id={value.nextTaskId}
          date={next}
          label="Choose next week’s first action"
          onChange={(nextTaskId) => draft.change({ nextTaskId })}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SaveStatus {...draft} />
          <Button
            disabled={draft.state === 'saving' || draft.state === 'conflict'}
            onClick={() => {
              draft.change({ closedAt: new Date().toISOString() })
              void draft.flush()
            }}
          >
            Save weekly adjustment
          </Button>
        </div>
        {value.closedAt && draft.state === 'saved' && (
          <p role="status" className="text-sm text-primary">
            Weekly adjustment saved. Leave room for life.
          </p>
        )}
      </section>
    </div>
  )
}
