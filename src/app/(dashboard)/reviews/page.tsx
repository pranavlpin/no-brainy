'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Calendar, BarChart3, CalendarCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewCard } from '@/components/reviews/review-card'
import { WeeklySummary } from '@/components/reviews/weekly-summary'
import { PageHeader } from '@/components/ui/workspace-states'
import {
  useDailyReviews,
  useDailyReview,
  useWeeklySummary,
  useWeeklyReview,
} from '@/hooks/use-reviews'
import { cn } from '@/lib/utils'
import { useUserToday } from '@/hooks/use-user-today'
import { weekStartFor } from '@/lib/reviews/weeks'

type Tab = 'daily' | 'weekly'

export default function ReviewsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('daily')

  const { today } = useUserToday()

  const { data: todayReview, isLoading: todayLoading } = useDailyReview(today)
  const { data: reviewsData, isLoading: reviewsLoading } = useDailyReviews()
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklySummary()
  const thisWeek = weekStartFor(today)
  const { data: weeklyReview } = useWeeklyReview(activeTab === 'weekly' ? thisWeek : undefined)

  const reviews = reviewsData ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Reflect"
        title="Reviews"
        description="Close each day, adjust each week. Numbers first, no judgement."
      >
        {!todayLoading && !todayReview && (
          <Button onClick={() => router.push('/reviews/daily')} data-testid="reviews-close-day">
            <Moon className="mr-2 h-4 w-4" />
            Close the day
          </Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="surface-glass flex gap-1 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'daily'
              ? 'bg-retro-blue/10 text-retro-dark font-mono'
              : 'text-retro-dark/40 hover:text-retro-dark/70 font-mono'
          )}
        >
          <Calendar className="h-4 w-4" />
          Daily
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'weekly'
              ? 'bg-retro-blue/10 text-retro-dark font-mono'
              : 'text-retro-dark/40 hover:text-retro-dark/70 font-mono'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Weekly
        </button>
      </div>

      {/* Daily Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {/* Today's review card if exists */}
          {todayLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : todayReview ? (
            <div>
              <p className="mb-2 text-xs font-medium font-mono uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              <ReviewCard review={todayReview} onClick={() => router.push('/reviews/daily')} />
            </div>
          ) : null}

          {/* Past reviews */}
          {reviewsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-mono text-sm text-muted-foreground">No reviews yet.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Nightly reviews help you reflect on progress and build momentum.
              </p>
              <Button size="sm" className="mt-4" onClick={() => router.push('/reviews/daily')}>
                <Moon className="mr-2 h-4 w-4" />
                Close your first day
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-medium font-mono uppercase tracking-wider text-muted-foreground">
                Past Reviews
              </p>
              <div className="space-y-2">
                {reviews
                  .filter((r) => r.reviewDate !== today)
                  .map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onClick={() => router.push(`/reviews/daily?date=${review.reviewDate}`)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Tab */}
      {activeTab === 'weekly' && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => router.push('/reviews/weekly')}
            data-testid="reviews-adjust-week"
            className={cn(
              'surface-glass hover-lift flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left',
              weeklyReview?.closedAt ? 'border-retro-mint/40' : 'border-retro-yellow/50'
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-retro-yellow/30">
              <CalendarCheck className="h-4 w-4 text-retro-dark" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-retro-dark/50">
                Weekly adjustment
              </span>
              <span className="block text-sm font-medium text-retro-dark">
                {weeklyReview?.closedAt
                  ? 'This week is adjusted. Revisit or look back.'
                  : 'Stop, keep, try. Then choose next week’s first action.'}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-retro-dark/40" />
          </button>
          {weeklyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 mx-auto" />
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : weeklyData ? (
            <WeeklySummary data={weeklyData} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
              <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No weekly data available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
