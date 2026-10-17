// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { dayBoundsUtc, todayKey } from '@/lib/dates'

const prismaMock = vi.hoisted(() => ({
  deck: { findFirst: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown, ctx?: unknown) => Promise<Response>) =>
    (req: NextRequest, ctx?: unknown) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }, ctx),
}))

import { GET } from '@/app/api/decks/[id]/route'

describe('GET /api/decks/[id] due count', () => {
  beforeEach(() => {
    // 19:00 UTC on 17 Oct is already 00:30 on 18 Oct in Kolkata.
    vi.useFakeTimers({ now: new Date('2026-10-17T19:00:00.000Z'), toFake: ['Date'] })
  })
  afterEach(() => vi.useRealTimers())

  it("counts a card scheduled for the start of the user's day, like the badges do", async () => {
    const { start } = dayBoundsUtc(todayKey('Asia/Kolkata'))
    prismaMock.deck.findFirst.mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      name: 'Spanish',
      descriptionMd: null,
      tags: [],
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-01T00:00:00Z'),
      _count: { flashcards: 1 },
      flashcards: [{ state: 'new', nextReviewAt: start }],
    })
    const res = await GET(new NextRequest('http://localhost/api/decks/d1'), {
      params: Promise.resolve({ id: 'd1' }),
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.dueCount).toBe(1)
    expect(json.data.newCount).toBe(1)
  })
})
