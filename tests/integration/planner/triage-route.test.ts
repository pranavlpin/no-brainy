// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const task = { findFirst: vi.fn(), update: vi.fn() }
vi.mock('@/lib/prisma', () => ({ prisma: { task } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const existing = {
  id: 't1',
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  title: 'Leftover',
  descriptionMd: '',
  priority: 'medium',
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

function post(body: unknown) {
  return new NextRequest('http://localhost/api/planner/triage', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/planner/triage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-17T03:00:00Z')) // 08:30 IST, 2026-10-17
    task.findFirst.mockReset().mockResolvedValue(existing)
    task.update
      .mockReset()
      .mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...existing,
        ...data,
      }))
  })
  afterEach(() => vi.useRealTimers())

  it('keep plans the task for today and leaves the deadline alone', async () => {
    const { POST } = await import('@/app/api/planner/triage/route')
    const res = await POST(post({ taskId: 't1', action: 'keep' }))
    expect(res.status).toBe(200)
    const data = task.update.mock.calls[0][0].data
    expect((data.plannedDate as Date).toISOString()).toBe('2026-10-17T00:00:00.000Z')
    expect(data.dueDate).toBeUndefined()
  })

  it('move plans the chosen future day, keeps the deadline, and rejects past dates', async () => {
    const { POST } = await import('@/app/api/planner/triage/route')
    const ok = await POST(post({ taskId: 't1', action: 'move', date: '2026-10-20' }))
    expect(ok.status).toBe(200)
    const data = task.update.mock.calls[0][0].data
    expect((data.plannedDate as Date).toISOString()).toBe('2026-10-20T00:00:00.000Z')
    expect(data.dueDate).toBeUndefined()
    const bad = await POST(post({ taskId: 't1', action: 'move', date: '2026-10-17' }))
    expect(bad.status).toBe(400)
  })

  it('drop cancels the task without deleting it', async () => {
    const { POST } = await import('@/app/api/planner/triage/route')
    const res = await POST(post({ taskId: 't1', action: 'drop' }))
    expect(res.status).toBe(200)
    expect(task.update.mock.calls[0][0].data.status).toBe('cancelled')
  })

  it('returns 404 for a task the user does not own', async () => {
    task.findFirst.mockResolvedValue(null)
    const { POST } = await import('@/app/api/planner/triage/route')
    const res = await POST(post({ taskId: 'nope', action: 'keep' }))
    expect(res.status).toBe(404)
  })
})
