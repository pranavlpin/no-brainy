'use client'

import Link from 'next/link'
import { FileText, CheckSquare, BookOpen, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SearchHighlight } from './search-highlight'
import { relativeTime } from '@/lib/utils/relative-time'
import type { SearchResult } from '@/lib/types/search'

const entityConfig = {
  note: {
    icon: FileText,
    label: 'Note',
    href: (id: string) => `/notes/${id}`,
    variant: 'blue' as const,
  },
  task: {
    icon: CheckSquare,
    label: 'Task',
    href: (id: string) => `/tasks?highlight=${id}`,
    variant: 'green' as const,
  },
  book: {
    icon: BookOpen,
    label: 'Book',
    href: (id: string) => `/books/${id}`,
    variant: 'orange' as const,
  },
  flashcard: {
    icon: Layers,
    label: 'Flashcard',
    href: (id: string) => `/flashcards/${id}`,
    variant: 'yellow' as const,
  },
} as const

interface SearchResultItemProps {
  result: SearchResult
  query: string
}

export function SearchResultItem({ result, query }: SearchResultItemProps) {
  const config = entityConfig[result.entityType as keyof typeof entityConfig]
  if (!config) return null

  const Icon = config.icon

  return (
    <Link
      href={config.href(result.id)}
      className="flex items-start gap-4 rounded-lg border border-transparent px-4 py-3 transition-colors hover:bg-slate-800/50 hover:border-slate-700"
    >
      <div className="mt-0.5 shrink-0">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-slate-100">
            <SearchHighlight text={result.title} query={query} />
          </h3>
          <Badge variant={config.variant} className="shrink-0 text-[10px]">
            {config.label}
          </Badge>
        </div>

        {result.excerpt && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
            <SearchHighlight text={result.excerpt} query={query} />
          </p>
        )}

        {result.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {result.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 text-xs text-slate-500">
        {relativeTime(result.updatedAt)}
      </div>
    </Link>
  )
}
