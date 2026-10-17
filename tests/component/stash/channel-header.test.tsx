import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/hooks/use-stash', () => ({
  useUpdateChannel: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteChannel: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}))

import { StashChannelHeader } from '@/components/features/stash/stash-channel-header'

const channel = {
  id: 'ch1',
  userId: 'u1',
  name: 'Receipts',
  icon: null,
  color: null,
  isSensitive: false,
  isPinned: false,
  lastMessageAt: null,
  createdAt: '2026-10-17T00:00:00.000Z',
  updatedAt: '2026-10-17T00:00:00.000Z',
}

describe('StashChannelHeader', () => {
  it('offers message search on a channel that is not sensitive', () => {
    render(
      <StashChannelHeader
        channel={channel as never}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        searchOpen={false}
        onToggleSearch={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Search messages' })).toBeInTheDocument()
  })
})
