'use client'

import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime } from '@/lib/utils/relative-time'
import type { NoteResponse } from '@/lib/types/notes'

interface NoteCardProps {
  note: NoteResponse
  onClick: () => void
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

export function NoteCard({ note, onClick }: NoteCardProps) {
  const plainText = stripMarkdown(note.contentMd)
  const preview = plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg bg-white p-4 text-left shadow-sm',
        'border border-border transition-shadow hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {note.isPinned && (
        <Pin className="absolute right-3 top-3 h-4 w-4 text-primary" />
      )}

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
