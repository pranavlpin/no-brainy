'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { StashChannelList } from '@/components/features/stash/stash-channel-list'
import { StashChannelHeader } from '@/components/features/stash/stash-channel-header'
import { StashMessageList } from '@/components/features/stash/stash-message-list'
import { StashComposer } from '@/components/features/stash/stash-composer'
import { useChannels } from '@/hooks/use-stash'

export default function StashChannelPage() {
  const params = useParams<{ channelId: string }>()
  const channelId = params.channelId
  const { data: channels } = useChannels()
  const channel = useMemo(
    () => channels?.find((c) => c.id === channelId) ?? null,
    [channels, channelId]
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <div className="hidden md:flex md:w-80 md:shrink-0">
        <StashChannelList activeChannelId={channelId} />
      </div>
      <main className="flex flex-1 flex-col">
        {channel ? (
          <>
            <StashChannelHeader channel={channel} />
            <StashMessageList channelId={channelId} />
            <StashComposer channelId={channelId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading channel…</p>
          </div>
        )}
      </main>
    </div>
  )
}
