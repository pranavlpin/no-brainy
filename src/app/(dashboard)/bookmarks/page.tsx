'use client'

import { useState } from 'react'
import { Plus, Search, Bookmark as BookmarkIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import { BookmarkForm } from '@/components/bookmarks/bookmark-form'
import { BookmarkPreview } from '@/components/bookmarks/bookmark-preview'
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import type { BookmarkResponse, BookmarkFilters } from '@/lib/types/bookmarks'

export default function BookmarksPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkResponse | null>(null)

  const filters: BookmarkFilters = {
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const { data: bookmarks, isLoading } = useBookmarks(
    Object.keys(filters).length > 0 ? filters : undefined
  )
  const createBookmark = useCreateBookmark()
  const deleteBookmark = useDeleteBookmark()

  function handleCreate(data: Parameters<typeof createBookmark.mutate>[0]): void {
    createBookmark.mutate(data, {
      onSuccess: () => setShowForm(false),
    })
  }

  function handleDelete(bookmark: BookmarkResponse): void {
    if (window.confirm(`Delete "${bookmark.title}"?`)) {
      deleteBookmark.mutate(bookmark.id)
      if (selectedBookmark?.id === bookmark.id) {
        setSelectedBookmark(null)
      }
    }
  }

  function handleEdit(bookmark: BookmarkResponse): void {
    // For now, open in preview; a full edit form can be added later
    setSelectedBookmark(bookmark)
  }

  return (
    <div className="flex h-full gap-0">
      {/* Main content */}
      <div
        className={cn(
          'flex-1 space-y-6 overflow-y-auto p-0',
          selectedBookmark ? 'w-[60%]' : 'w-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-retro-dark">Bookmarks</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
          >
            <Plus size={16} className="mr-2 inline" />
            Add Bookmark
          </button>
        </div>

        {/* Inline form */}
        {showForm && (
          <BookmarkForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createBookmark.isPending}
          />
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="rounded-none pl-9"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div
            className={cn(
              'grid gap-4',
              selectedBookmark
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-2 border-retro-dark/10 p-4">
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="mb-2 h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div
            className={cn(
              'grid gap-4',
              selectedBookmark
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onClick={setSelectedBookmark}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/20 py-16">
            <BookmarkIcon size={48} className="text-retro-dark/20" />
            <p className="mt-4 font-mono text-sm text-retro-dark/50">
              No bookmarks yet. Add your first bookmark to get started!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 border-2 border-retro-dark/20 bg-white px-4 py-2 font-mono text-sm font-bold text-retro-dark hover:bg-retro-dark/5"
            >
              <Plus size={16} className="mr-2 inline" />
              Add Bookmark
            </button>
          </div>
        )}
      </div>

      {/* Preview panel */}
      {selectedBookmark && (
        <div className="hidden w-[40%] md:block">
          <BookmarkPreview
            bookmark={selectedBookmark}
            onClose={() => setSelectedBookmark(null)}
          />
        </div>
      )}
    </div>
  )
}
