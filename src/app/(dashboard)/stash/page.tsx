'use client'

import { Archive } from 'lucide-react'
import { StashChannelList } from '@/components/features/stash/stash-channel-list'

export default function StashIndexPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <StashChannelList activeChannelId={null} />
      <main className="hidden flex-1 flex-col items-center justify-center px-8 text-center md:flex">
        <Archive className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 font-display text-xl font-bold text-retro-dark">Pick a channel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a channel on the left, or create a new one.
        </p>
      </main>
    </div>
  )
}
