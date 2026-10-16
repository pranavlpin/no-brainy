'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { StashChannelList } from '@/components/features/stash/stash-channel-list'

export default function StashLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/stash\/([^/]+)/)
  const activeChannelId = match?.[1] ?? null
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex min-w-0 h-[calc(100dvh-10rem)] w-full overflow-hidden rounded-2xl border bg-card">
      <div
        className={
          activeChannelId ? 'hidden md:flex md:w-80 md:shrink-0' : 'flex w-full md:w-80 md:shrink-0'
        }
      >
        <StashChannelList
          activeChannelId={activeChannelId}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </div>
      <section
        aria-label="Stash content"
        className={
          activeChannelId
            ? 'flex min-w-0 flex-1 flex-col'
            : 'hidden min-w-0 flex-1 flex-col md:flex'
        }
      >
        {children}
      </section>
    </div>
  )
}
