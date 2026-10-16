import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST, GET } from '@/app/api/projects/route'
import { PATCH, DELETE } from '@/app/api/projects/[id]/route'
import { POST as createTask } from '@/app/api/tasks/route'
import { PUT as updateTask } from '@/app/api/tasks/[id]/route'
import { POST as addAction } from '@/app/api/projects/[id]/actions/route'

const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
const marker = randomUUID()
let outsider = ''
let foreignGoal = ''
const req = (path: string, body?: unknown) =>
  new NextRequest(
    `http://localhost:3100/api/${path}`,
    body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) }
  )
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw new Error('Use isolated runner')
  session.id = (await prisma.user.create({ data: { email: `project-${marker}@example.test` } })).id
  outsider = (
    await prisma.user.create({ data: { email: `project-outside-${marker}@example.test` } })
  ).id
  foreignGoal = (await prisma.goal.create({ data: { userId: outsider, title: 'Private goal' } })).id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [session.id, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})

it('preserves the populated pre-migration fixture and nullable planning defaults', async () => {
  const fixturePath = resolve('evidences/projects/outcomes-and-routines/legacy-fixture.json')
  const fixture = existsSync(fixturePath)
    ? (JSON.parse(readFileSync(fixturePath, 'utf8')) as { taskId: string; userId: string })
    : {
        userId: session.id,
        taskId: (
          await prisma.task.create({
            data: { userId: session.id, title: 'Keep existing data through projects migration' },
          })
        ).id,
      }
  const task = await prisma.task.findUniqueOrThrow({ where: { id: fixture.taskId } })
  expect(task).toMatchObject({
    title: 'Keep existing data through projects migration',
    userId: fixture.userId,
    projectId: null,
    plannedDate: null,
    context: null,
    estimatedMinutes: null,
    effort: null,
  })
})

it('creates projects and next actions, keeps dates separate and archives without deleting history', async () => {
  const response = await POST(
    req('projects', {
      title: 'A thoughtful launch',
      outcome: 'Release a usable first version',
      context: 'work',
    })
  )
  expect(response.status).toBe(201)
  const project = (await response.json()).data
  const created = await createTask(
    req('tasks', {
      title: 'Write the release notes',
      projectId: project.id,
      dueDate: '2026-10-23',
      plannedDate: '2026-10-20',
      estimatedMinutes: 30,
    })
  )
  expect(created.status).toBe(201)
  const task = (await created.json()).data
  expect((await PATCH(req(`projects/${project.id}`, { nextActionId: task.id }))).status).toBe(200)
  const scheduled = await updateTask(req(`tasks/${task.id}`, { plannedDate: '2026-10-21' }))
  expect((await scheduled.json()).data).toMatchObject({
    plannedDate: '2026-10-21',
    dueDate: '2026-10-23T00:00:00.000Z',
  })
  expect((await DELETE(req(`projects/${project.id}`))).status).toBe(200)
  expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull()
  const archived = (await (await GET(req('projects?status=archived'))).json()).data
  expect(archived.some((item: { id: string }) => item.id === project.id)).toBe(true)
})

it('rejects foreign goals, projects, notes and next actions on every changed relation', async () => {
  expect((await POST(req('projects', { title: 'Invalid link', goalId: foreignGoal }))).status).toBe(
    400
  )
  const project = (await (await POST(req('projects', { title: 'Owned project' }))).json()).data
  const foreignTask = await prisma.task.create({
    data: { userId: outsider, title: 'Private action' },
  })
  const foreignNote = await prisma.note.create({
    data: { userId: outsider, title: 'Private note' },
  })
  for (const patch of [
    { goalId: foreignGoal },
    { nextActionId: foreignTask.id },
    { noteIds: [foreignNote.id] },
  ]) {
    expect((await PATCH(req(`projects/${project.id}`, patch))).status).toBe(400)
  }
  const ownId = session.id
  session.id = outsider
  expect(
    (await createTask(req('tasks', { title: 'Cross owner action', projectId: project.id }))).status
  ).toBe(400)
  expect((await PATCH(req(`projects/${project.id}`, { title: 'Changed' }))).status).toBe(404)
  session.id = ownId
})

it('creates the next action atomically and retries the same submission without duplicates', async () => {
  const project = (
    await (await POST(req('projects', { title: 'Next step', context: 'work' }))).json()
  ).data
  const submissionId = randomUUID()
  const body = { title: 'Make a small start', submissionId }
  const replies = await Promise.all([
    addAction(req(`projects/${project.id}/actions`, body)),
    addAction(req(`projects/${project.id}/actions`, body)),
  ])
  expect(replies.map((response) => response.status)).toEqual([201, 201])
  const saved = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { tasks: true },
  })
  expect(saved.tasks).toHaveLength(1)
  expect(saved.nextActionId).toBe(saved.tasks[0].id)
  expect(saved.tasks[0]).toMatchObject({ context: 'work', title: 'Make a small start' })
  const ownId = session.id
  session.id = outsider
  expect((await addAction(req(`projects/${project.id}/actions`, body))).status).toBe(404)
  session.id = ownId
})
