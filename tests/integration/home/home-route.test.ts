// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const dayPlan = { findUnique: vi.fn(), create: vi.fn() }
const task = { findMany: vi.fn(), count: vi.fn() }
const dailyReview = { findUnique: vi.fn(), findMany: vi.fn() }
const goal = { findMany: vi.fn() }
const flashcard = { groupBy: vi.fn() }
const deck = { findMany: vi.fn() }
const book = { findMany: vi.fn() }
const focusSession = { aggregate: vi.fn(), findMany: vi.fn(async () => []) }
const growthEvidence = { findMany: vi.fn(async () => []) }
const weeklyReview = { findUnique: vi.fn(async () => null) }
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dayPlan,
    task,
    dailyReview,
    goal,
    flashcard,
    deck,
    book,
    focusSession,
    growthEvidence,
    weeklyReview,
  },
}))
vi.mock('@/lib/auth/middleware', () => ({
  withAuth:
    (handler: (req: NextRequest, user: unknown) => Promise<Response>) => (req: NextRequest) =>
      handler(req, { id: 'u1', name: 'Pranav', timezone: 'Asia/Kolkata', preferences: {} }),
}))

const row = (over: Record<string, unknown>) => ({
  id: 't',
  userId: 'u1',
  parentTaskId: null,
  goalId: null,
  title: 'Task',
  descriptionMd: '',
  priority: 'medium',
  status: 'pending',
  tags: [],
  dueDate: null,
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-01T00:00:00Z'),
  ...over,
})

describe('GET /api/home', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T14:30:00Z')) // 20:00 IST
    dayPlan.findUnique.mockReset().mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      planDate: new Date('2026-10-16T00:00:00.000Z'),
      focusTaskIds: ['f1'],
      timeBlocks: [],
      aiBriefMd: null,
      intentMd: 'Ship Home',
      createdAt: new Date(),
    })
    dayPlan.create.mockReset()
    task.findMany
      .mockReset()
      .mockImplementation(async (args: { where: Record<string, unknown> }) => {
        const where = args.where as { id?: { in: string[] }; goalId?: unknown; dueDate?: unknown }
        if (where.id?.in)
          return [row({ id: 'f1', title: 'Focus one', status: 'completed', goalId: 'g1' })]
        return []
      })
    task.count.mockReset().mockResolvedValue(2)
    dailyReview.findUnique.mockReset().mockResolvedValue(null)
    dailyReview.findMany.mockReset().mockResolvedValue([
      { reviewDate: new Date('2026-10-15T00:00:00Z'), mood: 'good', tomorrowIntent: 'Ship Home' },
      { reviewDate: new Date('2026-10-14T00:00:00Z'), mood: 'okay', tomorrowIntent: null },
    ])
    goal.findMany.mockReset().mockResolvedValue([
      {
        id: 'g1',
        title: 'Ship NoBrainy',
        category: 'work',
        status: 'active',
        updatedAt: new Date('2026-10-01T00:00:00Z'),
        tasks: [
          {
            status: 'completed',
            completedAt: new Date('2026-10-15T10:00:00Z'),
            updatedAt: new Date('2026-10-15T10:00:00Z'),
          },
          { status: 'pending', completedAt: null, updatedAt: new Date('2026-10-02T00:00:00Z') },
        ],
      },
      {
        id: 'g2',
        title: 'Run 10k',
        category: 'fitness',
        status: 'active',
        updatedAt: new Date('2026-09-20T00:00:00Z'),
        tasks: [
          { status: 'pending', completedAt: null, updatedAt: new Date('2026-09-25T00:00:00Z') },
        ],
      },
    ])
    flashcard.groupBy.mockReset().mockResolvedValue([{ deckId: 'd1', _count: { _all: 7 } }])
    deck.findMany.mockReset().mockResolvedValue([{ id: 'd1', name: 'System Design' }])
    focusSession.aggregate.mockReset().mockResolvedValue({ _sum: { durationSec: 3000 } })
    book.findMany
      .mockReset()
      .mockResolvedValue([
        { id: 'b1', title: 'Deep Work', author: 'Cal Newport', pagesRead: 120, pagesTotal: 300 },
      ])
  })
  afterEach(() => vi.useRealTimers())

  it('assembles plan, review, learn, goals, and streak for the local day', async () => {
    const { GET } = await import('@/app/api/home/route')
    const res = await GET(new NextRequest('http://localhost/api/home'))
    expect(res.status).toBe(200)
    const { data } = await res.json()

    expect(data.today).toBe('2026-10-16')
    expect(data.hour).toBe(20)
    expect(data.name).toBe('Pranav')
    expect(data.plan.intentMd).toBe('Ship Home')
    expect(data.plan.focusTasks[0].id).toBe('f1')
    expect(data.review.todayDone).toBe(false)
    expect(data.review.yesterday).toEqual({ mood: 'good', tomorrowIntent: 'Ship Home' })
    expect(data.streak).toBe(2)
    expect(data.learn.cardsDue).toBe(7)
    expect(data.learn.decksDue).toEqual([{ id: 'd1', name: 'System Design', dueCount: 7 }])
    expect(data.learn.reading[0].title).toBe('Deep Work')
    expect(data.goals.active).toHaveLength(2)
    const g1 = data.goals.active.find((g: { id: string }) => g.id === 'g1')
    expect(g1.completedTaskCount).toBe(1)
    expect(g1.taskCount).toBe(2)
    expect(g1.daysSinceActivity).toBe(1)
    const g2 = data.goals.active.find((g: { id: string }) => g.id === 'g2')
    expect(g2.daysSinceActivity).toBeGreaterThanOrEqual(7)
    expect(data.goals.staleCount).toBe(1)
    expect(data.overdueCount).toBe(2)
    expect(data.phase).toBe('evening')
    expect(data.focusMinutesToday).toBe(50)
  })
})
