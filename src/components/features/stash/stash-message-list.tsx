'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useChannelMessages, useDeleteMessage, useUpdateMessage } from '@/hooks/use-stash'
import { StashMessage } from './stash-message'
import { Skeleton } from '@/components/ui/skeleton'

interface StashMessageListProps {
  channelId: string
}

export function StashMessageList({ channelId }: StashMessageListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChannelMessages(channelId)
  const updateMessage = useUpdateMessage(channelId)
  const deleteMessage = useDeleteMessage(channelId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  // Flatten + reverse so newest is at the bottom
  const messages = useMemo(() => {
    if (!data) return []
    const flat = data.pages.flatMap((p) => p.items)
    return [...flat].reverse()
  }, [data])

  // Scroll to bottom when a new message arrives (count increased) or on first load
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const grew = messages.length > lastCountRef.current
    if (grew) {
      el.scrollTop = el.scrollHeight
    }
    lastCountRef.current = messages.length
  }, [messages.length])

  // Load older messages when the top sentinel becomes visible
  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: scrollRef.current, rootMargin: '200px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-end">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">No messages yet — say something below.</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
      <div ref={topSentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="py-2 text-center text-xs text-muted-foreground">Loading older messages…</div>
      )}
      <div className="space-y-3">
        {messages.map((m) => (
          <StashMessage
            key={m.id}
            message={m}
            onTogglePin={(id, isPinned) => updateMessage.mutate({ id, isPinned })}
            onDelete={(id) => deleteMessage.mutate(id)}
          />
        ))}
      </div>
    </div>
  )
}
