'use client'

import { Lock, Pin, Trash2, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUpdateChannel, useDeleteChannel } from '@/hooks/use-stash'
import type { StashChannelResponse } from '@/types/stash'

interface StashChannelHeaderProps {
  channel: StashChannelResponse
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  searchOpen: boolean
  onToggleSearch: () => void
}

export function StashChannelHeader({
  channel,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onToggleSearch,
}: StashChannelHeaderProps) {
  const router = useRouter()
  const updateChannel = useUpdateChannel()
  const deleteChannel = useDeleteChannel()

  return (
    <div className="border-b border-border bg-background">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-retro-blue/10 text-retro-blue font-mono text-sm font-bold"
            style={channel.color ? { backgroundColor: `${channel.color}20`, color: channel.color } : undefined}
          >
            {channel.icon || channel.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-sm font-semibold">{channel.name}</h1>
              {channel.isSensitive && (
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Sensitive" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {channel.isSensitive && (
            <button
              type="button"
              onClick={onToggleSearch}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-retro-blue/10"
              aria-label={searchOpen ? 'Close search' : 'Search messages'}
              title="Search messages"
            >
              {searchOpen ? (
                <X className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => updateChannel.mutate({ id: channel.id, isPinned: !channel.isPinned })}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-retro-blue/10"
            aria-label={channel.isPinned ? 'Unpin' : 'Pin'}
            title={channel.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={channel.isPinned ? 'h-4 w-4 text-retro-blue' : 'h-4 w-4 text-muted-foreground'} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`Delete channel "${channel.name}"? This soft-deletes all its messages.`)) return
              deleteChannel.mutate(channel.id, {
                onSuccess: () => router.push('/stash'),
              })
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete channel"
            title="Delete channel"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>
      {channel.isSensitive && searchOpen && (
        <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search in this channel…"
            autoFocus
            className="h-7 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="text-xs text-muted-foreground hover:text-retro-dark"
            >
              clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
