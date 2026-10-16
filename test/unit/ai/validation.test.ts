import { it, expect } from 'vitest'
import { validatePlan, validateAIOutput } from '@/lib/ai/validation'
it.each([{ ids: ['a', 'a'] }, { ids: ['a', 'b', 'c', 'd'] }, { ids: ['missing'] }, { ids: [] }])(
  'rejects invalid planning relationships %j',
  ({ ids }) => {
    expect(() =>
      validatePlan(
        { suggestedTaskIds: ids, reasoning: 'Why', briefMd: 'A preview' },
        new Set(['a', 'b', 'c', 'd'])
      )
    ).toThrow()
  }
)
it('keeps valid unknown-duration candidates rather than inventing estimates', () => {
  expect(
    validatePlan({ suggestedTaskIds: ['a'], reasoning: 'Why', briefMd: 'Preview' }, new Set(['a']))
      .suggestedTaskIds
  ).toEqual(['a'])
})
it.each(['recap', 'actions', 'cards', 'priorities', 'insights'] as const)(
  'rejects malformed %s output',
  (kind) => {
    expect(() => validateAIOutput(kind, { unexpected: true })).toThrow()
  }
)
