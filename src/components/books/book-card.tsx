'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'
import { ReadingProgress } from './reading-progress'
import type { BookResponse, BookStatus } from '@/lib/types/books'

const statusConfig: Record<BookStatus, { label: string; className: string }> = {
  want_to_read: { label: 'Want to Read', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  reading: { label: 'Reading', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  abandoned: { label: 'Abandoned', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
}

const coverColors = [
  'bg-gradient-to-br from-indigo-500 to-purple-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-red-600',
  'bg-gradient-to-br from-blue-500 to-cyan-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
]

function getCoverColor(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = (hash + title.charCodeAt(i)) % coverColors.length
  }
  return coverColors[hash]
}

interface BookCardProps {
  book: BookResponse
}

export function BookCard({ book }: BookCardProps) {
  const status = statusConfig[book.status]

  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center',
              getCoverColor(book.title)
            )}
          >
            <BookOpen size={48} className="text-white/70" />
          </div>
        )}
        <span
          className={cn(
            'absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-muted-foreground">{book.author}</p>
        )}

        <StarRating value={book.rating} readOnly size={14} />

        {book.status === 'reading' && (
          <ReadingProgress
            pagesRead={book.pagesRead}
            pagesTotal={book.pagesTotal}
            showLabel={false}
            className="mt-1"
          />
        )}

        {book.genre.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {book.genre.slice(0, 3).map((g) => (
              <span
                key={g}
                className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
              >
                {g}
              </span>
            ))}
            {book.genre.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{book.genre.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
