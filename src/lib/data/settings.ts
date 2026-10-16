import { z } from 'zod'
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
export const personalSettingsSchema = z
  .object({
    timezone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value })
          return true
        } catch {
          return false
        }
      }, 'Choose a valid IANA timezone.'),
    defaultContext: z.enum(['work', 'personal']).default('personal'),
    availableMinutes: z.number().int().min(0).max(1440).default(180),
    workStart: time.nullable().default('09:00'),
    workEnd: time.nullable().default('18:00'),
    reduceMotion: z.boolean().default(false),
    sound: z.boolean().default(false),
  })
  .strict()
  .refine(
    (s) =>
      (!s.workStart && !s.workEnd) || (!!s.workStart && !!s.workEnd && s.workStart < s.workEnd),
    'End the working window after it starts, or clear both times.'
  )
export type PersonalSettings = z.infer<typeof personalSettingsSchema> & { setupComplete: boolean }
/** Read only public setup choices from arbitrary account preferences, preserving safe defaults. */
export function personalSettings(timezone: string, preferences: unknown): PersonalSettings {
  const prefs =
    preferences && typeof preferences === 'object' ? (preferences as Record<string, unknown>) : {}
  const stored =
    prefs.personal && typeof prefs.personal === 'object'
      ? (prefs.personal as Record<string, unknown>)
      : {}
  const parsed = personalSettingsSchema.safeParse({ ...stored, timezone })
  return {
    ...(parsed.success ? parsed.data : personalSettingsSchema.parse({ timezone: 'UTC' })),
    setupComplete: prefs.personalSetupComplete === true,
  }
}
