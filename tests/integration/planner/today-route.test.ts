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

  it('returns intent, carry-forward leftovers, and goal chips', async () => {
    dayPlan.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      planDate: new Date('2026-10-17T00:00:00.000Z'),
      focusTaskIds: [],
      timeBlocks: [],
      aiBriefMd: null,
      intentMd: 'Finish the Today page',
      createdAt: new Date(),
    })
    const leftover = {
      id: 't9',
      userId: 'u1',
      parentTaskId: null,
      goalId: 'g1',
      title: 'Leftover from yesterday',
      descriptionMd: '',
      priority: 'high',
      status: 'pending',
      tags: [],
      dueDate: new Date('2026-10-16T00:00:00.000Z'),
      completedAt: null,
      isRecurring: false,
      rrule: null,
      quadrant: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    // First findMany: tasks due today (none). Second: yesterday's leftovers.
    task.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([leftover])
    goal.findMany.mockResolvedValue([{ id: 'g1', title: 'Ship NoBrainy', category: 'work' }])
    const { GET } = await import('@/app/api/planner/today/route')
    const res = await GET(new NextRequest('http://localhost/api/planner/today'))
    const json = await res.json()
    expect(json.data.intentMd).toBe('Finish the Today page')
    expect(json.data.carryForward.map((t: { id: string }) => t.id)).toEqual(['t9'])
    expect(json.data.goals).toEqual([{ id: 'g1', title: 'Ship NoBrainy', category: 'work' }])
  })
})
