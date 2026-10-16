import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET, PUT } from '@/app/api/planner/today/route'
import { POST as carryForward } from '@/app/api/planner/carry-forward/route'

const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
const marker = randomUUID()
let outsider = ''
const req = (path: string, body?: unknown) =>
  new NextRequest(
    `http://localhost:3100/api/planner/${path}`,
    body === undefined ? undefined : { method: 'PUT', body: JSON.stringify(body) }
  )
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated runner')
  session.id = (
    await prisma.user.create({
      data: { email: `planner-${marker}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  outsider = (await prisma.user.create({ data: { email: `planner-other-${marker}@example.test` } }))
    .id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [session.id, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})

it('accepts undated active tasks and rejects foreign, completed, cancelled or excessive focus selections', async () => {
  const task = await prisma.task.create({
    data: { userId: session.id, title: 'An undated priority' },
  })
  expect((await PUT(req('today', { focusTaskIds: [task.id] }))).status).toBe(200)
  for (const [userId, status] of [
    [session.id, 'completed'],
    [session.id, 'cancelled'],
    [outsider, 'pending'],
  ]) {
    const invalid = await prisma.task.create({ data: { userId, status, title: 'Not selectable' } })
    expect((await PUT(req('today', { focusTaskIds: [invalid.id] }))).status).toBe(400)
  }
  const many = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      prisma.task.create({ data: { userId: session.id, title: `Too many ${index}` } })
    )
  )
  expect((await PUT(req('today', { focusTaskIds: many.map((item) => item.id) }))).status).toBe(400)
})

it('persists outcome, capacity, growth and time blocks without changing deadlines and rejects stale edits', async () => {
  const task = await prisma.task.create({
    data: {
      userId: session.id,
      title: 'Small growth action',
      dueDate: new Date('2026-12-20T00:00:00Z'),
    },
  })
  const before = (await (await GET(req('today'))).json()).data
  const update = {
    expectedUpdatedAt: before.updatedAt,
    mainOutcome: 'A useful small step',
    availableMinutes: 90,
    bufferMinutes: 15,
    workStart: '09:00',
    workEnd: '12:00',
    growthTaskId: task.id,
    timeBlocks: [
      {
        id: 'practice',
        taskId: task.id,
        title: 'Practice',
        startTime: '09:00',
        endTime: '09:30',
        isCompleted: false,
      },
    ],
  }
  expect((await PUT(req('today', update))).status).toBe(200)
  const plan = (await (await GET(req('today'))).json()).data
  expect(plan).toMatchObject({
    mainOutcome: update.mainOutcome,
    availableMinutes: 90,
    bufferMinutes: 15,
    growthTaskId: task.id,
    timeBlocks: update.timeBlocks,
  })
  expect(
    (await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).dueDate?.toISOString()
  ).toBe('2026-12-20T00:00:00.000Z')
  expect(
    (await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).plannedDate
      ?.toISOString()
      .slice(0, 10)
  ).toBe(plan.planDate)
  expect(
    (
      await PUT(
        req('today', { expectedUpdatedAt: before.updatedAt, mainOutcome: 'A stale overwrite' })
      )
    ).status
  ).toBe(409)
  const foreign = await prisma.task.create({ data: { userId: outsider, title: 'Private block' } })
  expect(
    (await PUT(req('today', { timeBlocks: [{ ...update.timeBlocks[0], taskId: foreign.id }] })))
      .status
  ).toBe(400)
})

it('finds all earlier unfinished planned work, not just yesterday, without reintroducing dropped work', async () => {
  const older = await prisma.task.create({
    data: {
      userId: session.id,
      title: 'Earlier planned action',
      plannedDate: new Date('2026-01-02T00:00:00Z'),
    },
  })
  const dropped = await prisma.task.create({
    data: {
      userId: session.id,
      title: 'Dropped action',
      plannedDate: new Date('2026-01-02T00:00:00Z'),
      status: 'cancelled',
    },
  })
  const result = await carryForward(req('carry-forward'))
  expect(result.status).toBe(200)
  const items = (await result.json()).data.suggestions as { id: string }[]
  expect(items.map((item) => item.id)).toContain(older.id)
  expect(items.map((item) => item.id)).not.toContain(dropped.id)
})
