// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { project, projectNote, goal, task, note } = vi.hoisted(() => ({
  project: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  projectNote: { deleteMany: vi.fn(), createMany: vi.fn() },
  goal: { findFirst: vi.fn() },
  task: { findFirst: vi.fn(), upsert: vi.fn() },
  note: { count: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project,
    projectNote,
    goal,
    task,
    note,
    $transaction: (fn: (db: unknown) => Promise<unknown>) => fn({ project, projectNote, goal, task, note }),
  },
}))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const row = {
  id: 'p1',
  userId: 'u1',
  title: 'Launch the course',
  outcome: 'First cohort enrolled',
  context: 'work',
  status: 'active',
  goalId: 'g1',
  nextActionId: null,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-16T10:00:00.000Z'),
  tasks: [],
  notes: [],
  nextAction: null,
}

const req = (path: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost/api/projects${path}`, {
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

describe('projects routes', () => {
  beforeEach(() => {
    for (const group of [project, projectNote, goal, task, note]) for (const m of Object.values(group)) m.mockReset()
    project.findMany.mockResolvedValue([row])
    project.findFirst.mockResolvedValue(row)
    project.create.mockResolvedValue(row)
    project.update.mockResolvedValue(row)
    project.updateMany.mockResolvedValue({ count: 1 })
    project.findUniqueOrThrow.mockResolvedValue(row)
    goal.findFirst.mockResolvedValue({ id: 'g1' })
    note.count.mockResolvedValue(0)
  })

  it('GET lists only the owner’s active projects by default', async () => {
    const { GET } = await import('@/app/api/projects/route')
    const res = await GET(req('', 'GET'))
    expect(res.status).toBe(200)
    expect(project.findMany.mock.calls[0][0].where).toMatchObject({ userId: 'u1', status: 'active' })
    const json = await res.json()
    expect(json.data[0]).toMatchObject({ id: 'p1', taskCount: 0, completedTaskCount: 0 })
  })

  it('POST creates a project and refuses a goal the user does not own', async () => {
    const { POST } = await import('@/app/api/projects/route')
    const ok = await POST(req('', 'POST', { title: 'Launch the course', goalId: 'g1', context: 'work' }))
    expect(ok.status).toBe(201)
    expect(project.create.mock.calls[0][0].data).toMatchObject({ userId: 'u1', title: 'Launch the course', goalId: 'g1' })
    goal.findFirst.mockResolvedValue(null)
    const bad = await POST(req('', 'POST', { title: 'Sneaky', goalId: 'g-other' }))
    expect(bad.status).toBe(400)
    expect(project.create).toHaveBeenCalledTimes(1)
  })

  it('PATCH rejects a next action outside the project and otherwise saves it', async () => {
    const { PATCH } = await import('@/app/api/projects/[id]/route')
    task.findFirst.mockResolvedValue(null)
    const bad = await PATCH(req('/p1', 'PATCH', { nextActionId: 't-foreign' }))
    expect(bad.status).toBe(400)
    expect(project.updateMany).not.toHaveBeenCalled()
    const where = task.findFirst.mock.calls[0][0].where
    expect(where).toMatchObject({ id: 't-foreign', userId: 'u1', projectId: 'p1' })

    task.findFirst.mockResolvedValue({ id: 't1' })
    const ok = await PATCH(req('/p1', 'PATCH', { nextActionId: 't1' }))
    expect(ok.status).toBe(200)
    expect(project.updateMany.mock.calls[0][0].data).toMatchObject({ nextActionId: 't1' })
  })

  it('PATCH with a stale expectedUpdatedAt is a conflict', async () => {
    project.updateMany.mockResolvedValue({ count: 0 })
    const { PATCH } = await import('@/app/api/projects/[id]/route')
    const res = await PATCH(req('/p1', 'PATCH', { title: 'Renamed', expectedUpdatedAt: '2026-10-16T09:00:00.000Z' }))
    expect(res.status).toBe(409)
  })

  it('adding an action with the same submission id creates one task and makes it the next action', async () => {
    task.upsert.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }))
    const { POST } = await import('@/app/api/projects/[id]/actions/route')
    const body = { title: 'Write the landing page', submissionId: '6f1c3a0e-4b1a-4e0f-9b1d-2c3d4e5f6a7b' }
    const first = await POST(req('/p1/actions', 'POST', body))
    const second = await POST(req('/p1/actions', 'POST', body))
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    const [a, b] = task.upsert.mock.calls.map((c) => c[0].where.id as string)
    expect(a).toBe(b)
    expect(task.upsert.mock.calls[0][0].create).toMatchObject({
      userId: 'u1',
      projectId: 'p1',
      title: 'Write the landing page',
      goalId: 'g1',
      context: 'work',
    })
    expect(project.update.mock.calls[0][0].data).toMatchObject({ nextActionId: a })
  })
})
