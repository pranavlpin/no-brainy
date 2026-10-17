// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { task } = vi.hoisted(() => ({ task: { findMany: vi.fn(), count: vi.fn() } }))
vi.mock('@/lib/prisma', () => ({ prisma: { task } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }),
}))

describe('GET /api/tasks', () => {
  beforeEach(() => {
    task.findMany.mockReset().mockResolvedValue([])
    task.count.mockReset().mockResolvedValue(0)
  })

  it('active includes pending and in-progress', async () => {
    const { GET } = await import('@/app/api/tasks/route')
    await GET(new NextRequest('http://localhost/api/tasks?status=active'))
    const where = task.findMany.mock.calls[0][0].where
    expect(where.status).toEqual({ in: ['pending', 'in_progress'] })
  })

  it('sorts priority by rank, not alphabetically', async () => {
    const { GET } = await import('@/app/api/tasks/route')
    await GET(new NextRequest('http://localhost/api/tasks?sortBy=priority&sortOrder=desc'))
    const orderBy = task.findMany.mock.calls[0][0].orderBy
    expect(JSON.stringify(orderBy)).toContain('priorityRank')
    expect(JSON.stringify(orderBy)).not.toContain('"priority":')
  })

  it('bounds planned-date queries on both ends and returns pagination metadata', async () => {
    task.count.mockResolvedValue(45)
    const { GET } = await import('@/app/api/tasks/route')
    const res = await GET(
      new NextRequest(
        'http://localhost/api/tasks?plannedDateFrom=2026-10-13&plannedDateTo=2026-10-19&page=2&pageSize=20'
      )
    )
    const where = task.findMany.mock.calls[0][0].where
    expect(where.plannedDate.gte.toISOString()).toBe('2026-10-13T00:00:00.000Z')
    expect(where.plannedDate.lt.toISOString()).toBe('2026-10-20T00:00:00.000Z')
    const json = await res.json()
    expect(json.data).toMatchObject({ total: 45, page: 2, pageSize: 20, hasMore: true })
  })
})
