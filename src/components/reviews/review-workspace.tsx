'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTodayPlan } from '@/hooks/use-planner'
import { useDailyReview, useWeeklyReview, useSaveReflection } from '@/hooks/use-reviews'
import { PageHeader, LoadingState, ErrorState } from '@/components/ui/workspace-states'
import { DailyEditor } from './daily-editor'
import { WeeklyEditor } from './weekly-editor'
import { weekStartFor } from '@/lib/growth/progress'
import { calendarDate, addCalendarDays } from '@/lib/dates/calendar'
import type { DailyReviewDetail, WeeklyReviewResponse } from '@/lib/types/reviews'
/** Suspense bounds URL state; the chosen local date remains pinned across midnight. */
export function ReviewWorkspace({ weekly = false }: { weekly?: boolean }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ReviewEntry weekly={weekly} />
    </Suspense>
  )
}
function ReviewEntry({ weekly }: { weekly: boolean }) {
  const params = useSearchParams(),
    router = useRouter(),
    [pinned, setPinned] = useState<string>()
  const initial = useTodayPlan(!pinned)
  useEffect(() => {
    if (initial.data && !initial.isFetching && !pinned)
      setPinned(initial.data.planDate.slice(0, 10))
  }, [initial.data, initial.isFetching, pinned])
  if (!pinned)
    return initial.isError ? (
      <ErrorState retry={() => void initial.refetch()} />
    ) : (
      <LoadingState label="Opening your reflection" />
    )
  const selected = params.get('date') ?? (weekly ? weekStartFor(pinned) : pinned)
  const valid =
    calendarDate(selected) && selected <= pinned && (!weekly || weekStartFor(selected) === selected)
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 py-8 sm:p-8">
      <Link href="/reviews" className="text-sm text-muted-foreground hover:text-primary">
        ← All reflections
      </Link>
      <PageHeader
        eyebrow={weekly ? 'A weekly pause' : 'A gentle shutdown'}
        title={weekly ? 'Make room for a better week.' : 'Let today be enough.'}
        description={
          weekly
            ? 'Notice the patterns. Choose one experiment. Leave space for life.'
            : 'Reflect, close open loops, and give tomorrow a clear beginning.'
        }
      >
        <label className="space-y-1 text-xs text-muted-foreground">
          {weekly ? 'Week beginning (Monday)' : 'Review date'}
          <input
            aria-label={weekly ? 'Week beginning (Monday)' : 'Review date'}
            type="date"
            value={selected}
            max={pinned}
            className="block rounded-xl border bg-background p-2.5 text-sm text-foreground"
            onChange={(event) => {
              if (calendarDate(event.target.value))
                router.push(
                  `/reviews/${weekly ? 'weekly' : 'daily'}?date=${weekly ? weekStartFor(event.target.value) : event.target.value}`
                )
            }}
          />
        </label>
      </PageHeader>
      {valid ? (
        <>
          <p className="text-xs text-muted-foreground">
            {selected}
            {weekly ? ` – ${addCalendarDays(selected, 6)}` : ''} · Your saved timezone
          </p>
          {weekly ? (
            <WeeklyRoute key={selected} date={selected} />
          ) : (
            <DailyRoute key={selected} date={selected} />
          )}
        </>
      ) : (
        <p role="alert">Choose today or an earlier {weekly ? 'Monday' : 'day'}.</p>
      )}
    </div>
  )
}
function DailyRoute({ date }: { date: string }) {
  const query = useDailyReview(date),
    save = useSaveReflection<DailyReviewDetail>('daily', date)
  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) return <ErrorState retry={() => void query.refetch()} />
  return (
    <DailyEditor
      review={query.data}
      save={save}
      reload={async () => (await query.refetch()).data}
    />
  )
}
function WeeklyRoute({ date }: { date: string }) {
  const query = useWeeklyReview(date),
    save = useSaveReflection<WeeklyReviewResponse>('weekly', date)
  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) return <ErrorState retry={() => void query.refetch()} />
  return (
    <WeeklyEditor
      review={query.data}
      save={save}
      reload={async () => (await query.refetch()).data}
    />
  )
}
