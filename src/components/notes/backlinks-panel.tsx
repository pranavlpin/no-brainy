'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react'
import { useBacklinks } from '@/hooks/use-backlinks'
import { Skeleton } from '@/components/ui/skeleton'

interface BacklinksPanelProps {
  noteId: string
}

export function BacklinksPanel({ noteId }: BacklinksPanelProps) {
  const { data: backlinks, isLoading } = useBacklinks(noteId)
  const [isOpen, setIsOpen] = useState(true)

  const count = backlinks?.length ?? 0

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-accent/50 transition-colors rounded-lg"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Link2 className="h-4 w-4 text-muted-foreground" />
        Backlinks ({isLoading ? '...' : count})
      </button>

      {isOpen && (
        <div className="border-t border-border px-4 py-3">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          )}

          {!isLoading && count === 0 && (
            <p className="text-sm text-muted-foreground">
              No other notes link to this one
            </p>
          )}

          {!isLoading && backlinks && backlinks.length > 0 && (
            <div className="space-y-3">
              {backlinks.map((bl) => (
                <div key={bl.id} className="group">
                  <Link
                    href={`/notes/${bl.id}`}
                    className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {bl.title}
                  </Link>
                  {bl.snippet && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {bl.snippet}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
