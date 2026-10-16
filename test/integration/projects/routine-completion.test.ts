import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/tasks/route'
import { PUT } from '@/app/api/tasks/[id]/route'
import { POST as bulk } from '@/app/api/tasks/bulk/route'
import { POST as routineAction } from '@/app/api/tasks/[id]/routine/route'

const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
const email = `routines-${randomUUID()}@example.test`
const req = (path: string, body: unknown) =>
  new NextRequest(`http://localhost:3100/api/${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated runner')
  session.id = (await prisma.user.create({ data: { email, timezone: 'Asia/Kolkata' } })).id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1') await prisma.user.deleteMany({ where: { email } })
  await prisma.$disconnect()
})

it('creates just one next occurrence after concurrent and repeated completion', async () => {
  const created = await POST(
    req('tasks', {
      title: 'Daily practice',
      isRecurring: true,
      rrule: 'FREQ=DAILY',
      dueDate: '2026-01-01',
      estimatedMinutes: 20,
    })
  )
  expect(created.status).toBe(201)
  const id = (await created.json()).data.id as string
  const responses = await Promise.all([
    PUT(req(`tasks/${id}`, { status: 'completed' })),
    PUT(req(`tasks/${id}`, { status: 'completed' })),
  ])
  expect(responses.map((response) => response.status)).toEqual([200, 200])
  expect((await PUT(req(`tasks/${id}`, { status: 'completed' }))).status).toBe(200)
  const tasks = await prisma.task.findMany({
    where: { userId: session.id, title: 'Daily practice' },
  })
  expect(tasks).toHaveLength(2)
  expect(tasks.find((task) => task.id === id)?.status).toBe('completed')
  expect(tasks.filter((task) => task.status === 'pending')).toHaveLength(1)
})

it('bulk completion advances routines too and unsupported rules stay unchanged', async () => {
  const ids: string[] = []
  for (const [title, rrule] of [
    ['Weekly practice', 'FREQ=WEEKLY'],
    ['Complex legacy', 'FREQ=WEEKLY;BYDAY=MO,FR'],
  ]) {
    const response = await POST(
      req('tasks', { title, isRecurring: true, rrule, dueDate: '2026-01-01' })
    )
    ids.push((await response.json()).data.id)
  }
  expect((await bulk(req('tasks/bulk', { taskIds: ids, action: 'complete' }))).status).toBe(200)
  expect(await prisma.task.count({ where: { userId: session.id, title: 'Weekly practice' } })).toBe(
    2
  )
  const complex = await prisma.task.findMany({
    where: { userId: session.id, title: 'Complex legacy' },
  })
  expect(complex).toHaveLength(1)
  expect(complex[0].rrule).toBe('FREQ=WEEKLY;BYDAY=MO,FR')
})

it('pauses, resumes and skips without losing completed or cancelled history', async () => {
  const created = await POST(
    req('tasks', {
      title: 'Gentle routine',
      isRecurring: true,
      rrule: 'FREQ=DAILY',
      dueDate: '2026-01-01',
    })
  )
  const id = (await created.json()).data.id as string
  expect((await routineAction(req(`tasks/${id}/routine`, { action: 'pause' }))).status).toBe(200)
  expect((await PUT(req(`tasks/${id}`, { status: 'completed' }))).status).toBe(200)
  expect(await prisma.task.count({ where: { userId: session.id, title: 'Gentle routine' } })).toBe(
    1
  )
  expect((await routineAction(req(`tasks/${id}/routine`, { action: 'resume' }))).status).toBe(200)
  const next = await prisma.task.findFirstOrThrow({
    where: { userId: session.id, title: 'Gentle routine', status: 'pending' },
  })
  expect((await routineAction(req(`tasks/${next.id}/routine`, { action: 'skip' }))).status).toBe(
    200
  )
  const history = await prisma.task.findMany({
    where: { userId: session.id, title: 'Gentle routine' },
  })
  expect(history.filter((task) => task.status === 'completed')).toHaveLength(1)
  expect(history.filter((task) => task.status === 'cancelled')).toHaveLength(1)
  expect(history.filter((task) => task.status === 'pending')).toHaveLength(1)
})
