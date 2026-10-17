// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { coreImportReceipt, dayPlan, dailyReview, weeklyReview, goal, user, tx } = vi.hoisted(
  () => ({
    coreImportReceipt: { findUnique: vi.fn(), create: vi.fn() },
    dayPlan: { findMany: vi.fn(async () => []) },
    dailyReview: { findMany: vi.fn(async () => []) },
    weeklyReview: { findMany: vi.fn(async () => []) },
    goal: { create: vi.fn() },
    user: { update: vi.fn(), findUnique: vi.fn() },
    tx: vi.fn(),
  })
)
vi.mock('@/lib/prisma', () => {
  const db = { coreImportReceipt, dayPlan, dailyReview, weeklyReview, goal, user }
  return {
    prisma: {
      ...db,
      $transaction: (fn: (d: unknown) => Promise<unknown>) => {
        tx()
        return fn(db)
      },
    },
  }
})
vi.mock('@/lib/auth/middleware', () => ({
  withAuth: (handler: (req: NextRequest, u: unknown) => Promise<Response>) => (req: NextRequest) =>
    handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const backup = {
  version: 1,
  scope: 'nobrainy-core',
  exportedAt: '2026-10-16T10:00:00.000Z',
  omittedLinks: 0,
  data: {
    captures: [],
    goals: [],
    projects: [],
    notes: [],
    tasks: [],
    taskLinks: [],
    projectNotes: [],
    noteLinks: [],
    dayPlans: [],
    dailyReviews: [],
    weeklyReviews: [],
    focusSessions: [],
    growthEvidence: [],
  },
}
const requestId = '6f1c3a0e-4b1a-4e0f-9b1d-2c3d4e5f6a7b'
const post = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: 'POST', body: JSON.stringify(body) })

describe('core import', () => {
  beforeEach(() => {
    for (const g of [coreImportReceipt, goal, user]) for (const m of Object.values(g)) m.mockReset()
    tx.mockReset()
    coreImportReceipt.findUnique.mockResolvedValue(null)
  })

  it('preview returns counts and a fingerprint without writing anything', async () => {
    const { POST } = await import('@/app/api/data/preview/route')
    const res = await POST(post('/api/data/preview', backup))
    expect(res.status).toBe(200)
    const data = (await res.json()).data
    expect(data.fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(data.counts.tasks).toBe(0)
    expect(coreImportReceipt.create).not.toHaveBeenCalled()
    expect(goal.create).not.toHaveBeenCalled()
  })

  it('import without confirm writes nothing', async () => {
    const { POST } = await import('@/app/api/data/import/route')
    const res = await POST(
      post('/api/data/import', { backup, clientRequestId: requestId, fingerprint: 'a'.repeat(64) })
    )
    expect(res.status).toBe(400)
    expect(tx).not.toHaveBeenCalled()
    expect(coreImportReceipt.create).not.toHaveBeenCalled()
  })

  it('a repeated client request id returns the earlier receipt instead of importing again', async () => {
    const { POST: preview } = await import('@/app/api/data/preview/route')
    const fingerprint = (await (await preview(post('/api/data/preview', backup))).json()).data
      .fingerprint as string
    const { POST } = await import('@/app/api/data/import/route')
    const first = await POST(
      post('/api/data/import', { backup, clientRequestId: requestId, fingerprint, confirm: true })
    )
    expect(first.status).toBe(200)
    expect((await first.json()).data.alreadyImported).toBe(false)
    expect(coreImportReceipt.create).toHaveBeenCalledTimes(1)
    const stored = coreImportReceipt.create.mock.calls[0][0].data
    coreImportReceipt.findUnique.mockResolvedValue({ ...stored, id: 'r1', createdAt: new Date() })
    const second = await POST(
      post('/api/data/import', { backup, clientRequestId: requestId, fingerprint, confirm: true })
    )
    expect(second.status).toBe(200)
    expect((await second.json()).data.alreadyImported).toBe(true)
    expect(coreImportReceipt.create).toHaveBeenCalledTimes(1)
  })

  it('personal setup validates the working window and is stored in preferences', async () => {
    user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'u1',
      timezone: 'Asia/Kolkata',
      preferences: data.preferences ?? {},
    }))
    const { PATCH } = await import('@/app/api/settings/personal/route')
    const bad = await PATCH(
      new NextRequest('http://localhost/api/settings/personal', {
        method: 'PATCH',
        body: JSON.stringify({
          availableMinutes: 240,
          bufferMinutes: 15,
          workStart: '18:00',
          workEnd: '09:00',
          defaultContext: 'work',
          sound: true,
        }),
      })
    )
    expect(bad.status).toBe(400)
    const ok = await PATCH(
      new NextRequest('http://localhost/api/settings/personal', {
        method: 'PATCH',
        body: JSON.stringify({
          availableMinutes: 240,
          bufferMinutes: 15,
          workStart: '09:00',
          workEnd: '18:00',
          defaultContext: 'work',
          sound: true,
        }),
      })
    )
    expect(ok.status).toBe(200)
    const prefs = user.update.mock.calls.at(-1)![0].data.preferences
    expect(prefs.personal).toMatchObject({
      availableMinutes: 240,
      workStart: '09:00',
      defaultContext: 'work',
    })
    expect(prefs.personalSetupComplete).toBe(true)
    expect((await ok.json()).data.setupComplete).toBe(true)
  })
})
