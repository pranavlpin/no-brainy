'use client'

import { Clock } from 'lucide-react'

const STORAGE_KEY = 'nobrainy:recent-searches'
const MAX_RECENT = 10

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return
  const trimmed = query.trim()
  if (!trimmed) return
  const existing = getRecentSearches()
  const filtered = existing.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
  const updated = [trimmed, ...filtered].slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

interface RecentSearchesProps {
  searches: string[]
  onSelect: (query: string) => void
  onClear: () => void
}

export function RecentSearches({ searches, onSelect, onClear }: RecentSearchesProps) {
  if (searches.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          Recent searches
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search) => (
          <button
            key={search}
            onClick={() => onSelect(search)}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  )
}
