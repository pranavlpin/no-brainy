'use client'

import { Search, Pin, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NoteFilters } from '@/lib/types/notes'

interface NoteFiltersBarProps {
  filters: NoteFilters
  onFiltersChange: (filters: NoteFilters) => void
  availableTags: string[]
  searchValue: string
  onSearchChange: (value: string) => void
}

const SORT_OPTIONS: { value: NoteFilters['sortBy']; label: string }[] = [
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdAt', label: 'Created' },
  { value: 'title', label: 'Title' },
]

export function NoteFiltersBar({
  filters,
  onFiltersChange,
  availableTags,
  searchValue,
  onSearchChange,
}: NoteFiltersBarProps) {
  const togglePinFilter = () => {
    onFiltersChange({
      ...filters,
      isPinned: filters.isPinned === true ? undefined : true,
    })
  }

  const toggleTag = (tag: string) => {
    const current = filters.tags ?? []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    onFiltersChange({ ...filters, tags: updated.length > 0 ? updated : undefined })
  }

  const cycleSortBy = () => {
    const currentIndex = SORT_OPTIONS.findIndex((o) => o.value === (filters.sortBy ?? 'updatedAt'))
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length
    onFiltersChange({ ...filters, sortBy: SORT_OPTIONS[nextIndex].value })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant={filters.isPinned ? 'default' : 'outline'}
          size="sm"
          onClick={togglePinFilter}
          title="Filter pinned notes"
        >
          <Pin className="mr-1.5 h-4 w-4" />
          Pinned
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={cycleSortBy}
          title="Change sort order"
        >
          <ArrowUpDown className="mr-1.5 h-4 w-4" />
          {SORT_OPTIONS.find((o) => o.value === (filters.sortBy ?? 'updatedAt'))?.label ?? 'Updated'}
        </Button>
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                filters.tags?.includes(tag)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
