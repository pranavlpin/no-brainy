'use client'

import { cn } from '@/lib/utils'

const MOODS = [
  { value: 'great', emoji: '\u{1F60A}', label: 'Great' },
  { value: 'good', emoji: '\u{1F642}', label: 'Good' },
  { value: 'okay', emoji: '\u{1F610}', label: 'Okay' },
  { value: 'bad', emoji: '\u{1F61E}', label: 'Bad' },
] as const

export type MoodValue = (typeof MOODS)[number]['value']

interface MoodSelectorProps {
  value: string | null
  onChange: (mood: string) => void
  disabled?: boolean
}

export function MoodSelector({ value, onChange, disabled }: MoodSelectorProps) {
  return (
    <div className="flex gap-3">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(mood.value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl border-2 px-5 py-3 transition-all',
            'hover:border-primary/50 hover:bg-primary/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50',
            value === mood.value
              ? 'border-primary bg-primary/10 shadow-sm'
              : 'border-border bg-background'
          )}
        >
          <span className="text-3xl" role="img" aria-label={mood.label}>
            {mood.emoji}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export function getMoodEmoji(mood: string | null): string {
  const found = MOODS.find((m) => m.value === mood)
  return found?.emoji ?? ''
}

export function getMoodLabel(mood: string | null): string {
  const found = MOODS.find((m) => m.value === mood)
  return found?.label ?? ''
}
