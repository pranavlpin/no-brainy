// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { focusSession, task } = vi.hoisted(() => ({
  focusSession: { findFirst: vi.fn(), update: vi.fn() },
  task: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    focusSession,
    task,
    $transaction: (fn: (db: unknown) => Promise<unknown>) => fn({ focusSession, task }),
  },
}))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const startedAt = new Date('2026-10-16T09:00:00Z')
const session = {
  id: 's1',
  userId: 'u1',
  taskId: 't1',
  kind: 'work',
  startedAt,
  endedAt: null,
  durationSec: 0,
  completed: false,
  intention: 'Draft the outline',
  outcome: null,
  reflection: '',
  nextAction: null,
  nextActionTaskId: null,
  createdAt: startedAt,
}
const linkedTask = {
  id: 't1',
  userId: 'u1',
  goalId: 'g1',
  status: 'pending',
  title: 'Write the paper',
  context: 'work',
}

const patch = (body: unknown) =>
  new NextRequest('http://localhost/api/focus-sessions/s1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

describe('PATCH /api/focus-sessions/[id] with an outcome', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T09:25:00Z'))
    for (const m of Object.values(focusSession)) m.mockReset()
    for (const m of Object.values(task)) m.mockReset()
    focusSession.findFirst.mockResolvedValue(session)
    focusSession.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...session,
      ...data,
    }))
    task.findFirst.mockResolvedValue(linkedTask)
    task.update.mockResolvedValue({ ...linkedTask, status: 'completed' })
    task.create.mockResolvedValue({ id: 'n1' })
  })
  afterEach(() => vi.useRealTimers())

  it('completed finishes the linked task and a next action becomes an undated task on the same goal', async () => {
    const { PATCH } = await import('@/app/api/focus-sessions/[id]/route')
    const res = await PATCH(
      patch({
        outcome: 'completed',
        reflection: 'Outline done, intro drafted.',
        nextAction: 'Write the method section',
      }),
      { params: Promise.resolve({ id: 's1' }) }
    )
    expect(res.status).toBe(200)
    expect(task.update.mock.calls[0][0]).toMatchObject({
      where: { id: 't1' },
      data: { status: 'completed' },
    })
    const created = task.create.mock.calls[0][0].data
    expect(created).toMatchObject({ userId: 'u1', title: 'Write the method section', goalId: 'g1' })
    expect(created.plannedDate ?? null).toBeNull()
    expect(created.dueDate ?? null).toBeNull()
    const data = focusSession.update.mock.calls[0][0].data
    expect(data).toMatchObject({
      outcome: 'completed',
      reflection: 'Outline done, intro drafted.',
      nextAction: 'Write the method section',
      nextActionTaskId: 'n1',
      completed: true,
    })
    expect((data.endedAt as Date).toISOString()).toBe('2026-10-16T09:25:00.000Z')
    expect((await res.json()).data.outcome).toBe('completed')
  })

  it.each(['progress', 'blocked'])('%s leaves the linked task open', async (outcome) => {
    const { PATCH } = await import('@/app/api/focus-sessions/[id]/route')
    const res = await PATCH(patch({ outcome }), { params: Promise.resolve({ id: 's1' }) })
    expect(res.status).toBe(200)
    expect(task.update).not.toHaveBeenCalled()
    expect(task.create).not.toHaveBeenCalled()
    expect(focusSession.update.mock.calls[0][0].data.outcome).toBe(outcome)
  })

  it('a second finish returns the stored result without writing again', async () => {
    focusSession.findFirst.mockResolvedValue({
      ...session,
      endedAt: new Date('2026-10-16T09:20:00Z'),
      durationSec: 1200,
      outcome: 'progress',
      reflection: 'kept',
    })
    const { PATCH } = await import('@/app/api/focus-sessions/[id]/route')
    const res = await PATCH(patch({ outcome: 'completed' }), {
      params: Promise.resolve({ id: 's1' }),
    })
    expect(res.status).toBe(200)
    expect(focusSession.update).not.toHaveBeenCalled()
    expect(task.update).not.toHaveBeenCalled()
    const json = await res.json()
    expect(json.data.outcome).toBe('progress')
    expect(json.data.reflection).toBe('kept')
  })
})
