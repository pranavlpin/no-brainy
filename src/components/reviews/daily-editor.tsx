'use client'
import { useState } from 'react'
import { useDraftSave } from '@/hooks/use-draft-save'
import { useAI } from '@/hooks/use-ai'
import { useReviewAISummary } from '@/hooks/use-review-ai'
import { Button } from '@/components/ui/button'
import { SaveStatus } from '@/components/ui/save-status'
import { UnfinishedWork } from '@/components/planner/unfinished-work'
import { ReviewAnswer, ReviewAction, ReviewActivityView } from './review-fields'
import { addCalendarDays } from '@/lib/dates/calendar'
import type { DailyReviewDetail } from '@/lib/types/reviews'
/** Versioned answers survive failures; an optional recap stays a preview until explicitly saved. */
export function DailyEditor({
  review,
  save,
  reload,
}: {
  review: DailyReviewDetail
  save: (patch: Partial<DailyReviewDetail>, version: string) => Promise<DailyReviewDetail>
  reload: () => Promise<DailyReviewDetail | undefined>
}) {
  const draft = useDraftSave('daily-review', review, save, reload),
    value = draft.value!
  const ai = useAI(),
    summary = useReviewAISummary(review.reviewDate)
  const [preview, setPreview] = useState<string | null>(null),
    [error, setError] = useState('')
  const next = addCalendarDays(review.reviewDate, 1)
  return (
    <div className="space-y-8" data-testid={`daily-review-${review.reviewDate}`}>
      <ReviewActivityView activity={review.activity} />
      <section className="surface space-y-6 p-5 sm:p-8">
        <div>
          <p className="eyebrow">Close the day</p>
          <h2 className="mt-2 text-xl font-semibold">A little perspective.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A sentence is enough. Every question is optional.
          </p>
        </div>
        <ReviewAnswer
          id="review-moved"
          label="What moved forward?"
          value={value.whatMoved}
          onChange={(whatMoved) => draft.change({ whatMoved })}
        />
        <ReviewAnswer
          id="review-blockers"
          label="What got in the way?"
          value={value.blockers}
          onChange={(blockers) => draft.change({ blockers })}
        />
        <ReviewAction
          id={value.tomorrowTaskId}
          date={next}
          label="Choose tomorrow’s first action"
          onChange={(tomorrowTaskId) => draft.change({ tomorrowTaskId })}
        />
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            More room to reflect · optional
          </summary>
          <div className="mt-5 space-y-5">
            <ReviewAnswer
              id="review-long"
              label="Longer reflection (optional)"
              value={value.reflectionMd}
              onChange={(reflectionMd) => draft.change({ reflectionMd })}
              rows={7}
            />
            <div>
              <label htmlFor="review-mood" className="text-sm font-medium">
                How did the day feel? (optional)
              </label>
              <select
                id="review-mood"
                className="mt-2 block w-full rounded-xl border bg-background p-3 text-sm"
                value={value.mood ?? ''}
                onChange={(event) => draft.change({ mood: event.target.value || null })}
              >
                <option value="">Leave this blank</option>
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="okay">Okay</option>
                <option value="bad">Difficult</option>
              </select>
            </div>
          </div>
        </details>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SaveStatus {...draft} />
          <Button
            disabled={draft.state === 'saving' || draft.state === 'conflict'}
            onClick={() => {
              draft.change({ closedAt: new Date().toISOString() })
              void draft.flush()
            }}
          >
            Close this day
          </Button>
        </div>
        {value.closedAt && draft.state === 'saved' && (
          <p role="status" className="text-sm text-primary">
            Day closed. You can return whenever you need.
          </p>
        )}
      </section>
      <UnfinishedWork
        tasks={review.activity.unfinishedTasks}
        date={next}
        continueLabel={`Continue on ${next}`}
      />
      {(ai.isEnabled || value.aiSummaryMd) && (
        <section className="surface space-y-4 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Another perspective · optional</h2>
          {value.aiSummaryMd && (
            <p className="whitespace-pre-wrap text-sm leading-6">{value.aiSummaryMd}</p>
          )}
          {ai.isEnabled && (
            <>
              <p className="text-sm text-muted-foreground">
                Uses your saved answers and recorded activity. Save your draft before generating.
              </p>
              <Button
                variant="outline"
                disabled={draft.state !== 'saved' || summary.isPending}
                onClick={async () => {
                  setError('')
                  try {
                    setPreview((await summary.mutateAsync()).data.summaryMd)
                  } catch {
                    setError('Could not generate a recap. Your reflection is safe.')
                  }
                }}
              >
                {summary.isPending ? 'Preparing a recap…' : 'Preview an AI recap'}
              </Button>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {preview !== null && (
            <div className="space-y-3 rounded-xl border p-4">
              <ReviewAnswer
                id="recap-preview"
                label="Edit recap preview"
                value={preview}
                onChange={setPreview}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    draft.change({ aiSummaryMd: preview })
                    setPreview(null)
                  }}
                >
                  Save recap separately
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                  Dismiss recap
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
