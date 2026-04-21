'use client'

import { useState } from 'react'
import { Plus, Search, Film, Upload, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { WatchlistCard } from '@/components/watchlist/watchlist-card'
import { WatchlistForm } from '@/components/watchlist/watchlist-form'
import { WatchlistImport } from '@/components/watchlist/watchlist-import'
import {
  useWatchlist,
  useCreateWatchlistItem,
  useUpdateWatchlistItem,
  useDeleteWatchlistItem,
  useBulkFetchMetadata,
} from '@/hooks/use-watchlist'
import { cn } from '@/lib/utils'
import type {
  WatchlistType,
  WatchlistStatus,
  WatchlistItemResponse,
  CreateWatchlistRequest,
  UpdateWatchlistRequest,
  WatchlistFilters,
} from '@/lib/types/watchlist'

type TabValue = 'all' | 'movie' | 'show'

const tabs: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'show', label: 'Shows' },
]

const statusOptions: { value: '' | WatchlistStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

const sortOptions: { value: string; label: string }[] = [
  { value: 'updatedAt:desc', label: 'Recently Updated' },
  { value: 'createdAt:desc', label: 'Recently Added' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
  { value: 'rating:desc', label: 'Highest Rated' },
  { value: 'year:desc', label: 'Newest Year' },
  { value: 'year:asc', label: 'Oldest Year' },
]

const emptyMessages: Record<TabValue, string> = {
  all: 'No items in your watchlist yet. Add your first movie or show!',
  movie: 'No movies in your watchlist. Add one to get started.',
  show: 'No shows in your watchlist. Add one to get started.',
}

export default function WatchlistPage(): JSX.Element {
  const [tab, setTab] = useState<TabValue>('all')
  const [statusFilter, setStatusFilter] = useState<'' | WatchlistStatus>('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('updatedAt:desc')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<WatchlistItemResponse | null>(null)
  const [showImport, setShowImport] = useState(false)

  const [sortBy, sortOrder] = sort.split(':') as [WatchlistFilters['sortBy'], WatchlistFilters['sortOrder']]

  const filters: WatchlistFilters = {
    ...(tab !== 'all' ? { type: tab as WatchlistType } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    sortBy,
    sortOrder,
  }

  const hasFilters = Object.keys(filters).length > 2 // sortBy and sortOrder always present
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useWatchlist(
    hasFilters || filters.sortBy !== 'updatedAt' || filters.sortOrder !== 'desc'
      ? filters
      : undefined
  )

  const items = data?.items ?? []
  const totalCount = data?.total ?? 0

  const createMutation = useCreateWatchlistItem()
  const updateMutation = useUpdateWatchlistItem()
  const deleteMutation = useDeleteWatchlistItem()
  const bulkMetadata = useBulkFetchMetadata()

  function handleCreate(data: CreateWatchlistRequest | UpdateWatchlistRequest): void {
    createMutation.mutate(data as CreateWatchlistRequest, {
      onSuccess: () => setShowAddForm(false),
    })
  }

  function handleUpdate(data: CreateWatchlistRequest | UpdateWatchlistRequest): void {
    if (!editingItem) return
    updateMutation.mutate(
      { id: editingItem.id, data: data as UpdateWatchlistRequest },
      { onSuccess: () => setEditingItem(null) }
    )
  }

  function handleDelete(id: string): void {
    if (!confirm('Remove this item from your watchlist?')) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-retro-dark">Watchlist</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => bulkMetadata.mutate()}
            disabled={bulkMetadata.isPending}
            className="border border-retro-blue/30 bg-background px-3 py-2 font-mono text-sm text-retro-dark hover:bg-retro-blue/5 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 inline ${bulkMetadata.isPending ? 'animate-spin' : ''}`} />
            {bulkMetadata.isPending ? 'Fetching...' : 'Update Details'}
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="border border-retro-blue/30 bg-background px-3 py-2 font-mono text-sm text-retro-dark hover:bg-retro-blue/5"
          >
            <Upload size={16} className="mr-2 inline" />
            Import
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingItem(null)
            }}
            className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow"
          >
            <Plus size={16} className="mr-2 inline" />
            Add
          </button>
        </div>
      </div>

      {/* Add form (inline) */}
      {showAddForm && (
        <WatchlistForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit form (inline) */}
      {editingItem && (
        <WatchlistForm
          item={editingItem}
          onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.value
                ? 'bg-retro-blue/10 text-retro-dark font-mono border-b-2 border-retro-blue'
                : 'text-retro-dark/40 hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | WatchlistStatus)}
          className="w-44"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <div className="relative max-w-xs flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search watchlist..."
            className="rounded-none pl-9"
          />
        </div>

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-48"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden border-2 border-retro-dark/10">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          {bulkMetadata.isSuccess && (
            <div className="border-2 border-retro-mint/30 bg-retro-mint/5 p-3 font-mono text-sm text-retro-dark">
              Updated {bulkMetadata.data.data.updated} item{bulkMetadata.data.data.updated !== 1 ? 's' : ''}
              {bulkMetadata.data.data.failed > 0 && `, ${bulkMetadata.data.data.failed} not found`}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onEdit={(i) => {
                  setEditingItem(i)
                  setShowAddForm(false)
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="font-mono text-sm text-retro-blue hover:underline disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading more...' : `Load more (showing ${items.length} of ${totalCount})`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-retro-dark/20 py-16">
          <Film size={48} className="text-muted-foreground/40" />
          <p className="mt-4 font-mono text-sm text-muted-foreground">
            {emptyMessages[tab]}
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 border-2 border-retro-dark/20 bg-background px-4 py-2 font-mono text-sm font-bold text-retro-dark hover:bg-muted"
          >
            <Plus size={16} className="mr-2 inline" />
            Add Item
          </button>
        </div>
      )}

      {/* Import wizard */}
      {showImport && (
        <WatchlistImport
          onClose={() => setShowImport(false)}
          onComplete={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
