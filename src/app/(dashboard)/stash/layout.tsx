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
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <div
        className={
          activeChannelId
            ? 'hidden md:flex md:w-80 md:shrink-0'
            : 'flex w-full md:w-80 md:shrink-0'
        }
      >
        <StashChannelList
          activeChannelId={activeChannelId}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
