/** Notification types the user can switch off. */
export interface NotificationPreferences {
  dueTasks: boolean
  overdueTasks: boolean
  flashcardReminders: boolean
  dailyReviewReminders: boolean
  morningBrief: boolean
}

export const NOTIFICATION_PREF_KEYS = [
  'dueTasks',
  'overdueTasks',
  'flashcardReminders',
  'dailyReviewReminders',
  'morningBrief',
] as const satisfies readonly (keyof NotificationPreferences)[]

export const NOTIFICATION_PREF_DEFAULTS: NotificationPreferences = {
  dueTasks: true,
  overdueTasks: true,
  flashcardReminders: true,
  dailyReviewReminders: true,
  morningBrief: true,
}

/** Merge stored preferences over defaults, dropping unknown keys (such as the retired habitReminders). */
export function resolveNotificationPreferences(
  stored: Record<string, unknown> | null | undefined
): NotificationPreferences {
  const out: NotificationPreferences = { ...NOTIFICATION_PREF_DEFAULTS }
  for (const key of NOTIFICATION_PREF_KEYS) {
    const v = stored?.[key]
    if (typeof v === 'boolean') out[key] = v
  }
  return out
}

export interface QuietHours {
  /** Local `HH:mm`; the window may cross midnight. */
  start: string
  end: string
}

export interface ReminderSettings {
  quietHours: QuietHours | null
  /** Local `HH:mm` after which the close-the-day reminder may fire. */
  reviewReminderTime: string
}

export type NotificationSettings = NotificationPreferences & ReminderSettings

export const DEFAULT_REVIEW_REMINDER_TIME = '20:00'

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function timeToMinutes(value: string): number {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
}

/** Read the quiet window and reminder time, falling back to safe defaults. */
export function resolveReminderSettings(
  stored: Record<string, unknown> | null | undefined
): ReminderSettings {
  let quietHours: QuietHours | null = null
  const q = stored?.quietHours
  if (q && typeof q === 'object') {
    const { start, end } = q as { start?: unknown; end?: unknown }
    if (
      typeof start === 'string' &&
      typeof end === 'string' &&
      TIME.test(start) &&
      TIME.test(end) &&
      start !== end
    ) {
      quietHours = { start, end }
    }
  }
  const t = stored?.reviewReminderTime
  const reviewReminderTime =
    typeof t === 'string' && TIME.test(t) ? t : DEFAULT_REVIEW_REMINDER_TIME
  return { quietHours, reviewReminderTime }
}

/** Booleans plus reminder timing, in one object for the settings page. */
export function resolveNotificationSettings(
  stored: Record<string, unknown> | null | undefined
): NotificationSettings {
  return { ...resolveNotificationPreferences(stored), ...resolveReminderSettings(stored) }
}

/** True when `minutesOfDay` (local) falls inside the quiet window, crossing midnight if needed. */
export function inQuietHours(quiet: QuietHours | null, minutesOfDay: number): boolean {
  if (!quiet) return false
  const start = timeToMinutes(quiet.start)
  const end = timeToMinutes(quiet.end)
  return start < end
    ? minutesOfDay >= start && minutesOfDay < end
    : minutesOfDay >= start || minutesOfDay < end
}
