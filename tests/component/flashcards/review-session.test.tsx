import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'd1' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

const rate = vi.fn()
const now = '2026-10-17T05:00:00.000Z'
const card = {
  id: 'c1',
  deckId: 'd1',
  userId: 'u1',
  cardType: 'basic',
  frontMd: 'Hola',
  backMd: 'Hello',
  tags: [],
  sourceType: null,
  sourceId: null,
  sourceExcerpt: null,
  state: 'new',
  easeFactor: 2.5,
  interval: 0,
  nextReviewAt: now,
  reviewCount: 0,
  lastRating: null,
  createdAt: now,
  updatedAt: now,
}
const session = {
  id: 's1',
  userId: 'u1',
  deckId: 'd1',
  startedAt: now,
  completedAt: null,
  cardsReviewed: 0,
  cardsEasy: 0,
  cardsMedium: 0,
  cardsHard: 0,
  cardsForgot: 0,
}
vi.mock('@/hooks/use-flashcards', () => ({
  useStartReview: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ session, cards: [card] }),
    isPending: false,
  }),
  useRateCard: () => ({ mutate: rate, isPending: false }),
  useCompleteReview: () => ({ mutate: vi.fn(), isPending: false }),
}))

import ReviewPage from '@/app/(dashboard)/flashcards/[id]/review/page'

describe('Review session', () => {
  it('rates a revealed card inside the session the server opened', async () => {
    render(<ReviewPage />)
    const reveal = await screen.findByText('Click to reveal answer')
    await userEvent.click(reveal)
    await userEvent.click(screen.getByRole('button', { name: /Easy/ }))
    expect(rate).toHaveBeenCalledWith(
      expect.objectContaining({ cardId: 'c1', rating: 'easy', sessionId: 's1' })
    )
  })
})
