'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useChannelMessages, useDeleteMessage, useUpdateMessage } from '@/hooks/use-stash'
import { StashMessage } from './stash-message'
import { Skeleton } from '@/components/ui/skeleton'

interface StashMessageListProps {
  channelId: string
  isSensitive: boolean
  searchQuery?: string
}

export function StashMessageList({ channelId, isSensitive, searchQuery = '' }: StashMessageListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChannelMessages(
    channelId,
    isSensitive ? { pageSize: 2000 } : undefined
  )
  const updateMessage = useUpdateMessage(channelId)
  const deleteMessage = useDeleteMessage(channelId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef(0)

  // Flatten + reverse so newest is at the bottom
  const allMessages = useMemo(() => {
    if (!data) return []
    const flat = data.pages.flatMap((p) => p.items)
    return [...flat].reverse()
  }, [data])

  // Client-side filter when a search query is present
  const messages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length === 0) return allMessages
    return allMessages.filter((m) => {
      if (m.label?.toLowerCase().includes(q)) return true
      if (m.content.toLowerCase().includes(q)) return true
      if (m.linkUrl?.toLowerCase().includes(q)) return true
      if (m.linkTitle?.toLowerCase().includes(q)) return true
      if (m.fileName?.toLowerCase().includes(q)) return true
      return false
    })
  }, [allMessages, searchQuery])

  const isFiltering = searchQuery.trim().length > 0

  // Scroll to bottom when a new message arrives (count increased) or on first load — only when not filtering
  useEffect(() => {
    if (isFiltering) return
    const el = scrollRef.current
    if (!el) return
    const grew = messages.length > lastCountRef.current
    if (grew) {
      el.scrollTop = el.scrollHeight
    }
    lastCountRef.current = messages.length
  }, [messages.length, isFiltering])

  // Load older pages on scroll up — only for paginated (non-sensitive) channels and when not filtering
  useEffect(() => {
    if (isSensitive || isFiltering) return
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isSensitive, isFiltering])

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

  if (allMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">No messages yet — say something below.</p>
      </div>
    )
  }

  if (isFiltering && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          No matches for &ldquo;{searchQuery}&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
      {!isSensitive && <div ref={topSentinelRef} className="h-1" />}
      {isFetchingNextPage && (
        <div className="py-2 text-center text-xs text-muted-foreground">Loading older messages…</div>
      )}
      {isFiltering && (
        <div className="mb-2 text-center text-xs text-muted-foreground">
          {messages.length} match{messages.length === 1 ? '' : 'es'} for &ldquo;{searchQuery}&rdquo;
        </div>
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
