'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuizSessionResponse, QuizCardData } from '@/lib/types/flashcards'

interface QuizResultsProps {
  session: QuizSessionResponse
  cards: QuizCardData[]
  onTryAgain: () => void
  onBackToDeck: () => void
}

export function QuizResults({
  session,
  cards,
  onTryAgain,
  onBackToDeck,
}: QuizResultsProps) {
  const { correctCount, incorrectCount, skippedCount, scorePercent, totalCards } =
    session

  const cardMap = new Map(cards.map((c) => [c.id, c]))

  return (
    <div className="space-y-8">
      {/* Score */}
      <div className="text-center space-y-2">
        <div
          className={cn(
            'text-6xl font-bold',
            scorePercent >= 80
              ? 'text-green-500'
              : scorePercent >= 50
                ? 'text-yellow-500'
                : 'text-red-500'
          )}
        >
          {scorePercent}%
        </div>
        <p className="text-muted-foreground">
          {correctCount} of {totalCards} correct
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-green-200 dark:border-green-900 p-3">
          <p className="text-2xl font-bold text-green-600">{correctCount}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-900 p-3">
          <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-2xl font-bold text-muted-foreground">{skippedCount}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
      </div>

      {/* Per-card review */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Card Review</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {session.answers.map((entry, idx) => {
            const card = cardMap.get(entry.cardId)
            if (!card) return null

            return (
              <div
                key={idx}
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  entry.answer === 'correct'
                    ? 'border-green-200 dark:border-green-900'
                    : entry.answer === 'incorrect'
                      ? 'border-red-200 dark:border-red-900'
                      : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{card.frontMd}</p>
                    <p className="text-muted-foreground mt-0.5 truncate">
                      {card.backMd}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-xs font-medium px-2 py-0.5 rounded',
                      entry.answer === 'correct'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : entry.answer === 'incorrect'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {entry.answer === 'correct'
                      ? 'Correct'
                      : entry.answer === 'incorrect'
                        ? 'Incorrect'
                        : 'Skipped'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button onClick={onTryAgain}>Try Again</Button>
        <Button variant="outline" onClick={onBackToDeck}>
          Back to Deck
        </Button>
      </div>
    </div>
  )
}
