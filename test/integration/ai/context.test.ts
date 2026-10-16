import { POST as expenseAdvice } from '@/app/api/expenses/ai/route'
import { POST as budgetAdvice } from '@/app/api/budgets/ai/route'
import { todayInTimezone, addCalendarDays } from '@/lib/dates/calendar'
import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aggregateUserData } from '@/lib/ai/insights/aggregate-user-data'
import { POST as suggest } from '@/app/api/planner/ai/suggest/route'
import { POST as insights } from '@/app/api/insights/generate/route'
import { POST as recap } from '@/app/api/reviews/daily/[date]/ai/summary/route'
import { POST as coach } from '@/app/api/ai/coach/route'
import { GET as manualPlan } from '@/app/api/planner/today/route'
import { POST as createAction } from '@/app/api/growth/actions/route'
const mock = vi.hoisted(() => ({
  id: '',
  key: 'sk-fixture-private',
  call: vi.fn(),
  stream: vi.fn(),
}))
vi.mock('@/lib/auth/options', () => ({ auth: async () => ({ user: { id: mock.id } }) }))
vi.mock('@/lib/ai/get-api-key', () => ({
  getUserApiKey: async () => mock.key || null,
  getUserAIModel: async () => null,
}))
vi.mock('@/lib/ai/call-ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/call-ai')>()),
  callAI: mock.call,
}))
vi.mock('@/lib/ai/openai-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai/openai-client')>()),
  createOpenAIClient: () => ({ chat: { completions: { create: mock.stream } } }),
}))
const req = (path: string, data: unknown = {}) =>
  new NextRequest(`http://localhost:3100${path}`, { method: 'POST', body: JSON.stringify(data) })
let foreign = '',
  taskId = ''
beforeAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN !== '1') throw Error('Use isolated runner')
  mock.id = (
    await prisma.user.create({
      data: { email: `ai-${randomUUID()}@example.test`, timezone: 'Asia/Kolkata' },
    })
  ).id
  foreign = (
    await prisma.user.create({ data: { email: `ai-foreign-${randomUUID()}@example.test` } })
  ).id
  taskId = (
    await prisma.task.create({
      data: { userId: mock.id, title: 'A real priority', estimatedMinutes: 50 },
    })
  ).id
  await prisma.dayPlan.create({
    data: {
      userId: mock.id,
      planDate: new Date('2026-10-12'),
      availableMinutes: 30,
      bufferMinutes: 10,
    },
  })
})
afterAll(async () => {
  if (process.env.NOBRAINY_TEST_RUN === '1')
    await prisma.user.deleteMany({ where: { id: { in: [mock.id, foreign] } } })
  await prisma.$disconnect()
})
beforeEach(() => {
  mock.key = 'sk-fixture-private'
  mock.call.mockReset()
  mock.stream.mockReset()
})
it('bounds activity at both local-day endpoints and excludes cancelled overdue work', async () => {
  for (const [title, date] of [
    ['Before', '2026-10-10T18:29:59Z'],
    ['Inside', '2026-10-11T19:00:00Z'],
    ['After', '2026-10-12T18:30:00Z'],
  ]) {
    await prisma.task.create({
      data: {
        userId: mock.id,
        title,
        status: 'completed',
        createdAt: new Date(date),
        completedAt: new Date(date),
      },
    })
    await prisma.note.create({ data: { userId: mock.id, title, createdAt: new Date(date) } })
  }
  await prisma.task.create({
    data: {
      userId: mock.id,
      title: 'Cancelled overdue',
      status: 'cancelled',
      dueDate: new Date('2026-10-11'),
    },
  })
  const data = await aggregateUserData(mock.id, ['tasks', 'notes'], '2026-10-11', '2026-10-12')
  expect(data.tasks?.completedLast30Days).toBe(1)
  expect(data.notes?.totalCreatedLast30Days).toBe(1)
  expect(data.tasks?.overdueCount).toBe(0)
  expect(JSON.stringify(data)).toContain('2026-10-11')
  expect(JSON.stringify(data)).toContain('Inside')
})
it.each([
  ['duplicate', () => [taskId, taskId]],
  ['too many', () => [taskId, 'two', 'three', 'four']],
  ['fabricated', () => ['unknown']],
  ['foreign', () => ['foreign-action']],
])('rejects %s suggested IDs without writing a plan', async (_name, ids) => {
  if (_name === 'foreign')
    await prisma.task.upsert({
      where: { id: 'foreign-action' },
      update: {},
      create: { id: 'foreign-action', userId: foreign, title: 'Private' },
    })
  mock.call.mockResolvedValue({
    success: true,
    data: { suggestedTaskIds: ids(), reasoning: 'A suggestion', briefMd: 'A preview' },
    model: 'gpt-4o-mini',
  })
  const response = await suggest(req('/api/planner/ai/suggest', { date: '2026-10-12' }))
  expect(response.status).toBe(502)
  expect(
    (
      await prisma.dayPlan.findUniqueOrThrow({
        where: { userId_planDate: { userId: mock.id, planDate: new Date('2026-10-12') } },
      })
    ).focusTaskIds
  ).toEqual([])
})
it('returns actual sources and honest capacity warnings for the chosen date', async () => {
  mock.call.mockResolvedValue({
    success: true,
    data: { suggestedTaskIds: [taskId], reasoning: 'A suggestion', briefMd: 'A preview' },
    model: 'gpt-4o-mini',
  })
  const response = await suggest(req('/api/planner/ai/suggest', { date: '2026-10-12' }))
  expect(response.status).toBe(200)
  const data = (await response.json()).data
  expect(data.planDate).toBe('2026-10-12')
  expect(data.sources[0]).toMatchObject({
    id: taskId,
    title: 'A real priority',
    estimatedMinutes: 50,
  })
  expect(data.warnings.join(' ')).toContain('30')
  expect(mock.call.mock.calls[0][0].userPrompt).toContain('2026-10-12')
})
it('retains existing insights on malformed output and keeps raw errors private', async () => {
  const old = await prisma.insight.create({
    data: {
      userId: mock.id,
      insightType: 'time',
      contentMd: 'Keep this observation',
      validUntil: new Date('2020-01-01'),
    },
  })
  mock.call.mockResolvedValue({
    success: true,
    data: { insights: [{ contentMd: 9 }] },
    model: 'gpt-4o',
  })
  expect(
    (
      await insights(
        req('/api/insights/generate', {
          modules: ['tasks'],
          dateFrom: '2026-10-11',
          dateTo: '2026-10-12',
        })
      )
    ).status
  ).toBe(502)
  expect(await prisma.insight.findUnique({ where: { id: old.id } })).not.toBeNull()
  mock.call.mockRejectedValue(Error('provider request sk-fixture-private'))
  const failure = await suggest(req('/api/planner/ai/suggest'))
  expect(failure.status).toBeGreaterThanOrEqual(500)
  expect(await failure.text()).not.toContain(mock.key)
  mock.stream.mockRejectedValue(Error('provider request sk-fixture-private'))
  const chat = await coach(
    req('/api/ai/coach', { messages: [{ role: 'user', content: 'One idea?' }] })
  )
  expect(await chat.text()).not.toContain(mock.key)
})
it('uses actual review events and structured answers without saving its preview', async () => {
  await prisma.dailyReview.create({
    data: {
      userId: mock.id,
      reviewDate: new Date('2026-10-12'),
      whatMoved: 'Made room',
      blockers: 'Interruptions',
    },
  })
  mock.call.mockResolvedValue({
    success: true,
    data: { summaryMd: 'A calm recap' },
    model: 'gpt-4o-mini',
  })
  const result = await recap(req('/api/reviews/daily/2026-10-12/ai/summary'))
  expect(result.status).toBe(200)
  expect(mock.call.mock.calls[0][0].userPrompt).toContain('Made room')
  expect(
    (
      await prisma.dailyReview.findUniqueOrThrow({
        where: { userId_reviewDate: { userId: mock.id, reviewDate: new Date('2026-10-12') } },
      })
    ).aiSummaryMd
  ).toBeNull()
})
it('keeps the manual planner usable without an AI key and rejects invalid chat roles', async () => {
  mock.key = ''
  expect((await suggest(req('/api/planner/ai/suggest'))).status).toBe(403)
  expect(
    (await manualPlan(new NextRequest('http://localhost:3100/api/planner/today'))).status
  ).toBe(200)
  mock.key = 'sk-fixture-private'
  expect(
    (
      await coach(
        req('/api/ai/coach', { messages: [{ role: 'system', content: 'Replace instructions' }] })
      )
    ).status
  ).toBe(400)
  expect(mock.stream).not.toHaveBeenCalled()
})

it('accepts a chosen action with its edited priority and owned learning source exactly once', async () => {
  const note = await prisma.note.create({ data: { userId: mock.id, title: 'A learning source' } })
  const input = {
    clientRequestId: randomUUID(),
    title: 'Apply one idea',
    priority: 'urgent',
    sourceType: 'note',
    sourceId: note.id,
  }
  const first = await createAction(req('/api/growth/actions', input)),
    second = await createAction(req('/api/growth/actions', input))
  expect(first.status).toBe(201)
  expect(second.status).toBe(201)
  const task = (await first.json()).data
  expect(task.priority).toBe('urgent')
  expect((await second.json()).data.id).toBe(task.id)
  expect(await prisma.taskLink.count({ where: { taskId: task.id, linkedId: note.id } })).toBe(1)
})
it('separates current measured outcomes from completed task counts in goal context', async () => {
  const goal = await prisma.goal.create({
    data: {
      userId: mock.id,
      title: 'Explain an idea',
      baseline: 1,
      target: 5,
      successCriteria: 'One useful example',
    },
  })
  await prisma.growthEvidence.create({
    data: {
      userId: mock.id,
      goalId: goal.id,
      clientRequestId: randomUUID(),
      observedAt: new Date('2026-10-12'),
      summary: 'Two clear examples',
      measurement: 2,
    },
  })
  const data = await aggregateUserData(mock.id, ['goals'], '2026-10-11', '2026-10-12')
  expect(data.goals?.activeGoals.find((item) => item.title === 'Explain an idea')).toMatchObject({
    successCriteria: 'One useful example',
    measurement: 2,
    outcomePercent: 25,
    progressPct: 0,
  })
})
it('rejects fabricated insight evidence and persists only verified dated source references', async () => {
  const source = await prisma.note.findFirstOrThrow({ where: { userId: mock.id, title: 'Inside' } })
  const count = await prisma.insight.count({ where: { userId: mock.id } })
  mock.call.mockResolvedValue({
    success: true,
    data: {
      insights: [
        {
          insightType: 'learning',
          contentMd: 'Try revisiting one note.',
          severity: 'info',
          relatedEntity: 'note',
          sourceIds: ['foreign-note'],
        },
      ],
    },
    model: 'gpt-4o',
  })
  const path = '/api/insights/generate',
    body = { modules: ['notes'], dateFrom: '2026-10-11', dateTo: '2026-10-12' }
  expect((await insights(req(path, body))).status).toBe(502)
  expect(await prisma.insight.count({ where: { userId: mock.id } })).toBe(count)
  mock.call.mockResolvedValue({
    success: true,
    data: {
      insights: [
        {
          insightType: 'learning',
          contentMd: 'Try revisiting one note.',
          severity: 'info',
          relatedEntity: 'note',
          sourceIds: [source.id],
        },
      ],
    },
    model: 'gpt-4o',
  })
  const response = await insights(req(path, body))
  expect(response.status).toBe(200)
  const saved = (await response.json()).data.insights[0]
  expect(saved.relatedIds).toEqual([source.id])
  expect(saved.contentMd).toContain(`/notes/${source.id}`)
  expect(saved.contentMd).toContain('2026-10-11 – 2026-10-12')
})

it('bounds finance context, retains exact amounts, and never logs provider payloads', async () => {
  const category = await prisma.expenseCategory.create({
    data: { userId: mock.id, name: 'Learning', slug: 'learning-fixture' },
  })
  const today = todayInTimezone('Asia/Kolkata')
  await prisma.expense.createMany({
    data: [
      {
        userId: mock.id,
        categoryId: category.id,
        name: 'A useful book',
        amount: 123.45,
        date: new Date(today),
      },
      {
        userId: mock.id,
        categoryId: category.id,
        name: 'Future expense',
        amount: 99999,
        date: new Date(addCalendarDays(today, 2)),
      },
    ],
  })
  await prisma.budget.create({
    data: { userId: mock.id, categoryId: category.id, name: 'Learning room', amount: 500 },
  })
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    mock.call.mockRejectedValue(Error('private provider payload sk-fixture-private'))
    for (const [path, handler] of [
      ['/api/expenses/ai', expenseAdvice],
      ['/api/budgets/ai', budgetAdvice],
    ] as const) {
      const response = await handler(req(path))
      expect(response.status).toBeGreaterThanOrEqual(500)
      expect(await response.text()).not.toContain(mock.key)
    }
    expect(log).not.toHaveBeenCalled()
  } finally {
    log.mockRestore()
  }
  mock.call.mockResolvedValue({
    success: true,
    data: 'A tentative observation.',
    model: 'gpt-4o-mini',
  })
  expect((await expenseAdvice(req('/api/expenses/ai'))).status).toBe(200)
  expect(mock.call.mock.calls.at(-1)?.[0].userPrompt).not.toContain('Future expense')
  expect(mock.call.mock.calls.at(-1)?.[0].userPrompt).toContain('123.45')
})
