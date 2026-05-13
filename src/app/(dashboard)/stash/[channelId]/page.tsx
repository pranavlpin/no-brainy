'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { StashChannelHeader } from '@/components/features/stash/stash-channel-header'
import { StashMessageList } from '@/components/features/stash/stash-message-list'
import { StashComposer } from '@/components/features/stash/stash-composer'
import { useChannels } from '@/hooks/use-stash'

export default function StashChannelPage() {
  const params = useParams<{ channelId: string }>()
  const channelId = params.channelId
  const router = useRouter()
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

  // Esc closes the chat to the home page. Ignore when typing in inputs/textareas
  // so it doesn't fight the composer or in-channel search.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      router.push('/stash?home=1')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

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
