// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const userModel = { findMany: vi.fn() }
vi.mock('@/lib/prisma', () => ({ prisma: { user: userModel } }))
const generateForUser = vi.fn()
vi.mock('@/lib/notifications/generate', () => ({
  generateForUser: (...a: unknown[]) => generateForUser(...a),
}))

function post(auth?: string) {
  return new NextRequest('http://localhost/api/cron/daily', {
    method: 'POST',
    headers: auth ? { authorization: auth } : {},
  })
}

describe('POST /api/cron/daily', () => {
  const original = process.env.CRON_SECRET
  beforeEach(() => {
    userModel.findMany.mockReset()
    generateForUser.mockReset()
  })
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = original
  })

  it('returns 503 when no secret is configured', async () => {
    delete process.env.CRON_SECRET
    const { POST } = await import('@/app/api/cron/daily/route')
    const res = await POST(post('Bearer anything'))
    expect(res.status).toBe(503)
  })

  it('returns 401 without the right bearer token', async () => {
    process.env.CRON_SECRET = 's3cret'
    const { POST } = await import('@/app/api/cron/daily/route')
    expect((await POST(post())).status).toBe(401)
    expect((await POST(post('Bearer wrong'))).status).toBe(401)
    expect(userModel.findMany).not.toHaveBeenCalled()
  })

  it('runs generation for every user and reports counts', async () => {
    process.env.CRON_SECRET = 's3cret'
    userModel.findMany
      .mockResolvedValueOnce([
        { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} },
        { id: 'u2', timezone: 'UTC', preferences: {} },
      ])
      .mockResolvedValueOnce([])
    generateForUser
      .mockResolvedValueOnce({ created: ['review_reminder'] })
      .mockResolvedValueOnce({ created: [] })
    const { POST } = await import('@/app/api/cron/daily/route')
    const res = await POST(post('Bearer s3cret'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.users).toBe(2)
    expect(json.data.created).toBe(1)
    expect(json.data.perUser).toEqual([
      { userId: 'u1', created: ['review_reminder'] },
      { userId: 'u2', created: [] },
    ])
  })
})
