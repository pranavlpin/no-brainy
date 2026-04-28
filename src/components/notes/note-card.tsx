'use client'

import { Pin, PinOff } from 'lucide-react'
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
  const plainText = stripMarkdown(note.contentMd)
  const preview = plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg bg-white p-4 text-left shadow-sm',
        'border border-border transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        note.isPinned && 'border-retro-blue/30 bg-retro-blue/5'
      )}
    >
      {/* Pin toggle button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin?.(note.id, !note.isPinned)
        }}
        className={cn(
          'absolute right-3 top-3 p-1 transition-opacity',
          note.isPinned
            ? 'text-retro-blue opacity-100'
            : 'text-retro-dark/30 opacity-0 group-hover:opacity-100 hover:text-retro-blue'
        )}
        title={note.isPinned ? 'Unpin note' : 'Pin note'}
      >
        {note.isPinned ? (
          <Pin className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </button>

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
    </button>
  )
}
