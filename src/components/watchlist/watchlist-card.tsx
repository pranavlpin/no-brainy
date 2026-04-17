'use client'

import { Film, Tv, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'
import { Badge } from '@/components/ui/badge'
import type { WatchlistItemResponse, WatchlistStatus, WatchlistType } from '@/lib/types/watchlist'

const statusConfig: Record<WatchlistStatus, { label: string; className: string }> = {
  want_to_watch: { label: 'Want to Watch', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  watching: { label: 'Watching', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  dropped: { label: 'Dropped', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
}

const typeConfig: Record<WatchlistType, { label: string; icon: typeof Film }> = {
  movie: { label: 'Movie', icon: Film },
  show: { label: 'Show', icon: Tv },
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

const genreColors: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'secondary'> = {
  Action: 'red',
  Comedy: 'yellow',
  Drama: 'blue',
  Horror: 'red',
  'Sci-Fi': 'blue',
  Romance: 'red',
  Thriller: 'orange',
  Documentary: 'green',
  Animation: 'yellow',
  Fantasy: 'orange',
}

function getGenreBadgeVariant(genre: string): 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'secondary' {
  return genreColors[genre] ?? 'secondary'
}

interface WatchlistCardProps {
  item: WatchlistItemResponse
  onEdit?: (item: WatchlistItemResponse) => void
  onDelete?: (id: string) => void
}

export function WatchlistCard({ item, onEdit, onDelete }: WatchlistCardProps): JSX.Element {
  const status = statusConfig[item.status]
  const typeInfo = typeConfig[item.type]
  const TypeIcon = typeInfo.icon

  return (
    <div className="group relative flex flex-col overflow-hidden border-2 border-retro-dark/20 bg-card transition-shadow hover:shadow-hard">
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center',
              getCoverColor(item.title)
            )}
          >
            <TypeIcon size={48} className="text-white/70" />
          </div>
        )}

        {/* Status badge */}
        <span
          className={cn(
            'absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium',
            status.className
          )}
        >
          {status.label}
        </span>

        {/* Type badge */}
        <span className="absolute left-2 top-2 rounded-full bg-retro-dark/70 px-2 py-0.5 text-xs font-mono font-medium text-white">
          {typeInfo.label}
        </span>

        {/* Hover actions */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(item)
              }}
              className="rounded bg-white/90 p-1.5 text-retro-dark shadow-sm transition-colors hover:bg-retro-blue hover:text-white"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(item.id)
              }}
              className="rounded bg-white/90 p-1.5 text-retro-dark shadow-sm transition-colors hover:bg-red-500 hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight font-display">
            {item.title}
          </h3>
          {item.year && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {item.year}
            </span>
          )}
        </div>

        {item.platform && (
          <p className="font-mono text-xs text-muted-foreground">{item.platform}</p>
        )}

        <StarRating value={item.rating} readOnly size={14} />

        {item.genre.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {item.genre.slice(0, 3).map((g) => (
              <Badge key={g} variant={getGenreBadgeVariant(g)} className="text-[10px]">
                {g}
              </Badge>
            ))}
            {item.genre.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.genre.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
