import { z } from 'zod'
export const startFocusSchema = z.object({
  clientRequestId: z.string().uuid(),
  taskId: z.string().min(1).nullable().optional(),
  plannedSeconds: z.number().int().min(60).max(10800),
  intention: z.string().trim().max(1000).default(''),
})
export const focusCommandSchema = z
  .object({
    id: z.string().min(1),
    expectedUpdatedAt: z.string().datetime(),
    action: z.enum(['pause', 'resume', 'finish']),
    outcome: z.enum(['completed', 'progress', 'blocked']).optional(),
    reflection: z.string().trim().max(10000).default(''),
    nextAction: z.string().trim().max(300).default(''),
  })
  .refine((input) => input.action !== 'finish' || !!input.outcome, {
    message: 'Choose a session result',
  })
