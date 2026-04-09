'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewCard } from '@/components/reviews/review-card'
import { WeeklySummary } from '@/components/reviews/weekly-summary'
import { useDailyReviews, useDailyReview, useWeeklySummary } from '@/hooks/use-reviews'
import { cn } from '@/lib/utils'

type Tab = 'daily' | 'weekly'

export default function ReviewsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('daily')

  // Today's date in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]

  const { data: todayReview, isLoading: todayLoading } = useDailyReview(today)
  const { data: reviewsData, isLoading: reviewsLoading } = useDailyReviews()
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklySummary()

  const reviews = reviewsData ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-retro-dark">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Reflect on your progress and track your journey
          </p>
        </div>
        {!todayLoading && !todayReview && (
          <Button onClick={() => router.push('/reviews/daily')}>
            <Plus className="mr-2 h-4 w-4" />
            Start Today&apos;s Review
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-2 border-retro-dark/15 bg-white p-1">
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
              <ReviewCard
                review={todayReview}
                onClick={() => router.push('/reviews/daily')}
              />
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
              <p className="text-sm text-muted-foreground">
                No reviews yet. Start your first daily review!
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/reviews/daily')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Start Review
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
                    <ReviewCard key={review.id} review={review} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Tab */}
      {activeTab === 'weekly' && (
        <div>
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
              <p className="text-sm text-muted-foreground">
                No weekly data available yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
