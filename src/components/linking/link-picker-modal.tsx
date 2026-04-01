'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, FileText, CheckSquare, BookOpen, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types/api'
import type { SearchResponse, SearchResult } from '@/lib/types/search'
import { cn } from '@/lib/utils'

interface LinkPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (targetType: string, targetId: string) => void
  allowedTypes: string[]
  excludeId?: string
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  task: CheckSquare,
  book: BookOpen,
  deck: Layers,
}

const typeColors: Record<string, string> = {
  note: 'text-blue-500',
  task: 'text-green-500',
  book: 'text-orange-500',
  deck: 'text-purple-500',
}

const typeLabels: Record<string, string> = {
  note: 'Notes',
  task: 'Tasks',
  book: 'Books',
  deck: 'Decks',
}

export function LinkPickerModal({
  open,
  onClose,
  onSelect,
  allowedTypes,
  excludeId,
}: LinkPickerModalProps) {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<string>(allowedTypes[0] || 'note')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const search = useCallback(
    async (q: string, type: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ q, type, limit: '10' })
        const res = await apiClient<ApiResponse<SearchResponse>>(
          `/api/search?${params.toString()}`
        )
        const filtered = excludeId
          ? res.data.results.filter((r) => r.id !== excludeId)
          : res.data.results
        setResults(filtered)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [excludeId]
  )

  // Debounced search
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      search(query, activeType)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeType, open, search])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveType(allowedTypes[0] || 'note')
    }
  }, [open, allowedTypes])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Add Link</h2>

        {/* Type filter tabs */}
        <div className="mb-3 flex gap-1">
          {allowedTypes.map((type) => {
            const Icon = typeIcons[type] || FileText
            return (
              <Button
                key={type}
                variant={activeType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveType(type)}
                className="gap-1.5"
              >
                <Icon className={cn('h-3.5 w-3.5', activeType !== type && (typeColors[type] || ''))} />
                {typeLabels[type] || type}
              </Button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${typeLabels[activeType] || activeType}...`}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {isSearching && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Searching...
            </p>
          )}
          {!isSearching && query && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No results found
            </p>
          )}
          {!isSearching && !query && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Type to search for items to link
            </p>
          )}
          {results.map((result) => {
            const Icon = typeIcons[result.entityType] || FileText
            return (
              <button
                key={result.id}
                onClick={() => {
                  onSelect(result.entityType, result.id)
                  onClose()
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <Icon className={cn('h-4 w-4 shrink-0', typeColors[result.entityType] || '')} />
                <span className="flex-1 truncate">{result.title}</span>
                {result.excerpt && (
                  <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline">
                    {result.excerpt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Close button */}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
