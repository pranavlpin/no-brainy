import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { beforeAll, afterAll, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET, PUT } from '@/app/api/reviews/daily/[date]/route'
import { GET as getWeek, PUT as saveWeek } from '@/app/api/reviews/weekly/[date]/route'
import { GET as getWeeklySummary } from '@/app/api/reviews/weekly/route'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
let outsider = ''
let ownerId = ''
let legacy: { id: string; userId: string }
const req = (date: string, body?: unknown, weekly = false) =>
  new NextRequest(
    `http://localhost:3100/api/reviews/${weekly ? 'weekly' : 'daily'}/${date}`,
    body === undefined ? undefined : { method: 'PUT', body: JSON.stringify(body) }
  )
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  session.id = (
    await prisma.user.create({
      data: { email: `review-${randomUUID()}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  ownerId = session.id
  outsider = (
    await prisma.user.create({ data: { email: `review-other-${randomUUID()}@example.test` } })
  ).id
  const file = 'evidences/reviews/reflection-to-action/legacy-review.json'
  if (existsSync(file)) legacy = JSON.parse(readFileSync(file, 'utf8'))
  if (!legacy || !(await prisma.dailyReview.findUnique({ where: { id: legacy.id } }))) {
    const user = await prisma.user.create({
      data: { email: `review-legacy-${randomUUID()}@example.test` },
    })
    const old = await prisma.dailyReview.create({
      data: {
        userId: user.id,
        reviewDate: new Date('2026-10-12'),
        reflectionMd: 'Keep this original reflection through migration.',
        mood: 'okay',
      },
    })
    legacy = { id: old.id, userId: user.id }
    writeFileSync(file, JSON.stringify(legacy))
  }
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})
it('preserves the pre-migration reflection and adds structured draft fields', async () => {
  const owner = session.id
  session.id = legacy.userId
  try {
    const result = await GET(req('2026-10-12'))
    expect(result.status).toBe(200)
    const saved = (await result.json()).data
    expect(saved.reflectionMd).toBe('Keep this original reflection through migration.')
    expect(saved.whatMoved).toBe('')
    expect(saved.blockers).toBe('')
    expect(saved.updatedAt).toBeTruthy()
  } finally {
    session.id = owner
  }
})
it('saves an earlier daily reflection and tomorrow action atomically, without changing deadlines or accepting stale edits', async () => {
  const task = await prisma.task.create({
    data: { userId: session.id, title: 'A gentle next step', dueDate: new Date('2026-12-01') },
  })
  const current = await GET(req('2026-10-12'))
  expect(current.status).toBe(200)
  const before = (await current.json()).data
  const input = {
    expectedUpdatedAt: before.updatedAt,
    whatMoved: 'A useful conversation',
    blockers: 'Too many switches',
    tomorrowTaskId: task.id,
    reflectionMd: 'Longer writing is optional',
    mood: null,
    closeReview: true,
  }
  expect((await PUT(req('2026-10-12', input))).status).toBe(200)
  expect((await PUT(req('2026-10-12', input))).status).toBe(200)
  const saved = (await (await GET(req('2026-10-12'))).json()).data
  expect(saved).toMatchObject({
    whatMoved: input.whatMoved,
    blockers: input.blockers,
    tomorrowTaskId: task.id,
    mood: null,
  })
  expect(saved.closedAt).toBeTruthy()
  const planned = await prisma.task.findUniqueOrThrow({ where: { id: task.id } })
  expect(planned.plannedDate?.toISOString().slice(0, 10)).toBe('2026-10-13')
  expect(planned.dueDate?.toISOString().slice(0, 10)).toBe('2026-12-01')
  expect(await prisma.taskPlanEvent.count({ where: { taskId: task.id } })).toBe(1)
  expect(
    (
      await PUT(
        req('2026-10-12', { expectedUpdatedAt: before.updatedAt, whatMoved: 'Stale overwrite' })
      )
    ).status
  ).toBe(409)
  const foreign = await prisma.task.create({ data: { userId: outsider, title: 'Not yours' } })
  expect((await PUT(req('2026-10-12', { tomorrowTaskId: foreign.id }))).status).toBe(400)
  expect((await GET(req('2026-02-30'))).status).toBe(400)
})
it('counts completed and partial work only inside the reviewed local day and excludes dropped or paused unfinished tasks', async () => {
  for (const [title, time] of [
    ['Inside', '2026-10-11T19:00:00Z'],
    ['Outside', '2026-10-12T19:00:00Z'],
  ])
    await prisma.task.create({
      data: { userId: session.id, title, status: 'completed', completedAt: new Date(time) },
    })
  await prisma.task.create({
    data: {
      userId: session.id,
      title: 'Dropped',
      status: 'cancelled',
      dueDate: new Date('2026-10-12'),
    },
  })
  await prisma.task.create({
    data: {
      userId: session.id,
      title: 'Paused routine',
      routinePaused: true,
      plannedDate: new Date('2026-10-12'),
    },
  })
  const partial = await prisma.focusSession.create({
    data: {
      userId: session.id,
      clientRequestId: randomUUID(),
      taskTitle: 'A partial effort',
      state: 'finished',
      outcome: 'progress',
      completedAt: new Date('2026-10-11T19:00:00Z'),
      plannedSeconds: 1500,
      accumulatedSeconds: 600,
    },
  })
  const response = await GET(req('2026-10-12'))
  expect(response.status).toBe(200)
  const data = (await response.json()).data
  expect(data.tasksCompleted).toBe(1)
  expect(data.activity.focusSessions.map((s: { id: string }) => s.id)).toContain(partial.id)
  expect(data.activity.unfinishedTasks.map((t: { title: string }) => t.title)).not.toContain(
    'Dropped'
  )
  expect(data.activity.unfinishedTasks.map((t: { title: string }) => t.title)).not.toContain(
    'Paused routine'
  )
})
it('stores a bounded weekly adjustment and a deliberately chosen next-Monday action', async () => {
  const action = await prisma.task.create({
    data: { userId: session.id, title: 'Next week first step' },
  })
  const initial = await getWeek(req('2026-10-12', undefined, true))
  expect(initial.status).toBe(200)
  const week = (await initial.json()).data
  const input = {
    expectedUpdatedAt: week.updatedAt,
    stopDoing: 'Late task switching',
    keepDoing: 'One clear outcome',
    startTrying: 'A quiet writing block',
    outcomes: [{ id: 'first', text: 'A clearer example' }],
    nextTaskId: action.id,
    closeReview: true,
  }
  expect((await saveWeek(req('2026-10-12', input, true))).status).toBe(200)
  expect((await saveWeek(req('2026-10-12', input, true))).status).toBe(200)
  const saved = (await (await getWeek(req('2026-10-12', undefined, true))).json()).data
  expect(saved).toMatchObject({
    stopDoing: input.stopDoing,
    startTrying: input.startTrying,
    nextTaskId: action.id,
    outcomes: input.outcomes,
  })
  expect(saved.activity.tasksCompleted).toBeGreaterThanOrEqual(1)
  expect(
    (await prisma.task.findUniqueOrThrow({ where: { id: action.id } })).plannedDate
      ?.toISOString()
      .slice(0, 10)
  ).toBe('2026-10-19')
  expect(
    (
      await saveWeek(
        req(
          '2026-10-12',
          { outcomes: Array.from({ length: 4 }, (_, i) => ({ id: String(i), text: 'Too many' })) },
          true
        )
      )
    ).status
  ).toBe(400)
})

it('derives the legacy weekly summary from bounded events even when a stored review has old counters', async () => {
  const response = await getWeeklySummary(
    new NextRequest('http://localhost:3100/api/reviews/weekly?week=2026-W42')
  )
  expect(response.status).toBe(200)
  const summary = (await response.json()).data
  expect(summary.totalTasksCompleted).toBe(2)
  expect(
    summary.dailyBreakdown.find((day: { date: string }) => day.date === '2026-10-12').tasksCompleted
  ).toBe(1)
})
