'use client'

import Link from 'next/link'
import { Lock, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StashChannelResponse } from '@/types/stash'

interface StashChannelTileProps {
  channel: StashChannelResponse
  isActive: boolean
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'now'
  if (diff < hour) return `${Math.floor(diff / minute)}m`
  if (diff < day) return `${Math.floor(diff / hour)}h`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function StashChannelTile({ channel, isActive }: StashChannelTileProps) {
  return (
    <Link
      href={`/stash/${channel.id}`}
      className={cn(
        'flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors',
        isActive
          ? 'border-retro-blue bg-retro-blue/10'
          : 'border-transparent hover:bg-retro-blue/5'
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-retro-blue/10 text-retro-blue font-mono text-sm font-bold"
        style={channel.color ? { backgroundColor: `${channel.color}20`, color: channel.color } : undefined}
      >
        {channel.icon || channel.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{channel.name}</span>
          {channel.isSensitive && (
            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Sensitive" />
          )}
          {channel.isPinned && (
            <Pin className="h-3 w-3 shrink-0 text-retro-blue" aria-label="Pinned" />
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {channel.lastMessageAt ? formatRelative(channel.lastMessageAt) : 'No messages yet'}
        </div>
      </div>
    </Link>
  )
}
