'use client'

import { useState } from 'react'
import { Plus, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChannels } from '@/hooks/use-stash'
import { StashChannelTile } from './stash-channel-tile'
import { NewChannelDialog } from './new-channel-dialog'
import { Skeleton } from '@/components/ui/skeleton'

interface StashChannelListProps {
  activeChannelId: string | null
}

export function StashChannelList({ activeChannelId }: StashChannelListProps) {
  const router = useRouter()
  const { data: channels, isLoading } = useChannels()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <aside className="flex h-full w-full max-w-xs flex-col border-r border-border bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 className="font-display text-lg font-bold text-retro-dark">Stash</h2>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-retro-blue/10 hover:text-retro-blue"
          aria-label="New channel"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && channels && channels.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Archive className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No channels yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create one to start stashing things.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-4 border-2 border-retro-dark bg-retro-blue px-3 py-1.5 font-mono text-xs font-bold text-white shadow-hard hover-shadow-grow"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" />
              New channel
            </button>
          </div>
        )}

        {!isLoading && channels && channels.length > 0 && (
          <nav className="py-1">
            {channels.map((channel) => (
              <StashChannelTile
                key={channel.id}
                channel={channel}
                isActive={channel.id === activeChannelId}
              />
            ))}
          </nav>
        )}
      </div>

      <NewChannelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => router.push(`/stash/${id}`)}
      />
    </aside>
  )
}
