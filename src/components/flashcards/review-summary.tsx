'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'

interface ReviewSummaryProps {
  cardsReviewed: number
  cardsEasy: number
  cardsMedium: number
  cardsHard: number
  cardsForgot: number
  onBackToDeck: () => void
}

export function ReviewSummary({
  cardsReviewed,
  cardsEasy,
  cardsMedium,
  cardsHard,
  cardsForgot,
  onBackToDeck,
}: ReviewSummaryProps) {
  const pct = (n: number) => (cardsReviewed > 0 ? Math.round((n / cardsReviewed) * 100) : 0)

  const breakdown = [
    { label: 'Easy', count: cardsEasy, pct: pct(cardsEasy), color: 'bg-green-500' },
    { label: 'Medium', count: cardsMedium, pct: pct(cardsMedium), color: 'bg-blue-500' },
    { label: 'Hard', count: cardsHard, pct: pct(cardsHard), color: 'bg-orange-500' },
    { label: 'Forgot', count: cardsForgot, pct: pct(cardsForgot), color: 'bg-red-500' },
  ]

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h2 className="text-2xl font-bold">Review Complete!</h2>
      <p className="text-muted-foreground">
        You reviewed <span className="font-semibold text-foreground">{cardsReviewed}</span> card
        {cardsReviewed !== 1 ? 's' : ''}
      </p>

      {/* Stacked bar */}
      {cardsReviewed > 0 && (
        <div className="w-full overflow-hidden rounded-full h-4 flex">
          {breakdown.map(
            (b) =>
              b.count > 0 && (
                <div
                  key={b.label}
                  className={`${b.color} h-full transition-all`}
                  style={{ width: `${b.pct}%` }}
                  title={`${b.label}: ${b.count}`}
                />
              )
          )}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${b.color}`} />
            <span className="text-muted-foreground">{b.label}</span>
            <span className="ml-auto font-medium">
              {b.count} ({b.pct}%)
            </span>
          </div>
        ))}
      </div>

      <Button onClick={onBackToDeck} className="mt-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Deck
      </Button>
    </div>
  )
}
