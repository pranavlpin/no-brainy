import { z } from 'zod'
import { dateKeySchema } from '@/lib/validations/tasks'

export const evidenceKindSchema = z.enum(['reflection', 'practice', 'rest', 'skip'])
export const growthSourceTypeSchema = z.enum(['note', 'book', 'project', 'session'])

export const evidenceSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    goalId: z.string().min(1),
    observedAt: dateKeySchema,
    summary: z.string().trim().min(1, 'Add a short observation').max(10000),
    measurement: z.number().finite().nullable().optional(),
    kind: evidenceKindSchema.default('reflection'),
    sourceType: growthSourceTypeSchema.nullable().optional(),
    sourceId: z.string().min(1).nullable().optional(),
  })
  .refine((v) => !!v.sourceType === !!v.sourceId, {
    message: 'Choose a source or leave both source fields empty',
    path: ['sourceId'],
  })

export const evidenceEditSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  observedAt: dateKeySchema.optional(),
  summary: z.string().trim().min(1).max(10000).optional(),
  measurement: z.number().finite().nullable().optional(),
  kind: evidenceKindSchema.optional(),
})

export const evidenceQuerySchema = z.object({
  goalId: z.string().optional(),
  kind: evidenceKindSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export const growthSourceQuerySchema = z.object({
  type: growthSourceTypeSchema,
  search: z.string().max(200).default(''),
  page: z.coerce.number().int().positive().default(1),
})
