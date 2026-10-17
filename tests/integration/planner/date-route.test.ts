// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const prismaMock = vi.hoisted(() => ({
  dayPlan: { findUnique: vi.fn().mockResolvedValue(null) },
  task: { findMany: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown, ctx?: unknown) => Promise<Response>) =>
    (req: NextRequest, ctx?: unknown) =>
      handler(
        req,
        {
          id: 'u1',
          timezone: 'Asia/Kolkata',
          preferences: {
            personal: {
              availableMinutes: 240,
              bufferMinutes: 20,
              workStart: '09:00',
              workEnd: '18:00',
            },
          },
        },
        ctx
      ),
}))

import { GET } from '@/app/api/planner/[date]/route'

describe('GET /api/planner/[date] without a plan yet', () => {
  it('shows the personal capacity defaults, not the built-in 180/15', async () => {
    const res = await GET(new NextRequest('http://localhost/api/planner/2026-10-20'), {
      params: Promise.resolve({ date: '2026-10-20' }),
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.id).toBeNull()
    expect(json.data.availableMinutes).toBe(240)
    expect(json.data.bufferMinutes).toBe(20)
    expect(json.data.workStart).toBe('09:00')
    expect(json.data.workEnd).toBe('18:00')
  })
})
