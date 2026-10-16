import { describe, expect, it } from 'vitest'
import { buildReflectionMd, parseReflectionMd, REFLECTION_PROMPTS } from '@/lib/reviews/reflection'
import { createReviewSchema, updateReviewSchema } from '@/lib/validations/reviews'

describe('reflection markdown', () => {
  it('builds three headed sections and round-trips', () => {
    const md = buildReflectionMd({
      wentWell: 'Shipped the planner',
      stuck: 'Lost an hour to a stale Prisma client',
      learned: 'Restart the dev server after migrations',
    })
    for (const p of REFLECTION_PROMPTS) expect(md).toContain(`## ${p.heading}`)
    expect(parseReflectionMd(md)).toEqual({
      wentWell: 'Shipped the planner',
      stuck: 'Lost an hour to a stale Prisma client',
      learned: 'Restart the dev server after migrations',
    })
  })

  it('treats free-form legacy text as "went well" and skips empty sections', () => {
    expect(parseReflectionMd('Just a plain note').wentWell).toBe('Just a plain note')
    const md = buildReflectionMd({ wentWell: 'Only this', stuck: '', learned: '' })
    expect(md).not.toContain(REFLECTION_PROMPTS[1].heading)
    expect(buildReflectionMd({ wentWell: '', stuck: '', learned: '' })).toBe('')
  })
})

describe('review schemas accept tomorrowIntent', () => {
  it('limits the intent to 280 characters and allows null', () => {
    expect(updateReviewSchema.safeParse({ tomorrowIntent: 'Write the Home page' }).success).toBe(
      true
    )
    expect(updateReviewSchema.safeParse({ tomorrowIntent: null }).success).toBe(true)
    expect(updateReviewSchema.safeParse({ tomorrowIntent: 'x'.repeat(281) }).success).toBe(false)
    expect(
      createReviewSchema.safeParse({ reviewDate: '2026-10-16', tomorrowIntent: 'Rest' }).success
    ).toBe(true)
  })
})
