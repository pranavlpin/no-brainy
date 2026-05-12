'use client'

import { Pin, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StashMessageResponse } from '@/types/stash'

interface StashMessageProps {
  message: StashMessageResponse
  onTogglePin?: (id: string, isPinned: boolean) => void
  onDelete?: (id: string) => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function StashMessage({ message, onTogglePin, onDelete }: StashMessageProps) {
  return (
    <div className="group flex flex-col items-end">
      <div className="relative max-w-[80%] rounded-lg border border-retro-blue/20 bg-retro-blue/5 px-3.5 py-2.5">
        {message.label && (
          <div className="mb-1 text-xs font-semibold text-retro-blue">{message.label}</div>
        )}
        {message.type === 'TEXT' && (
          <p className="whitespace-pre-wrap break-words text-sm text-retro-dark">
            {message.content}
          </p>
        )}
        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          {message.isPinned && <Pin className="h-2.5 w-2.5 text-retro-blue" />}
          <span>{formatTime(message.createdAt)}</span>
        </div>

        <div className="absolute -left-16 top-1/2 hidden -translate-y-1/2 items-center gap-1 group-hover:flex">
          <button
            type="button"
            onClick={() => onTogglePin?.(message.id, !message.isPinned)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md hover:bg-retro-blue/10',
              message.isPinned ? 'text-retro-blue' : 'text-muted-foreground'
            )}
            aria-label={message.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
