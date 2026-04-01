'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NoteCard } from '@/components/notes/note-card'
import { NoteFiltersBar } from '@/components/notes/note-filters'
import { useNotes } from '@/hooks/use-notes'
import { cn } from '@/lib/utils'
import type { NoteFilters } from '@/lib/types/notes'

export default function NotesPage() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<NoteFilters>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  const activeFilters: NoteFilters = {
    ...filters,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading } = useNotes(activeFilters)

  const notes = data ?? []

  // Collect unique tags across all notes for filter pills
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [notes])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-md border border-input">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => router.push('/notes/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Filters */}
      <NoteFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* Loading */}
      {isLoading && (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-1.5 h-4 w-2/3" />
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-3 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No notes yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first note to get started.
          </p>
          <Button className="mt-4" onClick={() => router.push('/notes/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Note
          </Button>
        </div>
      )}

      {/* Notes grid/list */}
      {!isLoading && notes.length > 0 && (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          )}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => router.push(`/notes/${note.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
