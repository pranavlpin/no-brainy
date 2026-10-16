// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const dailyReview = { findUnique: vi.fn(), update: vi.fn() }
const dayPlan = { findUnique: vi.fn(), upsert: vi.fn() }
vi.mock('@/lib/prisma', () => ({ prisma: { dailyReview, dayPlan } }))
vi.mock('@/lib/auth/middleware', () => ({
  getAuthUser: async () => ({ id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const review = {
  id: 'r1',
  userId: 'u1',
  reviewDate: new Date('2026-10-16T00:00:00.000Z'),
  tasksCompleted: 2,
  tasksMissed: 1,
  notesCreated: 0,
  cardsReviewed: 5,
  reflectionMd: '',
  aiSummaryMd: null,
  mood: null,
  tomorrowIntent: null,
  createdAt: new Date(),
}

function put(body: unknown) {
  return new NextRequest('http://localhost/api/reviews/daily/2026-10-16', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

describe('PUT /api/reviews/daily/[date] tomorrow handoff', () => {
  beforeEach(() => {
    dailyReview.findUnique.mockReset().mockResolvedValue(review)
    dailyReview.update
      .mockReset()
      .mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...review,
        ...data,
      }))
    dayPlan.findUnique.mockReset()
    dayPlan.upsert.mockReset().mockResolvedValue({})
  })

  it('writes the intent into an empty next-day plan', async () => {
    dayPlan.findUnique.mockResolvedValue(null)
    const { PUT } = await import('@/app/api/reviews/daily/[date]/route')
    const res = await PUT(put({ mood: 'good', tomorrowIntent: 'Ship Home' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.tomorrowIntent).toBe('Ship Home')
    const call = dayPlan.upsert.mock.calls[0][0]
    expect((call.where.userId_planDate.planDate as Date).toISOString()).toBe(
      '2026-10-17T00:00:00.000Z'
    )
    expect(call.create.intentMd).toBe('Ship Home')
    expect(call.update.intentMd).toBe('Ship Home')
  })

  it('replaces an intent it previously wrote but leaves a different one alone', async () => {
    dailyReview.findUnique.mockResolvedValue({ ...review, tomorrowIntent: 'Old handoff' })
    dayPlan.findUnique.mockResolvedValue({ id: 'p2', intentMd: 'Old handoff' })
    const { PUT } = await import('@/app/api/reviews/daily/[date]/route')
    await PUT(put({ tomorrowIntent: 'New handoff' }))
    expect(dayPlan.upsert).toHaveBeenCalledTimes(1)

    dayPlan.upsert.mockClear()
    dayPlan.findUnique.mockResolvedValue({ id: 'p2', intentMd: 'User typed their own' })
    await PUT(put({ tomorrowIntent: 'Another handoff' }))
    expect(dayPlan.upsert).not.toHaveBeenCalled()
  })

  it('does not touch the plan when no intent is sent', async () => {
    const { PUT } = await import('@/app/api/reviews/daily/[date]/route')
    await PUT(put({ mood: 'okay' }))
    expect(dayPlan.upsert).not.toHaveBeenCalled()
  })
})
