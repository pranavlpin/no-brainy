'use client'

import Link from 'next/link'
import { Lock, Link as LinkIcon, FileText, ImageIcon, MessageSquare } from 'lucide-react'
import { useStashSearch } from '@/hooks/use-stash'
import { Skeleton } from '@/components/ui/skeleton'
import type { StashSearchResult } from '@/types/stash'

interface StashSearchResultsProps {
  query: string
  activeChannelId: string | null
}

function snippetFor(r: StashSearchResult, q: string): string {
  const ql = q.toLowerCase()

  const fieldsToCheck: Array<string | null | undefined> = [
    r.label,
    r.linkTitle,
    r.linkUrl,
    r.fileName,
    !r.isEncrypted ? r.content : null,
  ]

  for (const f of fieldsToCheck) {
    if (!f) continue
    const lower = f.toLowerCase()
    const idx = lower.indexOf(ql)
    if (idx === -1) continue
    const start = Math.max(0, idx - 20)
    const end = Math.min(f.length, idx + q.length + 40)
    return (start > 0 ? '…' : '') + f.slice(start, end) + (end < f.length ? '…' : '')
  }

  if (r.isEncrypted) return '[encrypted content]'
  return r.content.slice(0, 80) + (r.content.length > 80 ? '…' : '')
}

function ResultIcon({ result }: { result: StashSearchResult }) {
  const className = 'h-3.5 w-3.5 shrink-0 text-muted-foreground'
  if (result.type === 'LINK') return <LinkIcon className={className} />
  if (result.type === 'FILE') {
    if (result.fileMimeType?.startsWith('image/')) return <ImageIcon className={className} />
    return <FileText className={className} />
  }
  return <MessageSquare className={className} />
}

export function StashSearchResults({ query, activeChannelId }: StashSearchResultsProps) {
  const { data, isLoading, isError } = useStashSearch(query)

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5 px-3 py-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-4 py-8 text-center text-sm text-destructive">
        Search failed. Try again.
      </div>
    )
  }

  const results = data ?? []

  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm font-medium">No matches</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Nothing in your channels matches &ldquo;{query}&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div className="py-1">
      <div className="px-3 py-1.5 text-xs text-muted-foreground">
        {results.length} match{results.length === 1 ? '' : 'es'}
      </div>
      <nav>
        {results.map((r) => (
          <Link
            key={r.id}
            href={`/stash/${r.channelId}`}
            className={
              'flex flex-col gap-1 border-l-2 px-3 py-2 transition-colors ' +
              (r.channelId === activeChannelId
                ? 'border-retro-blue bg-retro-blue/10'
                : 'border-transparent hover:bg-retro-blue/5')
            }
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate font-medium text-retro-dark">
                {r.channel.name}
              </span>
              {r.channel.isSensitive && (
                <Lock className="h-2.5 w-2.5 shrink-0" aria-label="Sensitive" />
              )}
              <ResultIcon result={r} />
            </div>
            {r.label && (
              <div className="truncate text-xs font-semibold text-retro-blue">
                {r.label}
              </div>
            )}
            <div className="line-clamp-2 break-words text-xs text-muted-foreground">
              {snippetFor(r, query)}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  )
}
