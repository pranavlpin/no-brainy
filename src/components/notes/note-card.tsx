'use client'

import { useState } from 'react'
import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/relative-time'
import type { NoteResponse } from '@/lib/types/notes'

interface NoteCardProps {
  note: NoteResponse
  onClick: () => void
  onTogglePin?: (noteId: string, isPinned: boolean) => void
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/[-*+]\s/g, '')
    .replace(/\n/g, ' ')
    .trim()
}

export function NoteCard({ note, onClick, onTogglePin }: NoteCardProps) {
  const [optimisticPinned, setOptimisticPinned] = useState(note.isPinned)
  const [isPending, setIsPending] = useState(false)
  const plainText = stripMarkdown(note.contentMd)
  const preview = plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText

  // Sync optimistic state when prop changes (after refetch)
  if (note.isPinned !== optimisticPinned && !isPending) {
    setOptimisticPinned(note.isPinned)
  }

  const handlePinClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    e.preventDefault()
    const newPinned = !optimisticPinned
    setOptimisticPinned(newPinned)
    setIsPending(true)
    onTogglePin?.(note.id, newPinned)
    // Reset pending after a short delay (query invalidation will update)
    setTimeout(() => setIsPending(false), 1000)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className={cn(
        'group relative w-full rounded-lg bg-white p-4 text-left shadow-sm cursor-pointer',
        'border border-border transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        optimisticPinned && 'border-retro-blue/30 bg-retro-blue/5'
      )}
    >
      {/* Pin toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={handlePinClick}
        onKeyDown={(e) => { if (e.key === 'Enter') handlePinClick(e as unknown as React.MouseEvent) }}
        className={cn(
          'absolute right-3 top-3 p-1 transition-opacity z-10',
          optimisticPinned
            ? 'text-retro-blue opacity-100'
            : 'text-retro-dark/30 opacity-0 group-hover:opacity-100 hover:text-retro-blue'
        )}
        title={optimisticPinned ? 'Unpin note' : 'Pin note'}
      >
        <Pin className="h-4 w-4" />
      </div>

      <h3 className="pr-6 font-semibold text-foreground line-clamp-1">
        {note.title || 'Untitled'}
      </h3>

      {preview && (
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
          {preview}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {relativeTime(note.updatedAt)}
      </p>
    </div>
  )
}
