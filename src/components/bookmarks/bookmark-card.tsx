'use client'

import { RemoteImage } from '@/components/ui/remote-image'
import { Globe, Pin, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BookmarkResponse } from '@/lib/types/bookmarks'

interface BookmarkCardProps {
  bookmark: BookmarkResponse
  onClick: (bookmark: BookmarkResponse) => void
  onEdit: (bookmark: BookmarkResponse) => void
  onDelete: (bookmark: BookmarkResponse) => void
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function BookmarkCard({ bookmark, onClick, onEdit, onDelete }: BookmarkCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        bookmark.isPinned && 'border-retro-blue/40'
      )}
    >
      {/* Action buttons — visible on hover */}
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-100 transition-opacity sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(bookmark)
          }}
          className="border border-retro-dark/20 bg-card p-1 text-retro-dark/60 hover:bg-retro-blue/10 hover:text-retro-blue"
          aria-label="Edit bookmark"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(bookmark)
          }}
          className="border border-retro-dark/20 bg-card p-1 text-retro-dark/60 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete bookmark"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Pin indicator */}
      {bookmark.isPinned && <Pin size={14} className="absolute left-2 top-2 text-retro-blue" />}

      {/* Favicon + Title */}
      <div className="flex items-start gap-2">
        {bookmark.favicon ? (
          <RemoteImage
            width={16}
            height={16}
            fallback={<Globe size={16} className="text-muted-foreground" />}
            src={bookmark.favicon}
            alt=""
            className="mt-0.5 h-4 w-4 shrink-0"
          />
        ) : (
          <Globe size={16} className="mt-0.5 shrink-0 text-retro-dark/40" />
        )}
        <h3 className="line-clamp-1 pr-12 text-sm font-semibold text-foreground">
          <button
            type="button"
            onClick={() => onClick(bookmark)}
            aria-label={`Open ${bookmark.title}`}
            className="text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {bookmark.title}
          </button>
        </h3>
      </div>

      {/* URL domain */}
      <p className="text-xs text-retro-dark/50">{extractDomain(bookmark.url)}</p>

      {/* Description preview */}
      {bookmark.description && (
        <p className="line-clamp-2 text-xs text-retro-dark/60">{bookmark.description}</p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {bookmark.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="border border-retro-dark/10 bg-retro-blue/5 px-1.5 py-0.5 font-mono text-[10px] text-retro-dark/60"
            >
              {tag}
            </span>
          ))}
          {bookmark.tags.length > 4 && (
            <span className="font-mono text-[10px] text-retro-dark/40">
              +{bookmark.tags.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
