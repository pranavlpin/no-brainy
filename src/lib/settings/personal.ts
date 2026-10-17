import { z } from 'zod'

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time like 09:30')

/** Defaults a new day starts from; stored under `users.preferences.personal`. */
export const personalSettingsSchema = z
  .object({
    defaultContext: z.enum(['work', 'personal']).default('personal'),
    availableMinutes: z.number().int().min(0).max(1440).default(180),
    bufferMinutes: z.number().int().min(0).max(1440).default(15),
    workStart: time.nullable().default(null),
    workEnd: time.nullable().default(null),
    /** Chime when a focus block ends. */
    sound: z.boolean().default(true),
  })
  .strict()
  .refine(
    (s) => (!s.workStart && !s.workEnd) || (!!s.workStart && !!s.workEnd && s.workStart < s.workEnd),
    { message: 'End the working window after it starts, or clear both times.', path: ['workEnd'] }
  )

export type PersonalSettingsInput = z.infer<typeof personalSettingsSchema>
export interface PersonalSettings extends PersonalSettingsInput {
  timezone: string
  setupComplete: boolean
}

export const PERSONAL_DEFAULTS: PersonalSettingsInput = personalSettingsSchema.parse({})

/** Read the public setup choices out of arbitrary preferences, with safe defaults. */
export function personalSettings(timezone: string, preferences: unknown): PersonalSettings {
  const prefs = preferences && typeof preferences === 'object' ? (preferences as Record<string, unknown>) : {}
  const stored = prefs.personal && typeof prefs.personal === 'object' ? prefs.personal : {}
  const parsed = personalSettingsSchema.safeParse(stored)
  return {
    ...(parsed.success ? parsed.data : PERSONAL_DEFAULTS),
    timezone,
    setupComplete: prefs.personalSetupComplete === true,
  }
}
