'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewCard } from '@/components/flashcards/review-card'
import { RatingButtons } from '@/components/flashcards/rating-buttons'
import { ReviewSummary } from '@/components/flashcards/review-summary'
import { useStartReview, useRateCard, useCompleteReview } from '@/hooks/use-flashcards'
import type { FlashcardResponse, ReviewRating, ReviewSessionResponse } from '@/lib/types/flashcards'

type ReviewState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'reviewing'; session: ReviewSessionResponse; cards: FlashcardResponse[]; index: number; flipped: boolean }
  | { phase: 'done'; session: ReviewSessionResponse; counts: Record<ReviewRating, number> }

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.id as string

  const startReview = useStartReview(deckId)
  const rateCard = useRateCard()

  const [state, setState] = useState<ReviewState>({ phase: 'loading' })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<ReviewRating, number>>({ easy: 0, medium: 0, hard: 0, forgot: 0 })

  // We need to call completeReview with the session ID once known
  const completeReview = useCompleteReview(sessionId ?? '')

  // Start review on mount
  const [started, setStarted] = useState(false)
  if (!started) {
    setStarted(true)
    startReview
      .mutateAsync()
      .then((data) => {
        if (data.cards.length === 0) {
          setState({
            phase: 'done',
            session: data.session,
            counts: { easy: 0, medium: 0, hard: 0, forgot: 0 },
          })
        } else {
          setSessionId(data.session.id)
          setState({ phase: 'reviewing', session: data.session, cards: data.cards, index: 0, flipped: false })
        }
      })
      .catch(() => {
        setState({ phase: 'error', message: 'Failed to start review session.' })
      })
  }

  const handleFlip = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'reviewing') return prev
      return { ...prev, flipped: true }
    })
  }, [])

  // Space key to flip card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && state.phase === 'reviewing' && !state.flipped) {
        e.preventDefault()
        handleFlip()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state, handleFlip])

  const handleRate = useCallback(
    async (rating: ReviewRating) => {
      if (state.phase !== 'reviewing') return
      const { session, cards, index } = state
      const card = cards[index]

      // Optimistic UI: move to next card immediately
      const newCounts: Record<ReviewRating, number> = { ...counts, [rating]: counts[rating] + 1 }
      setCounts(newCounts)

      // Fire the rating request
      rateCard.mutate({ cardId: card.id, rating })

      const nextIndex = index + 1
      if (nextIndex >= cards.length) {
        // Session complete
        setState({ phase: 'done', session, counts: newCounts })
        if (sessionId) {
          completeReview.mutate()
        }
      } else {
        setState({ phase: 'reviewing', session, cards, index: nextIndex, flipped: false })
      }
    },
    [state, counts, rateCard, completeReview, sessionId]
  )

  const handleBackToDeck = () => {
    router.push(`/flashcards/${deckId}`)
  }

  const handleExit = () => {
    router.push(`/flashcards/${deckId}`)
  }

  // Full-screen review layout
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Button variant="ghost" size="sm" onClick={handleExit}>
          <X className="mr-1 h-4 w-4" />
          Exit
        </Button>
        {state.phase === 'reviewing' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Card {state.index + 1} of {state.cards.length}
            </span>
          </div>
        )}
        <div className="w-16" /> {/* spacer for centering */}
      </div>

      {/* Progress bar */}
      {state.phase === 'reviewing' && (
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((state.index) / state.cards.length) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-8">
        {state.phase === 'loading' && (
          <div className="space-y-4 w-full max-w-2xl">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {state.phase === 'error' && (
          <div className="text-center">
            <p className="text-destructive">{state.message}</p>
            <Button variant="outline" className="mt-4" onClick={handleExit}>
              Back to Deck
            </Button>
          </div>
        )}

        {state.phase === 'reviewing' && (
          <div className="flex flex-col items-center gap-8 w-full">
            <ReviewCard
              frontMd={state.cards[state.index].frontMd}
              backMd={state.cards[state.index].backMd}
              isFlipped={state.flipped}
              onFlip={handleFlip}
            />
            {state.flipped && (
              <RatingButtons onRate={handleRate} disabled={rateCard.isPending} />
            )}
            {!state.flipped && (
              <p className="text-sm text-muted-foreground">
                Click the card or press Space to reveal the answer
              </p>
            )}
          </div>
        )}

        {state.phase === 'done' && (
          <ReviewSummary
            cardsReviewed={state.counts.easy + state.counts.medium + state.counts.hard + state.counts.forgot}
            cardsEasy={state.counts.easy}
            cardsMedium={state.counts.medium}
            cardsHard={state.counts.hard}
            cardsForgot={state.counts.forgot}
            onBackToDeck={handleBackToDeck}
          />
        )}
      </div>
    </div>
  )
}
