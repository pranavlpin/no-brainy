'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Archive } from 'lucide-react'
import { useChannels } from '@/hooks/use-stash'
import { StashHome } from '@/components/features/stash/stash-home'

function StashIndexContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isHome = searchParams.get('home') === '1'
  const { data: channels, isLoading } = useChannels()

  const hasChannels = !!channels && channels.length > 0

  useEffect(() => {
    if (isHome || isLoading || !hasChannels) return
    if (typeof window === 'undefined') return
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (!isDesktop) return
    router.replace(`/stash/${channels[0].id}`)
  }, [isHome, isLoading, hasChannels, channels, router])

  if (isHome) {
    return (
      <div className="hidden flex-1 md:flex">
        <StashHome />
      </div>
    )
  }

  if (!isLoading && !hasChannels) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center px-8 text-center md:flex">
        <Archive className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 font-display text-xl font-bold text-retro-dark">No channels yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hit <Plus className="inline h-3.5 w-3.5" /> on the left to create your first one.
        </p>
      </div>
    )
  }

  // Loading or pre-redirect: render nothing to avoid flashing stale empty state.
  // The layout already shows the channel list full-width on mobile.
  return null
}

export default function StashIndexPage() {
  return (
    <Suspense fallback={null}>
      <StashIndexContent />
    </Suspense>
  )
}
