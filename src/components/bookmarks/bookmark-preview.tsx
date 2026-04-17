'use client'

import { X, ExternalLink } from 'lucide-react'
import type { BookmarkResponse } from '@/lib/types/bookmarks'

interface BookmarkPreviewProps {
  bookmark: BookmarkResponse | null
  onClose: () => void
}

export function BookmarkPreview({ bookmark, onClose }: BookmarkPreviewProps) {
  if (!bookmark) return null

  return (
    <div className="flex h-full flex-col border-l-2 border-retro-dark/10 bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-retro-dark/10 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-retro-dark">
            {bookmark.title}
          </h2>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-retro-blue hover:underline"
          >
            {bookmark.url}
            <ExternalLink size={12} />
          </a>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 text-retro-dark/40 hover:text-retro-dark"
          aria-label="Close preview"
        >
          <X size={18} />
        </button>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src={bookmark.url}
          title={bookmark.title}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    </div>
  )
}
