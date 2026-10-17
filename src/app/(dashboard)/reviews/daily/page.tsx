'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Moon, Sparkles, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CloseDayFlow, type CloseDayPayload } from '@/components/reviews/close-day-flow'
import { MarkdownPreview } from '@/components/editor/markdown-preview'
import { FadeIn } from '@/components/motion'
import {
  useDailyReview,
  useCreateReview,
  useUpdateReview,
  useWeeklySummary,
} from '@/hooks/use-reviews'
import { useReviewAISummary } from '@/hooks/use-review-ai'
import { useAI } from '@/hooks/use-ai'
import { useUserToday } from '@/hooks/use-user-today'
import { useFocusSessions } from '@/hooks/use-focus-sessions'
import { useToast } from '@/hooks/use-toast'
import { formatDateKey, isValidDateKey } from '@/lib/dates'

function DailyReviewContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { today } = useUserToday()
  const requested = params.get('date')
  const date = requested && isValidDateKey(requested) ? requested : today
  const isToday = date === today

  const { data: existingReview, isLoading } = useDailyReview(date)
  const { data: weekly } = useWeeklySummary()
  const { data: focusDay } = useFocusSessions(date)
  const createReview = useCreateReview()
  const updateReview = useUpdateReview(date)
  const aiSummary = useReviewAISummary(date)
  const { isEnabled: aiEnabled } = useAI()
  const toast = useToast()

  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [aiSummaryMd, setAiSummaryMd] = useState<string | null>(null)

  const dateLabel = formatDateKey(date, { weekday: 'long', day: 'numeric', month: 'long' })

  const handleStart = () => {
    createReview.mutate(
      { reviewDate: date },
      {
        onSuccess: () => setStarted(true),
        onError: () => toast.show('Could not start the review', 'error'),
      }
    )
  }

  const handleFinish = (payload: CloseDayPayload) => {
    updateReview.mutate(payload, {
      onSuccess: () => {
        setFinished(true)
        toast.show(
          isToday ? 'Day closed. Tomorrow already knows its intent.' : 'Review saved',
          'success',
          {
            action: { label: 'See plan', onClick: () => router.push('/planner') },
          }
        )
      },
      onError: () => toast.show('Could not save the review', 'error'),
    })
  }

  const handleGenerateSummary = () => {
    aiSummary.mutate(undefined, { onSuccess: (res) => setAiSummaryMd(res.data.summaryMd) })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  const ready = started || !!existingReview

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/reviews')}
          aria-label="Back to reviews"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-retro-dark">
            {isToday ? 'Close the day' : 'Review'}
          </h1>
          <p className="font-mono text-sm text-retro-dark/60">{dateLabel}</p>
        </div>
      </div>

      {!ready ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-retro-blue/10">
              <Moon className="h-7 w-7 text-retro-blue" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-retro-dark">
              Ready to close {isToday ? 'the day' : dateLabel}?
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Four short steps. Your stats are gathered automatically; you add the meaning.
            </p>
            <Button
              className="mt-6"
              size="lg"
              onClick={handleStart}
              disabled={createReview.isPending}
              data-testid="close-day-start"
            >
              {createReview.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Start
            </Button>
          </Card>
        </FadeIn>
      ) : finished ? (
        <FadeIn>
          <Card className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-retro-mint/20">
              <Sparkles className="h-7 w-7 text-retro-mint" />
            </span>
            <p className="mt-4 font-display text-xl font-bold text-retro-dark">Day closed.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {existingReview?.tomorrowIntent
                ? `Tomorrow starts with: “${existingReview.tomorrowIntent}”`
                : 'Rest well.'}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button onClick={() => router.push('/planner')}>See tomorrow&apos;s plan</Button>
              <Button variant="outline" onClick={() => setFinished(false)}>
                Edit review
              </Button>
            </div>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn>
          <CloseDayFlow
            key={existingReview?.id ?? 'new'}
            stats={{
              tasksCompleted: existingReview?.tasksCompleted ?? 0,
              tasksMissed: existingReview?.tasksMissed ?? 0,
              notesCreated: existingReview?.notesCreated ?? 0,
              cardsReviewed: existingReview?.cardsReviewed ?? 0,
              focusMinutes: focusDay?.totalWorkMinutes ?? null,
              sessions: focusDay?.sessions,
            }}
            initial={{
              reflectionMd: existingReview?.reflectionMd,
              mood: existingReview?.mood,
              tomorrowIntent: existingReview?.tomorrowIntent,
            }}
            streak={weekly?.streak}
            isSaving={updateReview.isPending}
            onFinish={handleFinish}
          />
        </FadeIn>
      )}

      {ready && aiEnabled && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-retro-dark">AI recap</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={aiSummary.isPending}
            >
              {aiSummary.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {aiSummaryMd || existingReview?.aiSummaryMd ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
          {(aiSummaryMd ?? existingReview?.aiSummaryMd) && (
            <div className="mt-3 rounded-xl border border-border/60 bg-background/60">
              <MarkdownPreview content={aiSummaryMd ?? existingReview?.aiSummaryMd ?? ''} />
              {aiSummaryMd && aiSummaryMd !== existingReview?.aiSummaryMd && (
                <div className="border-t border-border/60 px-4 py-3">
                  <Button size="sm" onClick={() => updateReview.mutate({ aiSummaryMd })}>
                    <Save className="mr-2 h-3 w-3" />
                    Save recap
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default function DailyReviewPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-72 max-w-3xl rounded-2xl" />}>
      <DailyReviewContent />
    </Suspense>
  )
}
