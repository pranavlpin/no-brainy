'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggerBlock, StaggerGroup } from '@/components/motion'
import { WeeklyEditor } from '@/components/reviews/weekly-editor'
import { WeeklySummary } from '@/components/reviews/weekly-summary'
import { saveWeeklyReview, useWeeklyReview, useWeeklySummary, WEEKLY_REVIEW_KEY } from '@/hooks/use-reviews'
import { useUserToday } from '@/hooks/use-user-today'
import { addDays, formatDateKey, isoWeekOf } from '@/lib/dates'
import { isMonday, weekStartFor } from '@/lib/reviews/weeks'
import type { WeeklyReviewResponse, WeeklyReviewUpdate } from '@/lib/types/reviews'

function WeeklyReviewContent() {
  const router = useRouter()
  const params = useSearchParams()
  const queryClient = useQueryClient()
  const { today } = useUserToday()
  const requested = params.get('week')
  const weekStart = requested && isMonday(requested) ? requested : weekStartFor(requested ?? today)

  // Non-Monday keys redirect to their Monday so there is one address per week.
  useEffect(() => {
    if (requested && requested !== weekStart) router.replace(`/reviews/weekly?week=${weekStart}`)
  }, [requested, weekStart, router])

  const { data: review, isLoading, refetch } = useWeeklyReview(weekStart)
  const { data: summary } = useWeeklySummary(isoWeekOf(weekStart))
  const isFuture = weekStart > today

  const save = async (patch: Partial<WeeklyReviewResponse>, version: string) => {
    const body: WeeklyReviewUpdate = { expectedUpdatedAt: version }
    if (patch.stopDoing !== undefined) body.stopDoing = patch.stopDoing
    if (patch.keepDoing !== undefined) body.keepDoing = patch.keepDoing
    if (patch.startTrying !== undefined) body.startTrying = patch.startTrying
    if (patch.reflectionMd !== undefined) body.reflectionMd = patch.reflectionMd
    if (patch.outcomes !== undefined) body.outcomes = patch.outcomes
    if (patch.nextTaskId !== undefined) body.nextTaskId = patch.nextTaskId
    if (patch.closedAt !== undefined) body.closeReview = !!patch.closedAt
    const saved = await saveWeeklyReview(weekStart, body)
    queryClient.setQueryData([...WEEKLY_REVIEW_KEY, weekStart], saved)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['planner'] })
    queryClient.invalidateQueries({ queryKey: ['home'] })
    return saved
  }

  return (
    <StaggerGroup className="mx-auto max-w-3xl space-y-5">
      <StaggerBlock>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/reviews')} aria-label="Back to reviews">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-retro-dark/50">Weekly adjustment</p>
            <h1 className="font-display text-2xl font-bold text-retro-dark">
              {formatDateKey(weekStart, { day: 'numeric', month: 'short' })} – {formatDateKey(addDays(weekStart, 6), { day: 'numeric', month: 'short' })}
            </h1>
          </div>
          <nav aria-label="Weeks" className="flex items-center gap-1">
            <Link href={`/reviews/weekly?week=${addDays(weekStart, -7)}`} aria-label="Previous week" className="rounded-full p-2 text-retro-dark/60 hover:bg-retro-dark/5 hover:text-retro-dark">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            {weekStart !== weekStartFor(today) && (
              <Link href="/reviews/weekly" className="rounded-full px-2 py-1 font-mono text-[11px] text-retro-blue hover:underline">
                <RotateCcw className="mr-1 inline h-3 w-3" />
                This week
              </Link>
            )}
            <Link
              href={`/reviews/weekly?week=${addDays(weekStart, 7)}`}
              aria-label="Next week"
              aria-disabled={isFuture || undefined}
              className={`rounded-full p-2 text-retro-dark/60 hover:bg-retro-dark/5 hover:text-retro-dark ${isFuture ? 'pointer-events-none opacity-30' : ''}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </StaggerBlock>

      {isLoading || !review ? (
        <StaggerBlock>
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </StaggerBlock>
      ) : (
        <StaggerBlock>
          <WeeklyEditor
            key={review.id}
            review={review}
            today={today}
            save={save}
            reload={async () => (await refetch()).data}
            activity={
              summary ? (
                <div className="surface-glass rounded-2xl p-4">
                  <WeeklySummary data={summary} />
                </div>
              ) : null
            }
          />
        </StaggerBlock>
      )}
    </StaggerGroup>
  )
}

export default function WeeklyReviewPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-3xl rounded-2xl" />}>
      <WeeklyReviewContent />
    </Suspense>
  )
}
