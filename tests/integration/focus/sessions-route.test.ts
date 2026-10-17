// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const focusSession = {
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  updateMany: vi.fn(),
}
vi.mock('@/lib/prisma', () => ({ prisma: { focusSession } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const startedAt = new Date('2026-10-16T09:00:00Z')

describe('focus sessions API', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T09:25:00Z'))
    Object.values(focusSession).forEach((f) => f.mockReset())
    focusSession.findMany.mockResolvedValue([])
    focusSession.updateMany.mockResolvedValue({ count: 0 })
  })
  afterEach(() => vi.useRealTimers())

  it('POST starts a work session for a task', async () => {
    focusSession.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 's1',
      userId: 'u1',
      taskId: data.taskId,
      kind: data.kind,
      startedAt,
      endedAt: null,
      durationSec: 0,
      completed: false,
      createdAt: startedAt,
    }))
    const { POST } = await import('@/app/api/focus-sessions/route')
    const res = await POST(
      new NextRequest('http://localhost/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify({ taskId: 't1', kind: 'work' }),
      })
    )
    expect(res.status).toBe(201)
    expect(focusSession.create.mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      taskId: 't1',
      kind: 'work',
    })
    const json = await res.json()
    expect(json.data.id).toBe('s1')
  })

  it('PATCH ends a session and records its real duration', async () => {
    focusSession.findFirst.mockResolvedValue({ id: 's1', userId: 'u1', startedAt, endedAt: null })
    focusSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 's1',
      userId: 'u1',
      taskId: 't1',
      kind: 'work',
      startedAt,
      endedAt: data.endedAt,
      durationSec: data.durationSec,
      completed: data.completed,
      createdAt: startedAt,
    }))
    const { PATCH } = await import('@/app/api/focus-sessions/[id]/route')
    const res = await PATCH(
      new NextRequest('http://localhost/api/focus-sessions/s1', {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      }),
      { params: Promise.resolve({ id: 's1' }) }
    )
    expect(res.status).toBe(200)
    const data = focusSession.update.mock.calls[0][0].data
    expect(data.durationSec).toBe(25 * 60)
    expect(data.completed).toBe(true)
    expect((data.endedAt as Date).toISOString()).toBe('2026-10-16T09:25:00.000Z')
  })

  it('GET ?date sums work minutes for the local day and closes stale sessions', async () => {
    focusSession.findMany.mockResolvedValue([
      {
        id: 'a',
        kind: 'work',
        durationSec: 1500,
        startedAt,
        endedAt: startedAt,
        completed: true,
        taskId: null,
        userId: 'u1',
        createdAt: startedAt,
      },
      {
        id: 'b',
        kind: 'break',
        durationSec: 300,
        startedAt,
        endedAt: startedAt,
        completed: true,
        taskId: null,
        userId: 'u1',
        createdAt: startedAt,
      },
      {
        id: 'c',
        kind: 'work',
        durationSec: 600,
        startedAt,
        endedAt: startedAt,
        completed: false,
        taskId: null,
        userId: 'u1',
        createdAt: startedAt,
      },
    ])
    const { GET } = await import('@/app/api/focus-sessions/route')
    const res = await GET(new NextRequest('http://localhost/api/focus-sessions?date=2026-10-16'))
    const json = await res.json()
    expect(json.data.totalWorkMinutes).toBe(35)
    expect(json.data.sessions).toHaveLength(3)
    // The first findMany looks for stale open sessions; the day query follows.
    const dayCall = focusSession.findMany.mock.calls.find(
      (c) => (c[0] as { where: { startedAt?: { gte?: Date } } }).where.startedAt?.gte
    )!
    const where = (dayCall[0] as { where: { startedAt: { gte: Date; lt: Date } } }).where
    expect((where.startedAt.gte as Date).toISOString()).toBe('2026-10-15T18:30:00.000Z')
    expect((where.startedAt.lt as Date).toISOString()).toBe('2026-10-16T18:30:00.000Z')
    expect(focusSession.updateMany).toHaveBeenCalled()
  })
})
