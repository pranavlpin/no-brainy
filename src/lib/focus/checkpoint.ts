import { z } from 'zod'
import { startFocusSchema, focusCommandSchema } from '@/lib/validations/focus'
import type { FocusCommand, FocusSessionResponse, FocusStart } from '@/lib/types/focus'
export interface FocusSetup {
  taskId: string | null
  minutes: number
  intention: string
  sound: boolean
  breakReminder: boolean
  reflection: string
  nextAction: string
}
export interface FocusRecovery {
  version: 1
  confirmed: FocusSessionResponse | null
  pending: { method: 'POST'; body: FocusStart } | { method: 'PATCH'; body: FocusCommand } | null
  setup: FocusSetup
}
export const defaultSetup: FocusSetup = {
  taskId: null,
  minutes: 25,
  intention: '',
  sound: false,
  breakReminder: true,
  reflection: '',
  nextAction: '',
}
const setupSchema = z.object({
  taskId: z.string().nullable(),
  minutes: z.number().min(1).max(180),
  intention: z.string(),
  sound: z.boolean(),
  breakReminder: z.boolean(),
  reflection: z.string(),
  nextAction: z.string(),
})
const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string().nullable(),
  taskTitle: z.string(),
  intention: z.string(),
  state: z.enum(['running', 'paused', 'finished']),
  startedAt: z.string().datetime(),
  activeSince: z.string().datetime().nullable(),
  accumulatedSeconds: z.number().int().nonnegative(),
  plannedSeconds: z.number().int().positive(),
  completedAt: z.string().datetime().nullable(),
  outcome: z.enum(['completed', 'progress', 'blocked']).nullable(),
  reflection: z.string(),
  nextAction: z.string(),
  nextActionId: z.string().nullable(),
  updatedAt: z.string().datetime(),
})
const recoverySchema = z.object({
  version: z.literal(1),
  confirmed: sessionSchema.nullable(),
  pending: z
    .union([
      z.object({ method: z.literal('POST'), body: startFocusSchema }),
      z.object({
        method: z.literal('PATCH'),
        body: focusCommandSchema
          .innerType()
          .partial({ reflection: true, nextAction: true })
          .refine((input) => input.action !== 'finish' || !!input.outcome),
      }),
    ])
    .nullable(),
  setup: setupSchema,
})
/** Read validated recovery data belonging only to the current owner; malformed data is ignored. */
export function readFocusCheckpoint(owner: string): FocusRecovery | null {
  try {
    const parsed = recoverySchema.safeParse(
      JSON.parse(localStorage.getItem(`nobrainy:focus:v1:${owner}`) ?? 'null')
    )
    return parsed.success && (!parsed.data.confirmed || parsed.data.confirmed.userId === owner)
      ? parsed.data
      : null
  } catch {
    return null
  }
}
/** Persist a recovery checkpoint; false means browser storage is unavailable. */
export function writeFocusCheckpoint(owner: string, value: FocusRecovery): boolean {
  try {
    localStorage.setItem(`nobrainy:focus:v1:${owner}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
