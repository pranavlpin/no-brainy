import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST, GET } from '@/app/api/inbox/route'
import { POST as processCapture } from '@/app/api/inbox/[id]/process/route'
import { PATCH } from '@/app/api/inbox/[id]/route'

const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
const marker = randomUUID()
let outsider = ''
const req = (path: string, body?: unknown) =>
  new NextRequest(
    `http://localhost:3100/api/inbox${path}`,
    body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) }
  )
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated runner')
  session.id = (await prisma.user.create({ data: { email: `capture-${marker}@example.test` } })).id
  outsider = (
    await prisma.user.create({ data: { email: `capture-outside-${marker}@example.test` } })
  ).id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [session.id, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})

it('saves raw input once for concurrent double submissions, with the original source', async () => {
  const input = {
    content: 'Read https://example.com/learning later',
    sourceUrl: 'https://example.com/learning',
    clientRequestId: randomUUID(),
  }
  const replies = await Promise.all([POST(req('', input)), POST(req('', input))])
  expect(replies.map((reply) => reply.status)).toEqual([201, 201])
  const records = await Promise.all(replies.map(async (reply) => (await reply.json()).data))
  expect(records[0]).toMatchObject({
    content: input.content,
    sourceUrl: input.sourceUrl,
    state: 'inbox',
  })
  expect(records[0].id).toBe(records[1].id)
  const listing = await GET(req('?state=inbox'))
  expect(
    (await listing.json()).data.items.filter((item: { id: string }) => item.id === records[0].id)
  ).toHaveLength(1)
})

it('converts atomically to an owned project task and makes retries and undo safe', async () => {
  const response = await POST(
    req('', { content: 'Outline the practice', clientRequestId: randomUUID() })
  )
  expect(response.status).toBe(201)
  const capture = (await response.json()).data
  const project = await prisma.project.create({
    data: { userId: session.id, title: 'Learn deliberately', context: 'personal' },
  })
  const input = { kind: 'task', projectId: project.id, title: 'Outline the practice' }
  const replies = await Promise.all([
    processCapture(req(`/${capture.id}/process`, input)),
    processCapture(req(`/${capture.id}/process`, input)),
  ])
  expect(replies.map((reply) => reply.status)).toEqual([200, 200])
  const saved = (await replies[0].json()).data
  expect(saved).toMatchObject({
    state: 'processed',
    destinationType: 'task',
    content: capture.content,
  })
  const tasks = await prisma.task.findMany({ where: { userId: session.id, title: input.title } })
  expect(tasks).toHaveLength(1)
  expect(tasks[0]).toMatchObject({ id: saved.destinationId, projectId: project.id })
  expect((await PATCH(req(`/${capture.id}`, { state: 'inbox' }))).status).toBe(200)
  expect((await processCapture(req(`/${capture.id}/process`, input))).status).toBe(200)
  expect(await prisma.task.count({ where: { userId: session.id, title: input.title } })).toBe(1)
})

it('rejects foreign project links without creating a destination or changing capture status', async () => {
  const response = await POST(
    req('', { content: 'Keep intact on failure', clientRequestId: randomUUID() })
  )
  expect(response.status).toBe(201)
  const capture = (await response.json()).data
  const project = await prisma.project.create({ data: { userId: outsider, title: 'Private' } })
  expect(
    (await processCapture(req(`/${capture.id}/process`, { kind: 'task', projectId: project.id })))
      .status
  ).toBe(400)
  expect(await prisma.task.count({ where: { userId: session.id, title: capture.content } })).toBe(0)
  const listing = (await (await GET(req('?state=inbox'))).json()).data.items
  expect(listing.find((item: { id: string }) => item.id === capture.id)).toMatchObject({
    state: 'inbox',
    destinationId: null,
  })
  const ownId = session.id
  session.id = outsider
  expect((await PATCH(req(`/${capture.id}`, { state: 'archived' }))).status).toBe(404)
  expect((await processCapture(req(`/${capture.id}/process`, { kind: 'note' }))).status).toBe(404)
  session.id = ownId
})

it('creates notes and bookmarks with original source retained, and someday creates no destination', async () => {
  for (const kind of ['note', 'bookmark', 'someday']) {
    const response = await POST(
      req('', {
        content: `Reference for ${kind}`,
        sourceUrl: 'https://example.com/reference',
        clientRequestId: randomUUID(),
      })
    )
    expect(response.status).toBe(201)
    const capture = (await response.json()).data
    const result = await processCapture(req(`/${capture.id}/process`, { kind }))
    expect(result.status).toBe(200)
    expect((await result.json()).data).toMatchObject({
      sourceUrl: capture.sourceUrl,
      content: capture.content,
      state: kind === 'someday' ? 'someday' : 'processed',
      destinationType: kind === 'someday' ? null : kind,
    })
  }
})

it('resolves an original-capture backlink independently of its state and rejects unsafe sources', async () => {
  const response = await POST(
    req('', { content: 'Find this exact original', clientRequestId: randomUUID() })
  )
  const capture = (await response.json()).data
  await PATCH(req(`/${capture.id}`, { state: 'archived' }))
  const found = await GET(req(`?state=all&id=${capture.id}`))
  expect((await found.json()).data.items).toEqual([
    expect.objectContaining({ id: capture.id, state: 'archived' }),
  ])
  expect(
    (
      await POST(
        req('', {
          content: 'Unsafe source',
          sourceUrl: 'javascript:alert(1)',
          clientRequestId: randomUUID(),
        })
      )
    ).status
  ).toBe(400)
})
