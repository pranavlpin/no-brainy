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
