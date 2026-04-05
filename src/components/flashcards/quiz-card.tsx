'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuizCardData, QuizAnswer, QuizMode } from '@/lib/types/flashcards'

interface QuizCardProps {
  card: QuizCardData
  mode: QuizMode
  onAnswer: (answer: QuizAnswer) => void
  disabled?: boolean
}

export function QuizCard({ card, mode, onAnswer, disabled }: QuizCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  if (mode === 'multiple_choice' && card.options) {
    return (
      <div className="space-y-6">
        {/* Question */}
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-lg font-medium whitespace-pre-wrap">{card.frontMd}</p>
        </div>

        {/* Options */}
        <div className="grid gap-2">
          {card.options.map((option, idx) => {
            const isCorrect = option === card.backMd
            const isSelected = selectedOption === option
            const showResult = selectedOption !== null

            return (
              <button
                key={idx}
                disabled={disabled || showResult}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  !showResult && 'hover:bg-accent/50 border-border',
                  showResult && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                  showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                  showResult && !isCorrect && !isSelected && 'border-border opacity-50'
                )}
                onClick={() => {
                  setSelectedOption(option)
                  // Delay to show feedback before moving on
                  setTimeout(() => {
                    onAnswer(isCorrect ? 'correct' : 'incorrect')
                  }, 800)
                }}
              >
                <span className="font-medium mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            )
          })}
        </div>

        {/* Skip */}
        {!selectedOption && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAnswer('skipped')}
              disabled={disabled}
            >
              Skip
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Standard / timed mode
  return (
    <div className="space-y-6">
      {/* Front */}
      <div className="rounded-lg border border-border p-6 text-center min-h-[120px] flex items-center justify-center">
        <p className="text-lg font-medium whitespace-pre-wrap">{card.frontMd}</p>
      </div>

      {/* Back (reveal on click) */}
      {!revealed ? (
        <div className="text-center">
          <Button onClick={() => setRevealed(true)} disabled={disabled}>
            Reveal Answer
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-accent/20 p-6 text-center min-h-[80px] flex items-center justify-center">
            <p className="text-base whitespace-pre-wrap">{card.backMd}</p>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => onAnswer('correct')}
              disabled={disabled}
              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              Correct
            </Button>
            <Button
              variant="outline"
              onClick={() => onAnswer('incorrect')}
              disabled={disabled}
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Incorrect
            </Button>
            <Button
              variant="ghost"
              onClick={() => onAnswer('skipped')}
              disabled={disabled}
            >
              Skip
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
