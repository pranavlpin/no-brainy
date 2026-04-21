'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (rating: number | null) => void
  size?: number
  readOnly?: boolean
}

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: StarRatingProps): JSX.Element {
  const [hovered, setHovered] = useState<number | null>(null)

  const displayValue = hovered ?? value ?? 0

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => !readOnly && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={cn(
            'transition-colors disabled:cursor-default',
            !readOnly && 'cursor-pointer hover:scale-110'
          )}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onClick={() => {
            if (readOnly || !onChange) return
            onChange(value === star ? null : star)
          }}
        >
          <Star
            size={size}
            className={cn(
              star <= displayValue
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  )
}
