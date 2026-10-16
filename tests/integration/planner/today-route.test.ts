// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const dayPlan = { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() }
const task = { findMany: vi.fn(), count: vi.fn() }
const dailyReview = { findUnique: vi.fn() }
const goal = { findMany: vi.fn() }
vi.mock('@/lib/prisma', () => ({ prisma: { dayPlan, task, dailyReview, goal } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

describe('GET /api/planner/today honors the user timezone', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T23:30:00Z')) // 05:00 IST on 2026-10-17
    dayPlan.findUnique.mockReset()
    dayPlan.create.mockReset()
    task.findMany.mockReset().mockResolvedValue([])
    dailyReview.findUnique.mockReset().mockResolvedValue(null)
    goal.findMany.mockReset().mockResolvedValue([])
  })
  afterEach(() => vi.useRealTimers())

  it('creates the plan for the local day, not the UTC day', async () => {
    dayPlan.findUnique.mockResolvedValue(null)
    dayPlan.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'p1',
      userId: 'u1',
      planDate: data.planDate,
      focusTaskIds: [],
      timeBlocks: [],
      aiBriefMd: null,
      intentMd: null,
      createdAt: new Date(),
    }))
    const { GET } = await import('@/app/api/planner/today/route')
    const res = await GET(new NextRequest('http://localhost/api/planner/today'))
    expect(res.status).toBe(200)
    const created = dayPlan.create.mock.calls[0][0].data.planDate as Date
    expect(created.toISOString()).toBe('2026-10-17T00:00:00.000Z')
    const json = await res.json()
    expect(json.data.planDate.startsWith('2026-10-17')).toBe(true)
  })
})
