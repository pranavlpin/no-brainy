import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST, PATCH, GET } from '@/app/api/focus/route'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
let owner = ''
let outsider = ''
let taskId = ''
const req = (method: string, body?: unknown) =>
  new NextRequest('http://localhost:3100/api/focus', {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated runner')
  owner = (await prisma.user.create({ data: { email: `focus-${randomUUID()}@example.test` } })).id
  outsider = (
    await prisma.user.create({ data: { email: `focus-other-${randomUUID()}@example.test` } })
  ).id
  session.id = owner
  taskId = (await prisma.task.create({ data: { userId: owner, title: 'A durable practice' } })).id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [owner, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})
it('serializes concurrent starts, recovers pause/resume and records a partial result once', async () => {
  const input = {
    clientRequestId: randomUUID(),
    taskId,
    plannedSeconds: 1500,
    intention: 'One useful step',
  }
  const starts = await Promise.all([POST(req('POST', input)), POST(req('POST', input))])
  expect(starts.map((r) => r.status)).toEqual([201, 201])
  const first = (await starts[0].json()).data
  expect((await starts[1].json()).data.id).toBe(first.id)
  expect((await POST(req('POST', { ...input, clientRequestId: randomUUID() }))).status).toBe(409)
  const paused = await PATCH(
    req('PATCH', { id: first.id, expectedUpdatedAt: first.updatedAt, action: 'pause' })
  )
  expect(paused.status).toBe(200)
  const pause = (await paused.json()).data
  expect(pause.state).toBe('paused')
  const recovered = (await (await GET(req('GET'))).json()).data
  expect(recovered.active.id).toBe(first.id)
  expect(recovered.active.accumulatedSeconds).toBe(pause.accumulatedSeconds)
  expect(
    (
      await PATCH(
        req('PATCH', { id: first.id, expectedUpdatedAt: first.updatedAt, action: 'resume' })
      )
    ).status
  ).toBe(409)
  const resumed = (
    await (
      await PATCH(
        req('PATCH', { id: first.id, expectedUpdatedAt: pause.updatedAt, action: 'resume' })
      )
    ).json()
  ).data
  const finish = {
    id: first.id,
    expectedUpdatedAt: resumed.updatedAt,
    action: 'finish',
    outcome: 'progress',
    reflection: 'Learned a useful thing',
    nextAction: 'Try the next example',
  }
  const finished = await Promise.all([PATCH(req('PATCH', finish)), PATCH(req('PATCH', finish))])
  expect(finished.map((r) => r.status)).toEqual([200, 200])
  expect((await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).status).toBe('pending')
  expect(await prisma.task.count({ where: { userId: owner, title: finish.nextAction } })).toBe(1)
  const result = (await (await GET(req('GET'))).json()).data
  expect(result.active).toBeNull()
  expect(result.recent.filter((s: { id: string }) => s.id === first.id)).toHaveLength(1)
  expect((await PATCH(req('PATCH', { ...finish, outcome: 'completed' }))).status).toBe(409)
})
it('enforces ownership, completes deliberately and keeps a title after task removal', async () => {
  session.id = outsider
  expect(
    (await POST(req('POST', { clientRequestId: randomUUID(), taskId, plannedSeconds: 1500 })))
      .status
  ).toBe(400)
  session.id = owner
  const started = await POST(
    req('POST', { clientRequestId: randomUUID(), taskId, plannedSeconds: 1500 })
  )
  expect(started.status).toBe(201)
  const current = (await started.json()).data
  session.id = outsider
  expect(
    (
      await PATCH(
        req('PATCH', { id: current.id, expectedUpdatedAt: current.updatedAt, action: 'pause' })
      )
    ).status
  ).toBe(404)
  session.id = owner
  expect(
    (
      await PATCH(
        req('PATCH', {
          id: current.id,
          expectedUpdatedAt: current.updatedAt,
          action: 'finish',
          outcome: 'completed',
        })
      )
    ).status
  ).toBe(200)
  expect((await prisma.task.findUniqueOrThrow({ where: { id: taskId } })).status).toBe('completed')
  await prisma.task.delete({ where: { id: taskId } })
  const history = (await (await GET(req('GET'))).json()).data.recent
  expect(history.find((s: { id: string }) => s.id === current.id)).toMatchObject({
    taskId: null,
    taskTitle: 'A durable practice',
  })
})
