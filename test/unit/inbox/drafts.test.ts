import { expect, it } from 'vitest'
import { readCaptureDraft, writeCaptureDraft, type CaptureDraft } from '@/lib/inbox/drafts'

it('restores versioned content and request identity only for the same owner', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
  const draft: CaptureDraft = {
    content: 'Something worth returning to',
    requestId: 'd0bc68ce-cf24-4665-a519-ce536f372387',
    type: 'inbox',
    priority: 'medium',
    dueDate: '',
  }
  expect(writeCaptureDraft(storage, 'owner-1', draft)).toBe(true)
  expect(readCaptureDraft(storage, 'owner-1')).toEqual(draft)
  expect(readCaptureDraft(storage, 'owner-2')).toBeNull()
})

it('reports unavailable storage and tolerates malformed legacy data without deleting it', () => {
  const bad = {
    getItem: () => '{broken',
    setItem: () => {
      throw new Error('Quota')
    },
  }
  expect(readCaptureDraft(bad, 'owner')).toBeNull()
  expect(
    writeCaptureDraft(bad, 'owner', {
      content: 'Keep me',
      requestId: 'd0bc68ce-cf24-4665-a519-ce536f372387',
      type: 'inbox',
      priority: 'medium',
      dueDate: '',
    })
  ).toBe(false)
  expect(readCaptureDraft(undefined, 'owner')).toBeNull()
})
