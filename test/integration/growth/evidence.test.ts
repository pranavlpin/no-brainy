import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { POST as createGoal } from '@/app/api/goals/route'
import { GET as readGoal, PATCH as editGoal } from '@/app/api/goals/[id]/route'
import { GET as growth } from '@/app/api/growth/route'
import { POST as evidence } from '@/app/api/growth/evidence/route'
import { PATCH as correctEvidence } from '@/app/api/growth/evidence/[id]/route'
import { POST as action } from '@/app/api/growth/actions/route'
const session = vi.hoisted(() => ({ id: '' }))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: session.id } }) }))
let outsider = ''
let goalId = ''
const req = (path: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost:3100/api/${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  session.id = (
    await prisma.user.create({
      data: { email: `growth-${randomUUID()}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  outsider = (
    await prisma.user.create({ data: { email: `growth-other-${randomUUID()}@example.test` } })
  ).id
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [session.id, outsider].filter(Boolean) } } })
  await prisma.$disconnect()
})
it('persists optional criteria and separates measured outcomes from linked task completion', async () => {
  const created = await createGoal(
    req('goals', 'POST', {
      title: 'Explain clearly',
      successCriteria: 'Explain a concept without notes',
      baseline: 1,
      target: 5,
      unit: 'clear explanations',
      weeklyPracticeTarget: 3,
    })
  )
  expect(created.status).toBe(201)
  const goal = (await created.json()).data
  goalId = goal.id
  expect(goal).toMatchObject({
    successCriteria: 'Explain a concept without notes',
    baseline: 1,
    target: 5,
    weeklyPracticeTarget: 3,
  })
  const task = await prisma.task.create({
    data: { userId: session.id, goalId, title: 'First practice', status: 'completed' },
  })
  const current = (await (await readGoal(req(`goals/${goalId}`))).json()).data
  expect(current.status).toBe('active')
  expect(current.completedTaskCount).toBe(1)
  expect(current.measurement).toBeNull()
  expect(
    (
      await editGoal(
        req(`goals/${goalId}`, 'PATCH', {
          expectedUpdatedAt: goal.updatedAt,
          title: 'A clearer explanation',
        })
      )
    ).status
  ).toBe(200)
  expect(
    (
      await editGoal(
        req(`goals/${goalId}`, 'PATCH', {
          expectedUpdatedAt: goal.updatedAt,
          title: 'A stale overwrite',
        })
      )
    ).status
  ).toBe(409)
  await prisma.task.delete({ where: { id: task.id } })
})
it('keeps owned evidence through task changes and supports corrections without rewriting a source session', async () => {
  const goal = await prisma.goal.create({
    data: { userId: session.id, title: 'A measured practice' },
  })
  const note = await prisma.note.create({
    data: { userId: session.id, title: 'An actual example' },
  })
  const input = {
    clientRequestId: randomUUID(),
    goalId: goal.id,
    observedAt: '2026-10-12',
    summary: 'Explained it without notes',
    measurement: 2,
    kind: 'practice',
    sourceType: 'note',
    sourceId: note.id,
  }
  const results = await Promise.all([
    evidence(req('growth/evidence', 'POST', input)),
    evidence(req('growth/evidence', 'POST', input)),
  ])
  expect(results.map((r) => r.status)).toEqual([201, 201])
  const item = (await results[0].json()).data
  expect((await results[1].json()).data.id).toBe(item.id)
  const corrected = await correctEvidence(
    req(`growth/evidence/${item.id}`, 'PATCH', {
      expectedUpdatedAt: item.updatedAt,
      summary: 'Explained it, with one prompt',
      measurement: 1.5,
    })
  )
  expect(corrected.status).toBe(200)
  expect(
    (
      await correctEvidence(
        req(`growth/evidence/${item.id}`, 'PATCH', {
          expectedUpdatedAt: item.updatedAt,
          summary: 'Stale',
        })
      )
    ).status
  ).toBe(409)
  const foreign = await prisma.note.create({ data: { userId: outsider, title: 'Not yours' } })
  expect(
    (
      await evidence(
        req('growth/evidence', 'POST', {
          ...input,
          clientRequestId: randomUUID(),
          sourceId: foreign.id,
        })
      )
    ).status
  ).toBe(400)
  await editGoal(req(`goals/${goal.id}`, 'PATCH', { status: 'paused' }))
  const paused = (await (await growth(req(`growth?goalId=${goal.id}&week=2026-10-12`))).json()).data
  expect(paused.goals[0]).toMatchObject({ practiceCount: 1, needsPractice: false })
  expect(paused.goals[0].evidenceCount).toBe(1)
  const later = (await (await growth(req(`growth?goalId=${goal.id}&week=2026-10-19`))).json()).data
  expect(later.goals[0].notes.map((item: { id: string }) => item.id)).toContain(note.id)
  expect((await prisma.note.findUniqueOrThrow({ where: { id: note.id } })).title).toBe(
    'An actual example'
  )
})
it('creates a sourced scheduled experiment idempotently without AI and preserves financial semantics', async () => {
  const goal = await prisma.goal.create({ data: { userId: session.id, title: 'Read and apply' } })
  const book = await prisma.book.create({
    data: {
      userId: session.id,
      title: 'A useful book',
      applicationMd: 'Write one clearer paragraph',
    },
  })
  const input = {
    clientRequestId: randomUUID(),
    goalId: goal.id,
    title: 'Test one idea',
    plannedDate: '2026-10-17',
    sourceType: 'book',
    sourceId: book.id,
  }
  const result = await action(req('growth/actions', 'POST', input))
  expect(result.status).toBe(201)
  const task = (await result.json()).data
  const retry = (await (await action(req('growth/actions', 'POST', input))).json()).data
  expect(retry.id).toBe(task.id)
  expect(task.goalId).toBe(goal.id)
  expect(task.plannedDate).toBe('2026-10-17')
  expect(task.dueDate).toBeNull()
  expect(
    await prisma.taskLink.count({
      where: { taskId: task.id, linkedType: 'book', linkedId: book.id },
    })
  ).toBe(1)
  expect(task.descriptionMd).toContain('Write one clearer paragraph')
  const expenseCategory = await prisma.expenseCategory.create({
    data: { userId: session.id, name: 'Learning', slug: 'learning' },
  })
  const financial = await createGoal(
    req('goals', 'POST', {
      title: 'Learning budget',
      category: 'financial',
      targetAmount: 1000,
      expenseCategoryId: expenseCategory.id,
    })
  )
  expect(financial.status).toBe(201)
  const f = (await financial.json()).data
  expect(f.targetAmount).toBe(1000)
  expect(f.financialProgress).toBe(0)
  expect(f.outcomePercent).toBeNull()
})

it('deduplicates stored routine/session practice at Kolkata week boundaries', async () => {
  const goal = await prisma.goal.create({
    data: { userId: session.id, title: 'A weekly practice', weeklyPracticeTarget: 2 },
  })
  const task = await prisma.task.create({
    data: {
      userId: session.id,
      goalId: goal.id,
      title: 'A real occurrence',
      status: 'completed',
      isRecurring: true,
      rrule: 'FREQ=DAILY',
      occurrenceDate: new Date('2026-10-12'),
      completedAt: new Date('2026-10-11T19:00:00Z'),
    },
  })
  await prisma.task.update({ where: { id: task.id }, data: { routineId: task.id } })
  const source = await prisma.focusSession.create({
    data: {
      userId: session.id,
      clientRequestId: randomUUID(),
      taskId: task.id,
      taskTitle: task.title,
      state: 'finished',
      plannedSeconds: 1500,
      accumulatedSeconds: 900,
      outcome: 'progress',
      completedAt: new Date('2026-10-11T19:00:00Z'),
    },
  })
  await prisma.focusSession.create({
    data: {
      userId: session.id,
      clientRequestId: randomUUID(),
      taskId: task.id,
      taskTitle: task.title,
      state: 'finished',
      plannedSeconds: 1500,
      accumulatedSeconds: 900,
      outcome: 'progress',
      completedAt: new Date('2026-10-18T19:00:00Z'),
    },
  })
  expect(
    (
      await evidence(
        req('growth/evidence', 'POST', {
          clientRequestId: randomUUID(),
          goalId: goal.id,
          observedAt: '2026-10-12',
          summary: 'The same session as evidence',
          kind: 'practice',
          sourceType: 'session',
          sourceId: source.id,
        })
      )
    ).status
  ).toBe(201)
  expect(
    (
      await evidence(
        req('growth/evidence', 'POST', {
          clientRequestId: randomUUID(),
          goalId: goal.id,
          observedAt: '2026-10-13',
          summary: 'A later reflection cannot shift the practice date',
          kind: 'practice',
          sourceType: 'session',
          sourceId: source.id,
        })
      )
    ).status
  ).toBe(400)
  const data = (await (await growth(req(`growth?goalId=${goal.id}&week=2026-10-12`))).json()).data
  expect(data.goals[0].practiceCount).toBe(1)
  expect(data.goals[0].needsPractice).toBe(true)
  await editGoal(req(`goals/${goal.id}`, 'PATCH', { status: 'paused' }))
  expect(
    (await (await growth(req(`growth?goalId=${goal.id}&week=2026-10-12`))).json()).data.goals[0]
      .needsPractice
  ).toBe(false)
})
