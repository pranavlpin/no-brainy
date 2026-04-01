'use client'

import { getMoodEmoji } from './mood-selector'
import { CheckCircle2, FileText, Brain } from 'lucide-react'
import type { DailyReviewResponse } from '@/lib/types/reviews'

interface ReviewCardProps {
  review: DailyReviewResponse
  onClick?: () => void
}

export function ReviewCard({ review, onClick }: ReviewCardProps) {
  const dateObj = new Date(review.reviewDate + 'T00:00:00')
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const moodEmoji = getMoodEmoji(review.mood)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Mood */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xl">
        {moodEmoji || '---'}
      </div>

      {/* Date and reflection preview */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{formatted}</p>
        {review.reflectionMd && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {review.reflectionMd.slice(0, 100)}
          </p>
        )}
      </div>

      {/* Stats summary */}
      <div className="flex flex-shrink-0 items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1" title="Tasks completed">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          {review.tasksCompleted}
        </span>
        <span className="flex items-center gap-1" title="Notes created">
          <FileText className="h-3.5 w-3.5 text-blue-500" />
          {review.notesCreated}
        </span>
        <span className="flex items-center gap-1" title="Cards reviewed">
          <Brain className="h-3.5 w-3.5 text-purple-500" />
          {review.cardsReviewed}
        </span>
      </div>
    </button>
  )
}
