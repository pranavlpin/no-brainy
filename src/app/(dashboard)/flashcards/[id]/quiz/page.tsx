'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeck } from '@/hooks/use-flashcards'
import { useStartQuiz, useSubmitAnswer, useCompleteQuiz } from '@/hooks/use-quiz'
import { QuizCard } from '@/components/flashcards/quiz-card'
import { QuizProgress } from '@/components/flashcards/quiz-progress'
import { QuizResults } from '@/components/flashcards/quiz-results'
import type {
  QuizMode,
  QuizAnswer,
  QuizCardData,
  QuizSessionResponse,
} from '@/lib/types/flashcards'

type Phase = 'setup' | 'active' | 'results'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.id as string

  const { data: deck } = useDeck(deckId)

  // Setup state
  const [mode, setMode] = useState<QuizMode>('standard')
  const [cardLimit, setCardLimit] = useState('')
  const [timeLimit, setTimeLimit] = useState('300')

  // Quiz state
  const [phase, setPhase] = useState<Phase>('setup')
  const [cards, setCards] = useState<QuizCardData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [session, setSession] = useState<QuizSessionResponse | null>(null)

  const startQuiz = useStartQuiz(deckId)
  const submitAnswer = useSubmitAnswer(session?.id ?? '')
  const completeQuiz = useCompleteQuiz(session?.id ?? '')

  const handleStart = async () => {
    const result = await startQuiz.mutateAsync({
      mode,
      cardLimit: cardLimit ? parseInt(cardLimit, 10) : undefined,
      timeLimitSec: mode === 'timed' ? parseInt(timeLimit, 10) : undefined,
    })
    setSession(result.session)
    setCards(result.cards)
    setCurrentIndex(0)
    setPhase('active')
  }

  const finishQuiz = useCallback(async () => {
    if (!session) return
    const result = await completeQuiz.mutateAsync()
    setSession(result)
    setPhase('results')
  }, [session, completeQuiz])

  const handleAnswer = useCallback(
    async (answer: QuizAnswer) => {
      if (!session || currentIndex >= cards.length) return

      const card = cards[currentIndex]
      const result = await submitAnswer.mutateAsync({
        cardId: card.id,
        answer,
      })
      setSession(result)

      if (currentIndex + 1 >= cards.length) {
        // Last card -- complete
        const finalResult = await completeQuiz.mutateAsync()
        setSession(finalResult)
        setPhase('results')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    },
    [session, currentIndex, cards, submitAnswer, completeQuiz]
  )

  const handleTimeUp = useCallback(() => {
    finishQuiz()
  }, [finishQuiz])

  const handleTryAgain = () => {
    setPhase('setup')
    setSession(null)
    setCards([])
    setCurrentIndex(0)
  }

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/flashcards/${deckId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Quiz: {deck?.name ?? 'Loading...'}</h1>
        </div>

        <div className="space-y-4 rounded-lg border border-border p-6">
          {/* Mode selection */}
          <div className="space-y-2">
            <Label>Quiz Mode</Label>
            <div className="grid gap-2">
              {(
                [
                  { value: 'standard', label: 'Standard', desc: 'Flip cards, self-grade' },
                  { value: 'timed', label: 'Timed', desc: 'Race against the clock' },
                  {
                    value: 'multiple_choice',
                    label: 'Multiple Choice',
                    desc: 'Pick the correct answer',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    mode === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-accent/50'
                  }`}
                  onClick={() => setMode(opt.value)}
                >
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card limit */}
          <div className="space-y-1">
            <Label htmlFor="card-limit">Card Limit (optional)</Label>
            <Input
              id="card-limit"
              type="number"
              min="1"
              placeholder="All cards"
              value={cardLimit}
              onChange={(e) => setCardLimit(e.target.value)}
            />
          </div>

          {/* Time limit (for timed mode) */}
          {mode === 'timed' && (
            <div className="space-y-1">
              <Label htmlFor="time-limit">Time Limit (seconds)</Label>
              <Input
                id="time-limit"
                type="number"
                min="30"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
              />
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={startQuiz.isPending}
          >
            {startQuiz.isPending ? 'Starting...' : 'Start Quiz'}
          </Button>
        </div>
      </div>
    )
  }

  // Results screen
  if (phase === 'results' && session) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Quiz Results</h1>
        <QuizResults
          session={session}
          cards={cards}
          onTryAgain={handleTryAgain}
          onBackToDeck={() => router.push(`/flashcards/${deckId}`)}
        />
      </div>
    )
  }

  // Active quiz
  const currentCard = cards[currentIndex]

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={finishQuiz}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Quiz: {deck?.name ?? ''}</h1>
      </div>

      {session && (
        <QuizProgress
          current={currentIndex}
          total={cards.length}
          correctCount={session.correctCount}
          incorrectCount={session.incorrectCount}
          skippedCount={session.skippedCount}
          timeLimitSec={session.timeLimitSec}
          startedAt={session.startedAt}
          onTimeUp={handleTimeUp}
        />
      )}

      {currentCard && (
        <QuizCard
          key={currentCard.id}
          card={currentCard}
          mode={mode}
          onAnswer={handleAnswer}
          disabled={submitAnswer.isPending}
        />
      )}
    </div>
  )
}
