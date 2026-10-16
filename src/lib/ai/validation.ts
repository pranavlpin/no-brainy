import { z } from 'zod'
import { AIError } from './call-ai'
import { calendarDate } from '@/lib/dates/calendar'
const text = z.string().trim().min(1).max(30000)
const priority = z.enum(['urgent', 'high', 'medium', 'low'])
export const aiSchemas = {
  plan: z.object({
    suggestedTaskIds: z
      .array(z.string().min(1))
      .min(1)
      .max(3)
      .refine((ids) => new Set(ids).size === ids.length),
    reasoning: text,
    briefMd: text,
  }),
  recap: z.object({ summaryMd: text }),
  actions: z.object({
    tasks: z
      .array(z.object({ title: z.string().trim().min(1).max(500), priority, reason: text }))
      .max(8),
  }),
  summary: z.object({ bullets: z.array(text).max(10) }),
  tags: z.object({ tags: z.array(z.string().trim().min(1).max(100)).max(12) }),
  noteInsights: z.object({
    insights: z.array(z.object({ title: text, description: text })).max(10),
  }),
  cards: z.object({
    cards: z
      .array(
        z.object({
          cardType: z.enum(['qa', 'cloze', 'definition']),
          frontMd: text,
          backMd: text,
          sourceExcerpt: z.string().max(10000).optional(),
        })
      )
      .max(20),
  }),
  distill: z.object({
    title: text,
    contentMd: text,
    suggestedTags: z.array(z.string().max(100)).max(12),
  }),
  priorities: z.object({
    suggestions: z
      .array(
        z.object({
          taskId: z.string(),
          currentPriority: priority,
          suggestedPriority: priority,
          reason: text,
        })
      )
      .max(50),
    reasoning: text,
  }),
  insights: z.object({
    insights: z
      .array(
        z.object({
          insightType: z.enum([
            'workload',
            'priority',
            'streak',
            'gap',
            'time',
            'topic',
            'spending',
            'budget',
            'category_trend',
            'goal_progress',
            'learning',
            'cross_module',
          ]),
          contentMd: text,
          severity: z.enum(['info', 'warning', 'positive']),
          relatedEntity: z
            .enum(['task', 'note', 'flashcard', 'expense', 'goal', 'budget'])
            .nullable(),
          sourceIds: z.array(z.string().min(1)).min(1).max(20),
        })
      )
      .max(10),
  }),
}
/** Treat malformed model output as a recoverable provider failure, never trusted application data. */
export function validateAIOutput<K extends keyof typeof aiSchemas>(
  kind: K,
  value: unknown
): z.infer<(typeof aiSchemas)[K]> {
  const result = aiSchemas[kind].safeParse(value)
  if (!result.success)
    throw new AIError(
      'The suggestion was incomplete. Please retry or continue manually.',
      'AI_INVALID_RESPONSE'
    )
  return result.data as z.infer<(typeof aiSchemas)[K]>
}
/** Every suggested relationship must resolve inside the supplied owned, active candidate set. */
export function validatePlan(value: unknown, ownedIds: ReadonlySet<string>) {
  const parsed = validateAIOutput('plan', value)
  if (parsed.suggestedTaskIds.some((id) => !ownedIds.has(id)))
    throw new AIError(
      'Some suggested actions are no longer available. Please regenerate.',
      'AI_INVALID_RESPONSE'
    )
  return parsed
}
const date = z
  .string()
  .refine((value) => calendarDate(value) === value, 'Choose a valid calendar date')
export const contextSchema = z
  .object({
    modules: z
      .array(z.enum(['tasks', 'notes', 'flashcards', 'expenses', 'goals', 'budgets']))
      .max(6)
      .optional(),
    dateFrom: date.optional(),
    dateTo: date.optional(),
  })
  .refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, 'Choose an ordered date range')
export const coachInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(12000),
      })
    )
    .min(1)
    .max(30),
  context: contextSchema.optional(),
})
