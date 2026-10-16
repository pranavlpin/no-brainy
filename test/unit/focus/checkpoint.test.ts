import { beforeEach, expect, it, vi } from 'vitest'
import {
  defaultSetup,
  readFocusCheckpoint,
  writeFocusCheckpoint,
  type FocusRecovery,
} from '@/lib/focus/checkpoint'
const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  })
})
it('recovers an owner-scoped pending result and intention without claiming it was saved', () => {
  const checkpoint: FocusRecovery = {
    version: 1,
    confirmed: null,
    pending: {
      method: 'PATCH',
      body: {
        id: 'session',
        expectedUpdatedAt: '2026-10-16T10:00:00.000Z',
        action: 'finish',
        outcome: 'progress',
        reflection: 'A retained result',
      },
    },
    setup: { ...defaultSetup, intention: 'One clear step' },
  }
  expect(writeFocusCheckpoint('owner', checkpoint)).toBe(true)
  expect(readFocusCheckpoint('other')).toBeNull()
  expect(readFocusCheckpoint('owner')).toEqual(checkpoint)
})
it('handles corrupt data and denied storage explicitly', () => {
  memory.set('nobrainy:focus:v1:owner', '{"version":1,"pending":"invalid"}')
  expect(readFocusCheckpoint('owner')).toBeNull()
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw Error('denied')
    },
    setItem: () => {
      throw Error('denied')
    },
  })
  expect(
    writeFocusCheckpoint('owner', {
      version: 1,
      confirmed: null,
      pending: null,
      setup: defaultSetup,
    })
  ).toBe(false)
  expect(readFocusCheckpoint('owner')).toBeNull()
})
