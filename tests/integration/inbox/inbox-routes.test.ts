// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { capture, task, note, bookmark, tx } = vi.hoisted(() => {
  const capture = {
    upsert: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  }
  const task = { create: vi.fn(), deleteMany: vi.fn() }
  const note = { create: vi.fn(), deleteMany: vi.fn() }
  const bookmark = { create: vi.fn(), deleteMany: vi.fn() }
  const tx = vi.fn()
  return { capture, task, note, bookmark, tx }
})
vi.mock('@/lib/prisma', () => ({
  prisma: {
    capture,
    task,
    note,
    bookmark,
    $transaction: (fn: (db: unknown) => Promise<unknown>) => {
      tx()
      return fn({ capture, task, note, bookmark })
    },
  },
}))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const row = {
  id: 'c1',
  userId: 'u1',
  clientRequestId: '6f1c3a0e-4b1a-4e0f-9b1d-2c3d4e5f6a7b',
  content: 'Read the capacity paper\nhttps://example.com/paper',
  sourceUrl: 'https://example.com/paper',
  state: 'inbox',
  destinationType: null,
  destinationId: null,
  processedAt: null,
  createdAt: new Date('2026-10-16T05:00:00Z'),
  updatedAt: new Date('2026-10-16T05:00:00Z'),
}

const json = (path: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost/api/inbox${path}`, {
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })

describe('inbox routes', () => {
  beforeEach(() => {
    for (const group of [capture, task, note, bookmark]) for (const m of Object.values(group)) m.mockReset()
    tx.mockReset()
    capture.upsert.mockResolvedValue(row)
    capture.updateMany.mockResolvedValue({ count: 1 })
    capture.findUniqueOrThrow.mockResolvedValue(row)
    capture.findFirst.mockResolvedValue(row)
    capture.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...row, ...data }))
    task.create.mockResolvedValue({ id: 'task1' })
    task.deleteMany.mockResolvedValue({ count: 1 })
  })

  it('POST creates once per client request id and returns the same capture on retry', async () => {
    const { POST } = await import('@/app/api/inbox/route')
    const body = { content: row.content, clientRequestId: row.clientRequestId }
    const first = await POST(json('', 'POST', body))
    const second = await POST(json('', 'POST', body))
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)
    const where = capture.upsert.mock.calls[0][0].where
    expect(where).toEqual({ userId_clientRequestId: { userId: 'u1', clientRequestId: row.clientRequestId } })
    expect(capture.upsert.mock.calls[0][0].create.sourceUrl).toBe('https://example.com/paper')
    expect((await first.json()).data.id).toBe('c1')
  })

  it('POST with the same request id but different text is a conflict', async () => {
    const { POST } = await import('@/app/api/inbox/route')
    const res = await POST(json('', 'POST', { content: 'something else', clientRequestId: row.clientRequestId }))
    expect(res.status).toBe(409)
  })

  it('process creates the task with planning fields and marks the capture processed in one transaction', async () => {
    const { POST } = await import('@/app/api/inbox/[id]/process/route')
    const res = await POST(
      json('/c1/process', 'POST', { kind: 'task', title: 'Read the capacity paper', priority: 'high', plannedDate: '2026-10-18' })
    )
    expect(res.status).toBe(200)
    expect(tx).toHaveBeenCalledTimes(1)
    const data = task.create.mock.calls[0][0].data
    expect(data).toMatchObject({ userId: 'u1', title: 'Read the capacity paper', priority: 'high', priorityRank: 1 })
    expect((data.plannedDate as Date).toISOString()).toBe('2026-10-18T00:00:00.000Z')
    expect(data.descriptionMd).toContain('https://example.com/paper')
    const update = capture.update.mock.calls.at(-1)![0].data
    expect(update).toMatchObject({ state: 'processed', destinationType: 'task', destinationId: 'task1' })
    expect((await res.json()).data.destinationId).toBe('task1')
  })

  it('process is idempotent: an already converted capture creates nothing new', async () => {
    capture.findUniqueOrThrow.mockResolvedValue({ ...row, destinationType: 'task', destinationId: 'task1', state: 'inbox' })
    const { POST } = await import('@/app/api/inbox/[id]/process/route')
    const res = await POST(json('/c1/process', 'POST', { kind: 'task' }))
    expect(res.status).toBe(200)
    expect(task.create).not.toHaveBeenCalled()
    expect(capture.update.mock.calls[0][0].data.state).toBe('processed')
  })

  it('process and PATCH refuse captures the user does not own', async () => {
    capture.updateMany.mockResolvedValue({ count: 0 })
    const { POST } = await import('@/app/api/inbox/[id]/process/route')
    expect((await POST(json('/c1/process', 'POST', { kind: 'note' }))).status).toBe(404)
    expect(note.create).not.toHaveBeenCalled()
    const { PATCH } = await import('@/app/api/inbox/[id]/route')
    const res = await PATCH(json('/c1', 'PATCH', { state: 'archived' }))
    expect(res.status).toBe(404)
    expect(capture.updateMany.mock.calls.at(-1)![0].where).toMatchObject({ id: 'c1', userId: 'u1' })
  })

  it('undo removes the destination that processing created and reopens the capture', async () => {
    capture.findFirst.mockResolvedValue({ ...row, state: 'processed', destinationType: 'task', destinationId: 'task1' })
    const { POST } = await import('@/app/api/inbox/[id]/undo/route')
    const res = await POST(json('/c1/undo', 'POST'))
    expect(res.status).toBe(200)
    expect(task.deleteMany.mock.calls[0][0].where).toMatchObject({ id: 'task1', userId: 'u1' })
    expect(capture.update.mock.calls[0][0].data).toMatchObject({ state: 'inbox', destinationType: null, destinationId: null, processedAt: null })
  })
})
