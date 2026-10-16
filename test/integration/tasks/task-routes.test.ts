import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/tasks/route'
import { PUT } from '@/app/api/tasks/[id]/route'
import { PUT as updateNote } from '@/app/api/notes/[id]/route'
import { GET as todayPlan } from '@/app/api/planner/today/route'

const session = vi.hoisted(() => ({ userId: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.userId } }) }))
const marker = randomUUID()
let owner: string
let outsider: string
let foreignTask: string
let foreignGoal: string
const req = (path: string, body?: unknown) =>
  new NextRequest(
    `http://localhost:3100/api/${path}`,
    body === undefined ? undefined : { method: 'PUT', body: JSON.stringify(body) }
  )

beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated database runner')
  owner = (
    await prisma.user.create({
      data: { email: `tasks-${marker}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  outsider = (await prisma.user.create({ data: { email: `outside-${marker}@example.test` } })).id
  session.userId = owner
  foreignTask = (await prisma.task.create({ data: { userId: outsider, title: 'Private task' } })).id
  foreignGoal = (await prisma.goal.create({ data: { userId: outsider, title: 'Private goal' } })).id
  await prisma.task.createMany({
    data: Array.from({ length: 27 }, (_, index) => ({
      userId: owner,
      title: `Paging fixture ${index}`,
      status: index % 2 ? 'in_progress' : 'pending',
      priority: ['low', 'medium', 'high', 'urgent'][index % 4],
      dueDate: new Date('2026-10-17T00:00:00Z'),
    })),
  })
  await prisma.task.createMany({
    data: [
      { userId: owner, title: 'Outside date range', dueDate: new Date('2026-11-01T00:00:00Z') },
      {
        userId: owner,
        title: 'Completed item',
        status: 'completed',
        dueDate: new Date('2026-10-17T00:00:00Z'),
      },
    ],
  })
})

afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [owner, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})

describe('owned task API', () => {
  it('uses the saved timezone for Today around India midnight', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T18:31:00Z'))
    try {
      const response = await todayPlan(req('planner/today'))
      expect(response.status).toBe(200)
      expect((await response.json()).data.planDate.slice(0, 10)).toBe('2026-10-17')
      expect((await (await GET(req('tasks'))).json()).data.today).toBe('2026-10-17')
    } finally {
      vi.useRealTimers()
    }
  })
  it('uses a saved timezone different from the server timezone', async () => {
    await prisma.user.update({ where: { id: owner }, data: { timezone: 'America/New_York' } })
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-08T04:30:00Z'))
    try {
      expect(
        (await (await todayPlan(req('planner/today'))).json()).data.planDate.slice(0, 10)
      ).toBe('2026-03-07')
    } finally {
      vi.useRealTimers()
      await prisma.user.update({ where: { id: owner }, data: { timezone: 'Asia/Kolkata' } })
    }
  })

  it('finds all active work across pages with global priority ordering and both date bounds', async () => {
    const query =
      'tasks?status=pending,in_progress&parentTaskId=null&sortBy=priority&sortOrder=desc&dueDateFrom=2026-10-17&dueDateTo=2026-10-17'
    const first = await GET(req(query))
    expect(first.status).toBe(200)
    const page1 = (await first.json()).data
    const page2 = (await (await GET(req(`${query}&page=2`))).json()).data
    expect(page1).toMatchObject({ total: 27, page: 1, pageSize: 20, hasMore: true })
    expect(page2).toMatchObject({ total: 27, page: 2, hasMore: false })
    expect(page2.items).toHaveLength(7)
    const all = [...page1.items, ...page2.items] as Array<{
      id: string
      priority: string
      status: string
    }>
    expect(new Set(all.map((t) => t.id)).size).toBe(27)
    expect(all.some((t) => t.status === 'in_progress')).toBe(true)
    const ranks: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
    expect(all.map((t) => ranks[t.priority])).toEqual(
      all.map((t) => ranks[t.priority]).sort((a, b) => b - a)
    )
  })

  it('rejects a parent or linked goal owned by another account on create and update', async () => {
    for (const relation of [{ parentTaskId: foreignTask }, { goalId: foreignGoal }]) {
      expect(
        (await POST(req('tasks', { title: 'Invalid relationship', ...relation }))).status
      ).toBe(400)
      const own = await prisma.task.create({ data: { userId: owner, title: 'Own task' } })
      expect((await PUT(req(`tasks/${own.id}`, relation))).status).toBe(400)
    }
    expect((await PUT(req(`tasks/${foreignTask}`, { title: 'Changed' }))).status).toBe(404)
  })

  it('validates malformed edits and detects stale task and note saves atomically', async () => {
    const task = await prisma.task.create({ data: { userId: owner, title: 'Original' } })
    const version = task.updatedAt.toISOString()
    const accepted = await PUT(
      req(`tasks/${task.id}`, { title: 'Newest task', expectedUpdatedAt: version })
    )
    expect(accepted.status).toBe(200)
    expect(
      (await PUT(req(`tasks/${task.id}`, { title: 'Stale task', expectedUpdatedAt: version })))
        .status
    ).toBe(409)
    expect((await PUT(req(`tasks/${task.id}`, { dueDate: '2026-02-30' }))).status).toBe(400)
    const note = await prisma.note.create({ data: { userId: owner, title: 'Original note' } })
    const body = { expectedUpdatedAt: note.updatedAt.toISOString() }
    expect(
      (await updateNote(req(`notes/${note.id}`, { ...body, contentMd: 'Newest note' }))).status
    ).toBe(200)
    expect(
      (await updateNote(req(`notes/${note.id}`, { ...body, contentMd: 'Stale note' }))).status
    ).toBe(409)
    expect((await prisma.note.findUniqueOrThrow({ where: { id: note.id } })).contentMd).toBe(
      'Newest note'
    )
  })
})
