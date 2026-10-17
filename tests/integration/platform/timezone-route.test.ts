// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const update = vi.fn()
vi.mock('@/lib/prisma', () => ({ prisma: { user: { update: (...a: unknown[]) => update(...a) } } }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', timezone: 'UTC', preferences: {} }),
}))

describe('PATCH /api/settings/timezone', () => {
  beforeEach(() => update.mockReset())

  it('rejects an unknown zone with 400', async () => {
    const { PATCH } = await import('@/app/api/settings/timezone/route')
    const req = new NextRequest('http://localhost/api/settings/timezone', {
      method: 'PATCH',
      body: JSON.stringify({ timezone: 'Mars/Olympus' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    expect(update).not.toHaveBeenCalled()
  })

  it('stores a valid zone', async () => {
    update.mockResolvedValue({ timezone: 'Asia/Kolkata' })
    const { PATCH } = await import('@/app/api/settings/timezone/route')
    const req = new NextRequest('http://localhost/api/settings/timezone', {
      method: 'PATCH',
      body: JSON.stringify({ timezone: 'Asia/Kolkata' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { timezone: 'Asia/Kolkata' } })
    )
    const json = await res.json()
    expect(json.data.timezone).toBe('Asia/Kolkata')
  })
})
