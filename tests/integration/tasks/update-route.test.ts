// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { task } = vi.hoisted(() => ({ task: { findFirst: vi.fn(), update: vi.fn() } }))
vi.mock('@/lib/prisma', () => ({ prisma: { task } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const row = {
  id: 't1',
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  projectId: null,
  title: 'Task',
  descriptionMd: '',
  priority: 'medium',
  priorityRank: 2,
  status: 'pending',
  tags: [],
  dueDate: null,
  plannedDate: null,
  estimatedMinutes: null,
  effort: null,
  context: null,
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-16T10:00:00.000Z'),
  subtasks: [],
  taskLinks: [],
}

function put(body: unknown) {
  return new NextRequest('http://localhost/api/tasks/t1', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

describe('PUT /api/tasks/[id]', () => {
  beforeEach(() => {
    task.findFirst.mockReset().mockResolvedValue(row)
    task.update
      .mockReset()
      .mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...row,
        ...data,
        updatedAt: new Date(),
      }))
  })

  it('returns 409 and writes nothing when the expected version is stale', async () => {
    const { PUT } = await import('@/app/api/tasks/[id]/route')
    const res = await PUT(put({ title: 'New', expectedUpdatedAt: '2026-10-16T09:00:00.000Z' }), {
      params: Promise.resolve({ id: 't1' }),
    })
    expect(res.status).toBe(409)
    expect(task.update).not.toHaveBeenCalled()
  })

  it('updates the priority rank with the priority and stores planning fields', async () => {
    const { PUT } = await import('@/app/api/tasks/[id]/route')
    const res = await PUT(
      put({
        priority: 'urgent',
        plannedDate: '2026-10-20',
        estimatedMinutes: 30,
        expectedUpdatedAt: '2026-10-16T10:00:00.000Z',
      }),
      { params: Promise.resolve({ id: 't1' }) }
    )
    expect(res.status).toBe(200)
    const data = task.update.mock.calls[0][0].data
    expect(data.priorityRank).toBe(0)
    expect((data.plannedDate as Date).toISOString()).toBe('2026-10-20T00:00:00.000Z')
    expect(data.estimatedMinutes).toBe(30)
  })
})
