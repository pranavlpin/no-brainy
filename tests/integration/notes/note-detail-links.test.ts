// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const prismaMock = vi.hoisted(() => ({
  note: {
    findFirst: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
  },
  noteLink: { findMany: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
const user = vi.hoisted(() => ({ id: 'u1', timezone: 'Asia/Kolkata', preferences: {} }))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown, ctx?: unknown) => Promise<Response>) =>
    (req: NextRequest, ctx?: unknown) =>
      handler(req, user, ctx),
  getAuthUser: vi.fn().mockResolvedValue(user),
}))

import { GET } from '@/app/api/notes/[id]/route'

describe('GET /api/notes/[id] backlinks', () => {
  it('returns notes that link here through an explicit note-link query', async () => {
    const now = new Date('2026-10-17T05:00:00.000Z')
    prismaMock.note.findFirst.mockResolvedValue({
      id: 'n1',
      userId: 'u1',
      title: 'Course notes',
      contentMd: 'Decisions.',
      tags: [],
      isPinned: false,
      isPublic: false,
      shareId: null,
      isDeleted: false,
      deletedAt: null,
      wordCount: 1,
      createdAt: now,
      updatedAt: now,
      noteLinks: [],
    })
    prismaMock.noteLink.findMany.mockResolvedValue([
      { id: 'l1', sourceId: 'n2', targetType: 'note', targetId: 'n1', createdAt: now },
    ])
    const res = await GET(new NextRequest('http://localhost/api/notes/n1'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.linkedFrom).toHaveLength(1)
    expect(json.data.linkedFrom[0].sourceId).toBe('n2')
    expect(prismaMock.noteLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ targetType: 'note', targetId: 'n1' }),
      })
    )
  })
})
