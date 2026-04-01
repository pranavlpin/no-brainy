'use client'

import { cn } from '@/lib/utils'

interface ReadingProgressProps {
  pagesRead: number
  pagesTotal: number | null
  className?: string
  showLabel?: boolean
}

export function ReadingProgress({
  pagesRead,
  pagesTotal,
  className,
  showLabel = true,
}: ReadingProgressProps) {
  if (!pagesTotal || pagesTotal <= 0) return null

  const pct = Math.min(Math.round((pagesRead / pagesTotal) * 100), 100)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {pagesRead} / {pagesTotal} pages ({pct}%)
        </span>
      )}
    </div>
  )
}
