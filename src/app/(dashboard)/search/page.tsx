'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/use-search'
import type { SearchOptions } from '@/hooks/use-search'
import { SearchResultItem } from '@/components/search/search-result-item'
import {
  RecentSearches,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from '@/components/search/recent-searches'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'task', label: 'Tasks' },
  { value: 'book', label: 'Books' },
  { value: 'flashcard', label: 'Flashcards' },
] as const

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Newest' },
  { value: 'title', label: 'Title' },
] as const

type SearchType = (typeof TYPE_TABS)[number]['value']
type SortBy = (typeof SORT_OPTIONS)[number]['value']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const searchOptions: SearchOptions = {
    sortBy: sortBy as SearchOptions['sortBy'],
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { data, isLoading, isFetching } = useGlobalSearch(query, type, searchOptions)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cmd+K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save to recent searches when results come back
  useEffect(() => {
    if (data && data.results.length > 0 && query.trim()) {
      addRecentSearch(query.trim())
      setRecentSearches(getRecentSearches())
    }
  }, [data, query])

  const handleSelectRecent = useCallback((q: string) => {
    setQuery(q)
    inputRef.current?.focus()
  }, [])

  const handleClearRecent = useCallback(() => {
    clearRecentSearches()
    setRecentSearches([])
  }, [])

  const hasQuery = query.trim().length > 0
  const showLoading = isLoading && hasQuery
  const showResults = data && data.results.length > 0
  const showEmpty = data && data.results.length === 0 && hasQuery && !isFetching

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search across all your content... (Cmd+K)"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 py-4 pl-12 pr-4 text-lg text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isFetching && hasQuery && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-blue-400" />
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Type filter tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setType(tab.value)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                type === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date range filters */}
      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
          />
        </label>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('')
              setDateTo('')
            }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Results area */}
      <div className="mt-6">
        {/* Recent searches (when no query) */}
        {!hasQuery && (
          <>
            <RecentSearches
              searches={recentSearches}
              onSelect={handleSelectRecent}
              onClear={handleClearRecent}
            />
            {recentSearches.length === 0 && (
              <div className="py-20 text-center">
                <Search className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-4 text-lg text-slate-400">
                  Search across all your content
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Find notes, tasks, books, and flashcards
                </p>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton */}
        {showLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        {showResults && (
          <div className="space-y-1">
            <p className="mb-3 text-xs text-slate-500">
              {data.total} result{data.total !== 1 ? 's' : ''} for &ldquo;
              {data.query}&rdquo;
            </p>
            {data.results.map(result => (
              <SearchResultItem
                key={`${result.entityType}-${result.id}`}
                result={result}
                query={query}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <div className="py-16 text-center">
            <p className="text-lg text-slate-400">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term or filter
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
