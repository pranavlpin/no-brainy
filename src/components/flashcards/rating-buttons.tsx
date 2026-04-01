'use client'

import { useEffect } from 'react'
import type { ReviewRating } from '@/lib/types/flashcards'

interface RatingButtonsProps {
  onRate: (rating: ReviewRating) => void
  disabled?: boolean
}

const RATINGS: { rating: ReviewRating; label: string; hint: string; key: string; className: string }[] = [
  {
    rating: 'forgot',
    label: 'Forgot',
    hint: "I didn't remember",
    key: '1',
    className: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  },
  {
    rating: 'hard',
    label: 'Hard',
    hint: 'I struggled',
    key: '2',
    className: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-400',
  },
  {
    rating: 'medium',
    label: 'Medium',
    hint: 'I got it with effort',
    key: '3',
    className: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400',
  },
  {
    rating: 'easy',
    label: 'Easy',
    hint: 'I knew it instantly',
    key: '4',
    className: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
  },
]

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      const idx = ['1', '2', '3', '4'].indexOf(e.key)
      if (idx !== -1) {
        e.preventDefault()
        onRate(RATINGS[idx].rating)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onRate, disabled])

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">How well did you know this?</p>
      <div className="flex gap-3">
        {RATINGS.map((r) => (
          <button
            key={r.rating}
            type="button"
            disabled={disabled}
            onClick={() => onRate(r.rating)}
            className={`flex flex-col items-center gap-1 rounded-lg px-5 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${r.className}`}
          >
            <span>{r.label}</span>
            <span className="text-[10px] font-normal opacity-80">{r.hint}</span>
            <kbd className="mt-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
              {r.key}
            </kbd>
          </button>
        ))}
      </div>
    </div>
  )
}
