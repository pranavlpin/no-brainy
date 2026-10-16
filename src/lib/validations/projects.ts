import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Give this project a name').max(200),
  outcome: z.string().max(5000).default(''),
  context: z.enum(['work', 'personal']).default('personal'),
  status: z.enum(['active', 'paused', 'completed', 'archived']).default('active'),
  goalId: z.string().nullable().optional(),
})

export const updateProjectSchema = projectSchema.partial().extend({
  nextActionId: z.string().nullable().optional(),
  noteIds: z.array(z.string()).max(100).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
})

export const projectQuerySchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'archived', 'all']).default('active'),
  context: z.enum(['work', 'personal', 'all']).optional(),
  search: z.string().max(200).optional(),
})

export const addActionSchema = z.object({
  title: z.string().trim().min(1, 'Describe the action').max(500),
  /** Client-generated; the same id never creates a second task. */
  submissionId: z.string().uuid(),
})
