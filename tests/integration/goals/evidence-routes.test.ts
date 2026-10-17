// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { growthEvidence, goal, focusSession, note, book, project, expense } = vi.hoisted(() => ({
  growthEvidence: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  goal: { findFirst: vi.fn() },
  focusSession: { findMany: vi.fn(), findFirst: vi.fn() },
  note: { findFirst: vi.fn() },
  book: { findFirst: vi.fn() },
  project: { findFirst: vi.fn() },
  expense: { aggregate: vi.fn() },
}))
vi.mock('@/lib/prisma', () => {
  const db = { growthEvidence, goal, focusSession, note, book, project, expense }
  return { prisma: { ...db, $transaction: (fn: (d: unknown) => Promise<unknown>) => fn(db) } }
})
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const evidenceRow = {
  id: 'e1',
  userId: 'u1',
  goalId: 'g1',
  clientRequestId: '6f1c3a0e-4b1a-4e0f-9b1d-2c3d4e5f6a7b',
  observedAt: new Date('2026-10-15T00:00:00Z'),
  summary: 'Ran 5k without stopping',
  measurement: 180,
  kind: 'practice',
  sourceType: 'book',
  sourceId: 'b1',
  sourceTitle: 'Born to Run',
  practiceKey: null,
  createdAt: new Date('2026-10-15T10:00:00Z'),
  updatedAt: new Date('2026-10-15T10:00:00.000Z'),
}

const req = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, ...(body !== undefined && { body: JSON.stringify(body) }) })

describe('growth evidence routes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T05:00:00Z')) // 10:30 IST on 16 Oct
    for (const group of [growthEvidence, goal, focusSession, note, book, project, expense])
      for (const m of Object.values(group)) m.mockReset()
    goal.findFirst.mockResolvedValue({ id: 'g1', userId: 'u1' })
    growthEvidence.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...evidenceRow, ...data }))
    growthEvidence.findUnique.mockResolvedValue(null)
    growthEvidence.findFirst.mockResolvedValue(evidenceRow)
    growthEvidence.updateMany.mockResolvedValue({ count: 1 })
    growthEvidence.findUniqueOrThrow.mockResolvedValue({ ...evidenceRow, summary: 'Ran 5k, corrected' })
    growthEvidence.findMany.mockResolvedValue([])
    growthEvidence.count.mockResolvedValue(3)
    focusSession.findMany.mockResolvedValue([])
    book.findFirst.mockResolvedValue({ id: 'b1', userId: 'u1', title: 'Born to Run', applicationMd: '' })
  })
  afterEach(() => vi.useRealTimers())

  it('POST creates once per client request id, with the source snapshot', async () => {
    const { POST } = await import('@/app/api/growth/evidence/route')
    const body = {
      clientRequestId: evidenceRow.clientRequestId,
      goalId: 'g1',
      observedAt: '2026-10-15',
      summary: 'Ran 5k without stopping',
      measurement: 180,
      kind: 'practice',
      sourceType: 'book',
      sourceId: 'b1',
    }
    const first = await POST(req('/api/growth/evidence', 'POST', body))
    expect(first.status).toBe(201)
    expect(growthEvidence.create.mock.calls[0][0].data).toMatchObject({ userId: 'u1', goalId: 'g1', sourceTitle: 'Born to Run' })
    growthEvidence.findUnique.mockResolvedValue(evidenceRow)
    const second = await POST(req('/api/growth/evidence', 'POST', body))
    expect(second.status).toBe(201)
    expect(growthEvidence.create).toHaveBeenCalledTimes(1)
  })

  it('POST refuses an observation dated in the future', async () => {
    const { POST } = await import('@/app/api/growth/evidence/route')
    const res = await POST(
      req('/api/growth/evidence', 'POST', {
        clientRequestId: evidenceRow.clientRequestId,
        goalId: 'g1',
        observedAt: '2026-10-17',
        summary: 'Not yet',
        kind: 'reflection',
      })
    )
    expect(res.status).toBe(400)
    expect(growthEvidence.create).not.toHaveBeenCalled()
  })

  it('PATCH corrects the observation, keeps the source, and conflicts when stale', async () => {
    const { PATCH } = await import('@/app/api/growth/evidence/[id]/route')
    const ok = await PATCH(
      req('/api/growth/evidence/e1', 'PATCH', { expectedUpdatedAt: '2026-10-15T10:00:00.000Z', summary: 'Ran 5k, corrected', measurement: 185 })
    )
    expect(ok.status).toBe(200)
    const call = growthEvidence.updateMany.mock.calls[0][0]
    expect(call.where).toMatchObject({ id: 'e1', userId: 'u1' })
    expect(call.data).toMatchObject({ summary: 'Ran 5k, corrected', measurement: 185 })
    expect(call.data).not.toHaveProperty('sourceType')
    expect(call.data).not.toHaveProperty('sourceId')
    growthEvidence.updateMany.mockResolvedValue({ count: 0 })
    const stale = await PATCH(req('/api/growth/evidence/e1', 'PATCH', { expectedUpdatedAt: '2026-10-15T09:00:00.000Z', summary: 'x' }))
    expect(stale.status).toBe(409)
  })

  it('GET /api/goals/[id] returns measurement, practice, and evidence counts', async () => {
    goal.findFirst.mockResolvedValue({
      id: 'g1',
      userId: 'u1',
      title: 'Run further',
      description: '',
      category: 'fitness',
      targetDate: null,
      startDate: null,
      expenseCategoryId: null,
      expenseTag: null,
      targetAmount: null,
      status: 'active',
      successCriteria: 'Run 10k comfortably',
      baseline: 200,
      target: 160,
      unit: 'sec/km pace',
      weeklyPracticeTarget: 3,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-01T00:00:00Z'),
      tasks: [{ id: 't1', status: 'completed' }, { id: 't2', status: 'pending' }],
      expenseCategory: null,
      evidence: [{ measurement: 180, observedAt: new Date('2026-10-15T00:00:00Z') }],
      _count: { evidence: 3 },
    })
    growthEvidence.findMany.mockResolvedValue([{ goalId: 'g1', observedAt: new Date('2026-10-15T00:00:00Z'), kind: 'practice' }])
    const { GET } = await import('@/app/api/goals/[id]/route')
    const res = await GET(req('/api/goals/g1', 'GET'))
    expect(res.status).toBe(200)
    const data = (await res.json()).data
    expect(data).toMatchObject({
      successCriteria: 'Run 10k comfortably',
      baseline: 200,
      target: 160,
      unit: 'sec/km pace',
      weeklyPracticeTarget: 3,
      measurement: 180,
      measurementDate: '2026-10-15',
      outcomePercent: 50,
      taskPercent: 50,
      practiceCount: 1,
      evidenceCount: 3,
    })
  })
})
