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

  it("seeds a new plan with last night's tomorrow intent", async () => {
    dayPlan.findUnique.mockResolvedValue(null)
    dailyReview.findUnique.mockResolvedValue({ tomorrowIntent: 'Write the Home page' })
    dayPlan.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'p1',
      userId: 'u1',
      planDate: data.planDate,
      focusTaskIds: [],
      timeBlocks: [],
      aiBriefMd: null,
      intentMd: data.intentMd ?? null,
      createdAt: new Date(),
    }))
    const { GET } = await import('@/app/api/planner/today/route')
    const res = await GET(new NextRequest('http://localhost/api/planner/today'))
    const json = await res.json()
    expect(dayPlan.create.mock.calls[0][0].data.intentMd).toBe('Write the Home page')
    expect(json.data.intentMd).toBe('Write the Home page')
    // The review looked up is yesterday's (2026-10-16 for a plan on 2026-10-17).
    const lookedUp = dailyReview.findUnique.mock.calls[0][0].where.userId_reviewDate
      .reviewDate as Date
    expect(lookedUp.toISOString()).toBe('2026-10-16T00:00:00.000Z')
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

  it('returns capacity fields and the tasks planned for today separately from deadlines', async () => {
    dayPlan.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      planDate: new Date('2026-10-17T00:00:00.000Z'),
      focusTaskIds: [],
      timeBlocks: [],
      aiBriefMd: null,
      intentMd: null,
      availableMinutes: 240,
      bufferMinutes: 10,
      workStart: '09:00',
      workEnd: '18:00',
      createdAt: new Date(),
    })
    const base = {
      userId: 'u1',
      parentTaskId: null,
      goalId: null,
      descriptionMd: '',
      priority: 'medium',
      status: 'pending',
      tags: [],
      completedAt: null,
      isRecurring: false,
      rrule: null,
      quadrant: null,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const planned = {
      ...base,
      id: 'planned',
      title: 'Planned',
      dueDate: new Date('2026-10-30T00:00:00.000Z'),
      plannedDate: new Date('2026-10-17T00:00:00.000Z'),
      estimatedMinutes: 45,
    }
    const due = {
      ...base,
      id: 'due',
      title: 'Due',
      dueDate: new Date('2026-10-17T00:00:00.000Z'),
      plannedDate: null,
    }
    // First findMany: today's tasks (planned or due). Second: leftovers.
    task.findMany.mockResolvedValueOnce([planned, due]).mockResolvedValueOnce([])
    const { GET } = await import('@/app/api/planner/today/route')
    const res = await GET(new NextRequest('http://localhost/api/planner/today'))
    const json = await res.json()
    expect(json.data).toMatchObject({
      availableMinutes: 240,
      bufferMinutes: 10,
      workStart: '09:00',
      workEnd: '18:00',
    })
    expect(json.data.plannedTasks.map((t: { id: string }) => t.id)).toEqual(['planned'])
    expect(json.data.tasksDueToday.map((t: { id: string }) => t.id)).toEqual(['due'])
    // Leftovers include tasks planned for earlier days, not only passed deadlines.
    const leftoverWhere = task.findMany.mock.calls[1][0].where
    expect(JSON.stringify(leftoverWhere)).toContain('plannedDate')
  })

  it('PUT persists capacity settings', async () => {
    dayPlan.upsert
      .mockReset()
      .mockImplementation(async ({ update }: { update: Record<string, unknown> }) => ({
        id: 'p1',
        userId: 'u1',
        planDate: new Date('2026-10-17T00:00:00.000Z'),
        focusTaskIds: [],
        timeBlocks: [],
        aiBriefMd: null,
        intentMd: null,
        availableMinutes: 180,
        bufferMinutes: 15,
        workStart: null,
        workEnd: null,
        ...update,
        createdAt: new Date(),
      }))
    const { PUT } = await import('@/app/api/planner/today/route')
    const res = await PUT(
      new NextRequest('http://localhost/api/planner/today', {
        method: 'PUT',
        body: JSON.stringify({
          availableMinutes: 300,
          bufferMinutes: 30,
          workStart: '10:00',
          workEnd: '19:00',
        }),
      })
    )
    expect(res.status).toBe(200)
    const update = dayPlan.upsert.mock.calls[0][0].update
    expect(update).toMatchObject({
      availableMinutes: 300,
      bufferMinutes: 30,
      workStart: '10:00',
      workEnd: '19:00',
    })
    const json = await res.json()
    expect(json.data.availableMinutes).toBe(300)
  })
})
