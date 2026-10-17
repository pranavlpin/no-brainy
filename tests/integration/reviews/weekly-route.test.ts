// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { weeklyReview, task, dailyReview, focusSession, growthEvidence } = vi.hoisted(() => ({
  weeklyReview: { upsert: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  task: { findFirst: vi.fn(), update: vi.fn() },
  dailyReview: { findMany: vi.fn(async () => []) },
  focusSession: { findMany: vi.fn(async () => []) },
  growthEvidence: { findMany: vi.fn(async () => []) },
}))
vi.mock('@/lib/prisma', () => {
  const db = { weeklyReview, task, dailyReview, focusSession, growthEvidence }
  return { prisma: { ...db, $transaction: (fn: (d: unknown) => Promise<unknown>) => fn(db) } }
})
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const row = {
  id: 'w1',
  userId: 'u1',
  weekStart: new Date('2026-10-12T00:00:00.000Z'),
  stopDoing: '',
  keepDoing: '',
  startTrying: '',
  reflectionMd: '',
  outcomes: [],
  nextTaskId: null,
  closedAt: null,
  createdAt: new Date('2026-10-12T00:00:00Z'),
  updatedAt: new Date('2026-10-16T10:00:00.000Z'),
  nextTask: null,
}

const req = (week: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost/api/reviews/weekly/${week}`, {
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

describe('weekly review route', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T05:00:00Z'))
    for (const g of [weeklyReview, task]) for (const m of Object.values(g)) m.mockReset()
    weeklyReview.upsert.mockResolvedValue(row)
    weeklyReview.findUnique.mockResolvedValue(row)
    weeklyReview.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...row,
      ...data,
    }))
    task.findFirst.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      title: 'Write the paper',
      status: 'pending',
      plannedDate: null,
      dueDate: new Date('2026-10-30T00:00:00Z'),
    })
    task.update.mockResolvedValue({ id: 't1' })
  })
  afterEach(() => vi.useRealTimers())

  it('GET creates the week on first read and rejects a non-Monday key', async () => {
    const { GET } = await import('@/app/api/reviews/weekly/[weekStart]/route')
    const res = await GET(req('2026-10-12', 'GET'))
    expect(res.status).toBe(200)
    const where = weeklyReview.upsert.mock.calls[0][0].where.userId_weekStart
    expect(where.userId).toBe('u1')
    expect((where.weekStart as Date).toISOString()).toBe('2026-10-12T00:00:00.000Z')
    const json = await res.json()
    expect(json.data).toMatchObject({
      weekStart: '2026-10-12',
      weekEnd: '2026-10-18',
      outcomes: [],
    })
    const bad = await GET(req('2026-10-13', 'GET'))
    expect(bad.status).toBe(400)
  })

  it('PUT plans the chosen next action onto the following Monday without touching its deadline', async () => {
    const { PUT } = await import('@/app/api/reviews/weekly/[weekStart]/route')
    const res = await PUT(
      req('2026-10-12', 'PUT', {
        stopDoing: 'Checking email first thing',
        outcomes: [{ id: 'a', text: 'Ship the planner' }],
        nextTaskId: 't1',
        expectedUpdatedAt: '2026-10-16T10:00:00.000Z',
      })
    )
    expect(res.status).toBe(200)
    const planned = task.update.mock.calls[0][0]
    expect(planned.where).toEqual({ id: 't1' })
    expect((planned.data.plannedDate as Date).toISOString()).toBe('2026-10-19T00:00:00.000Z')
    expect(planned.data.dueDate).toBeUndefined()
    expect(weeklyReview.update.mock.calls[0][0].data).toMatchObject({
      stopDoing: 'Checking email first thing',
      nextTaskId: 't1',
    })
  })

  it('PUT with a stale version is a conflict and writes nothing', async () => {
    const { PUT } = await import('@/app/api/reviews/weekly/[weekStart]/route')
    const res = await PUT(
      req('2026-10-12', 'PUT', {
        keepDoing: 'Morning runs',
        expectedUpdatedAt: '2026-10-16T09:00:00.000Z',
      })
    )
    expect(res.status).toBe(409)
    expect(weeklyReview.update).not.toHaveBeenCalled()
    expect(task.update).not.toHaveBeenCalled()
  })

  it('PUT with closeReview records the close once', async () => {
    const { PUT } = await import('@/app/api/reviews/weekly/[weekStart]/route')
    const res = await PUT(
      req('2026-10-12', 'PUT', { closeReview: true, expectedUpdatedAt: '2026-10-16T10:00:00.000Z' })
    )
    expect(res.status).toBe(200)
    expect(weeklyReview.update.mock.calls[0][0].data.closedAt).toBeInstanceOf(Date)
  })
})
