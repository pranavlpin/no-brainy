import { z } from 'zod'
import { dateKeySchema } from '@/lib/validations/tasks'

const webUrl = z
  .string()
  .max(2000)
  .url()
  .refine((value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, 'Use an http or https link')

export const captureSchema = z.object({
  content: z.string().trim().min(1, 'Write something to capture').max(30000),
  clientRequestId: z.string().uuid(),
  sourceUrl: webUrl.nullable().optional(),
})

export const captureQuerySchema = z.object({
  id: z.string().optional(),
  state: z.enum(['inbox', 'processed', 'someday', 'archived', 'all']).default('inbox'),
  search: z.string().max(500).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
})

export const captureStateSchema = z.object({ state: z.enum(['inbox', 'someday', 'archived']) })

export const processCaptureSchema = z
  .object({
    kind: z.enum(['task', 'note', 'bookmark', 'someday']),
    title: z.string().trim().min(1).max(500).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    plannedDate: dateKeySchema.nullable().optional(),
    dueDate: dateKeySchema.nullable().optional(),
    projectId: z.string().nullable().optional(),
    url: webUrl.optional(),
  })
  .refine((v) => v.kind !== 'bookmark' || !!v.url, {
    message: 'A bookmark needs a web link',
    path: ['url'],
  })

export type ProcessCaptureParsed = z.infer<typeof processCaptureSchema>

/** First web link in the text, without fetching it; null when none or unsafe. */
export function captureSource(content: string): string | null {
  const candidate = content.match(/https?:\/\/[^\s<>]+/)?.[0]?.replace(/[.,;)]+$/, '')
  return candidate && webUrl.safeParse(candidate).success ? candidate : null
}
