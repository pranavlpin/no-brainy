'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
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

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
  }, [channelId])

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading channel…</p>
      </div>
    )
  }

  return (
    <>
      <StashChannelHeader
        channel={channel}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchOpen={searchOpen}
        onToggleSearch={() => {
          setSearchOpen((open) => {
            if (open) setSearchQuery('')
            return !open
          })
        }}
      />
      <StashMessageList
        channelId={channelId}
        isSensitive={channel.isSensitive}
        searchQuery={searchQuery}
      />
      <StashComposer channelId={channelId} />
    </>
  )
}
