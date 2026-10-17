import { describe, expect, it } from 'vitest'
import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREF_KEYS,
  resolveNotificationPreferences,
} from '@/lib/notifications/preferences'

describe('notification preferences', () => {
  it('no longer knows about habits and includes the morning brief', () => {
    expect(NOTIFICATION_PREF_KEYS as readonly string[]).not.toContain('habitReminders')
    expect(NOTIFICATION_PREF_KEYS as readonly string[]).toContain('morningBrief')
    expect(NOTIFICATION_PREF_DEFAULTS.morningBrief).toBe(true)
  })

  it('drops unknown stored keys and keeps booleans', () => {
    const resolved = resolveNotificationPreferences({
      habitReminders: false,
      dueTasks: false,
      morningBrief: 'yes',
    })
    expect(resolved.dueTasks).toBe(false)
    expect(resolved.morningBrief).toBe(true)
    expect('habitReminders' in resolved).toBe(false)
  })
})
