import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DraftSave } from '@/lib/tasks/draft-save'

const initial = { id: 't1', title: 'Initial', priority: 'medium', updatedAt: 'v1' }
const storage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('serializes in-flight edits and sends each batch against the version it follows', async () => {
  let finish!: (value: typeof initial) => void
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    .mockResolvedValue({ ...initial, title: 'Newest', priority: 'urgent', updatedAt: 'v3' })
  const queue = new DraftSave('user:task', initial, save, storage(), 800)
  queue.change({ title: 'First edit' })
  await vi.advanceTimersByTimeAsync(800)
  queue.change({ title: 'Newest', priority: 'urgent' })
  await vi.advanceTimersByTimeAsync(1600)
  expect(save).toHaveBeenCalledTimes(1)
  expect(queue.getSnapshot().value.title).toBe('Newest')
  finish({ ...initial, title: 'First edit', updatedAt: 'v2' })
  await vi.advanceTimersByTimeAsync(800)
  expect(save).toHaveBeenLastCalledWith({ title: 'Newest', priority: 'urgent' }, 'v2')
  expect(queue.getSnapshot()).toMatchObject({ value: { title: 'Newest' }, state: 'saved' })
})

it('keeps failed batches and later edits together for retry and isolates draft keys', async () => {
  const disk = storage()
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ...initial, title: 'Keep', priority: 'high', updatedAt: 'v2' })
  const queue = new DraftSave('user-one:task-one', initial, save, disk)
  queue.change({ title: 'Keep' })
  await queue.flush()
  expect(queue.getSnapshot().state).toBe('error')
  queue.change({ priority: 'high' })
  await queue.flush()
  expect(save).toHaveBeenLastCalledWith({ title: 'Keep', priority: 'high' }, 'v1')
  expect(disk.getItem('user-one:task-one')).toBeNull()
  expect(new DraftSave('user-two:task-one', initial, save, disk).getSnapshot().value.title).toBe(
    'Initial'
  )
})

it('does not call a conflict or unavailable local storage a confirmed save', async () => {
  const save = vi.fn().mockRejectedValue({ error: { code: 'CONFLICT' } })
  const queue = new DraftSave('draft', initial, save)
  queue.change({ title: 'Retain' })
  await queue.flush()
  expect(queue.getSnapshot()).toMatchObject({
    state: 'conflict',
    durable: false,
    value: { title: 'Retain' },
  })
  queue.retry()
  await vi.advanceTimersByTimeAsync(1000)
  expect(save).toHaveBeenCalledTimes(1)
})
