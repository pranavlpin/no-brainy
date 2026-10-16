'use client'

import { ErrorState } from '@/components/ui/workspace-states'
import { useState } from 'react'
import { Plus, Search, Bookmark as BookmarkIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'
import { BookmarkForm } from '@/components/bookmarks/bookmark-form'
import { BookmarkPreview } from '@/components/bookmarks/bookmark-preview'
import {
  useBookmarks,
  useCreateBookmark,
  useUpdateBookmark,
  useDeleteBookmark,
} from '@/hooks/use-bookmarks'
import { cn } from '@/lib/utils'
import type {
  BookmarkResponse,
  BookmarkFilters,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
} from '@/lib/types/bookmarks'

export default function BookmarksPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<BookmarkResponse | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkResponse | null>(null)

  const filters: BookmarkFilters = {
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const {
    data: bookmarks,
    isLoading,
    isError,
    refetch,
  } = useBookmarks(Object.keys(filters).length > 0 ? filters : undefined)
  const createBookmark = useCreateBookmark()
  const updateBookmark = useUpdateBookmark()
  const deleteBookmark = useDeleteBookmark()

  function handleCreate(data: CreateBookmarkRequest | UpdateBookmarkRequest): void {
    createBookmark.mutate(data as CreateBookmarkRequest, {
      onSuccess: () => setShowForm(false),
    })
  }

  function handleUpdate(data: CreateBookmarkRequest | UpdateBookmarkRequest): void {
    if (!editingBookmark) return
    updateBookmark.mutate(
      { id: editingBookmark.id, data: data as UpdateBookmarkRequest },
      { onSuccess: () => setEditingBookmark(null) }
    )
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
    setEditingBookmark(bookmark)
    setShowForm(false)
  }

  if (isError) return <ErrorState retry={() => void refetch()} />

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-title">Bookmarks</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2 inline" />
            Add Bookmark
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <BookmarkForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createBookmark.isPending}
          />
        )}

        {/* Edit form */}
        {editingBookmark && (
          <BookmarkForm
            bookmark={editingBookmark}
            onSubmit={handleUpdate}
            onCancel={() => setEditingBookmark(null)}
            isLoading={updateBookmark.isPending}
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
            className="pl-9"
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
              <div key={i} className="rounded-xl border border-border p-4">
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
            <BookmarkIcon size={48} className="text-retro-dark/20" />
            <p className="mt-4 text-sm text-retro-dark/50">
              No bookmarks yet. Add your first bookmark to get started!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-retro-dark hover:bg-retro-dark/5"
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
          <BookmarkPreview bookmark={selectedBookmark} onClose={() => setSelectedBookmark(null)} />
        </div>
      )}
    </div>
  )
}
