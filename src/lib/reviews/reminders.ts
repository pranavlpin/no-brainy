import { z } from 'zod'
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
export const reminderSchema = z.object({
  enabled: z.boolean(),
  dueTasks: z.boolean(),
  overdueTasks: z.boolean(),
  habitReminders: z.boolean(),
  flashcardReminders: z.boolean(),
  dailyReviewReminders: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietStart: time,
  quietEnd: time,
  reviewTime: time,
})
export type NotificationPreferences = z.infer<typeof reminderSchema>
export const REMINDER_DEFAULTS: NotificationPreferences = {
  enabled: false,
  dueTasks: true,
  overdueTasks: false,
  habitReminders: true,
  flashcardReminders: true,
  dailyReviewReminders: true,
  quietHoursEnabled: true,
  quietStart: '22:00',
  quietEnd: '08:00',
  reviewTime: '20:30',
}
/** New reminders require opt-in; preserve explicitly saved legacy choices. */
export function reminderPreferences(raw: unknown): NotificationPreferences {
  const saved = reminderSchema.partial().safeParse(raw)
  const values = saved.success ? saved.data : {}
  return {
    ...REMINDER_DEFAULTS,
    ...values,
    enabled: values.enabled ?? Object.values(values).some((value) => value === true),
  }
}
/** Clock labels in the account timezone; quiet windows may cross midnight. */
export function reminderClock(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
}
/** Equal endpoints mean an all-day quiet window. */
export function isQuiet(prefs: NotificationPreferences, clock: string) {
  return (
    prefs.quietHoursEnabled &&
    (prefs.quietStart === prefs.quietEnd ||
      (prefs.quietStart < prefs.quietEnd
        ? clock >= prefs.quietStart && clock < prefs.quietEnd
        : clock >= prefs.quietStart || clock < prefs.quietEnd))
  )
}
