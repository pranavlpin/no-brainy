// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { task, notification, flashcard, dailyReview, dayPlan } = vi.hoisted(() => ({
  task: { findMany: vi.fn() },
  notification: { findFirst: vi.fn(), create: vi.fn() },
  flashcard: { findMany: vi.fn() },
  dailyReview: { findFirst: vi.fn() },
  dayPlan: { findUnique: vi.fn() },
}))
vi.mock('@/lib/prisma', () => ({ prisma: { task, notification, flashcard, dailyReview, dayPlan } }))

import { generateForUser } from '@/lib/notifications/generate'
import { inQuietHours, resolveReminderSettings } from '@/lib/notifications/preferences'

describe('quiet hours', () => {
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

  it('handles windows that cross midnight', () => {
    expect(inQuietHours({ start: '22:00', end: '07:00' }, 23 * 60)).toBe(true)
    expect(inQuietHours({ start: '22:00', end: '07:00' }, 6 * 60 + 59)).toBe(true)
    expect(inQuietHours({ start: '22:00', end: '07:00' }, 7 * 60)).toBe(false)
    expect(inQuietHours({ start: '22:00', end: '07:00' }, 12 * 60)).toBe(false)
    expect(inQuietHours({ start: '13:00', end: '14:00' }, 13 * 60 + 30)).toBe(true)
    expect(inQuietHours(null, 23 * 60)).toBe(false)
  })

  it('reads the reminder time and quiet window with safe defaults', () => {
    expect(resolveReminderSettings(undefined)).toEqual({
      quietHours: null,
      reviewReminderTime: '20:00',
    })
    expect(
      resolveReminderSettings({
        quietHours: { start: '22:00', end: '07:00' },
        reviewReminderTime: '19:30',
      })
    ).toEqual({
      quietHours: { start: '22:00', end: '07:00' },
      reviewReminderTime: '19:30',
    })
    expect(
      resolveReminderSettings({
        quietHours: { start: 'late', end: '07:00' },
        reviewReminderTime: '25:00',
      })
    ).toEqual({
      quietHours: null,
      reviewReminderTime: '20:00',
    })
  })

  it('suppresses every nudge inside quiet hours in the user’s zone and honours the reminder time', async () => {
    const user = {
      id: 'u1',
      timezone: 'Asia/Kolkata',
      preferences: {
        notificationPreferences: {
          quietHours: { start: '21:00', end: '08:00' },
          reviewReminderTime: '19:00',
        },
      },
    }
    // 19:30 IST: after the 19:00 reminder time, outside quiet hours.
    const early = await generateForUser(user, new Date('2026-10-16T14:00:00Z'))
    expect(early.created).toContain('review_reminder')
    notification.create.mockClear()
    // 22:00 IST: inside quiet hours, nothing is created.
    const late = await generateForUser(user, new Date('2026-10-16T16:30:00Z'))
    expect(late.created).toEqual([])
    expect(notification.create).not.toHaveBeenCalled()
  })
})
