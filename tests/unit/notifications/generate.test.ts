// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock is hoisted above imports, so the mock objects must be hoisted too.
const { task, notification, flashcard, dailyReview, dayPlan } = vi.hoisted(() => ({
  task: { findMany: vi.fn() },
  notification: { findFirst: vi.fn(), create: vi.fn() },
  flashcard: { findMany: vi.fn() },
  dailyReview: { findFirst: vi.fn() },
  dayPlan: { findUnique: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({ prisma: { task, notification, flashcard, dailyReview, dayPlan } }))

import { generateForUser } from '@/lib/notifications/generate'

const user = { id: 'u1', timezone: 'Asia/Kolkata', preferences: {} as Record<string, unknown> }

function at(iso: string) {
  return new Date(iso)
}

describe('generateForUser', () => {
  beforeEach(() => {
    task.findMany.mockReset().mockResolvedValue([])
    notification.findFirst.mockReset().mockResolvedValue(null)
    notification.create
      .mockReset()
      .mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'n',
        ...data,
      }))
    flashcard.findMany.mockReset().mockResolvedValue([])
    dailyReview.findFirst.mockReset().mockResolvedValue(null)
    dayPlan.findUnique.mockReset().mockResolvedValue(null)
  })
  afterEach(() => vi.restoreAllMocks())

  it('sends a review reminder only after 20:00 local when no review exists', async () => {
    // 14:30Z = 20:00 IST
    const evening = await generateForUser(user, at('2026-10-16T14:30:00Z'))
    expect(evening.created).toContain('review_reminder')
    expect(notification.create.mock.calls.some((c) => c[0].data.type === 'review_reminder')).toBe(
      true
    )

    notification.create.mockClear()
    const afternoon = await generateForUser(user, at('2026-10-16T09:00:00Z')) // 14:30 IST
    expect(afternoon.created).not.toContain('review_reminder')

    notification.create.mockClear()
    dailyReview.findFirst.mockResolvedValue({ id: 'r1' })
    const reviewed = await generateForUser(user, at('2026-10-16T14:30:00Z'))
    expect(reviewed.created).not.toContain('review_reminder')
  })

  it('sends a morning brief before 10:00 local when the plan has no focus', async () => {
    const morning = await generateForUser(user, at('2026-10-16T02:00:00Z')) // 07:30 IST
    expect(morning.created).toContain('morning_brief')

    notification.create.mockClear()
    dayPlan.findUnique.mockResolvedValue({ focusTaskIds: ['t1'] })
    const planned = await generateForUser(user, at('2026-10-16T02:00:00Z'))
    expect(planned.created).not.toContain('morning_brief')

    notification.create.mockClear()
    dayPlan.findUnique.mockResolvedValue(null)
    const late = await generateForUser(user, at('2026-10-16T06:00:00Z')) // 11:30 IST
    expect(late.created).not.toContain('morning_brief')
  })

  it('never duplicates a notification already created today', async () => {
    notification.findFirst.mockResolvedValue({ id: 'exists' })
    const res = await generateForUser(user, at('2026-10-16T14:30:00Z'))
    expect(res.created).toEqual([])
    expect(notification.create).not.toHaveBeenCalled()
  })

  it('respects disabled preferences', async () => {
    const quiet = {
      ...user,
      preferences: {
        notificationPreferences: { dailyReviewReminders: false, morningBrief: false },
      },
    }
    const res = await generateForUser(quiet, at('2026-10-16T14:30:00Z'))
    expect(res.created).not.toContain('review_reminder')
  })
})
