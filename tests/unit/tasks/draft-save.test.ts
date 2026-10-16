import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftSave } from '@/lib/drafts/draft-save'

type Entity = { id: string; title: string; priority: string; updatedAt: string }

class MemoryStorage {
  map = new Map<string, string>()
  getItem = (k: string) => this.map.get(k) ?? null
  setItem = (k: string, v: string) => void this.map.set(k, v)
  removeItem = (k: string) => void this.map.delete(k)
}

const initial: Entity = { id: 't1', title: 'Write', priority: 'medium', updatedAt: 'v1' }

describe('DraftSave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('merges changes made within the delay into one save and reports saved', async () => {
    const save = vi.fn(async (patch: Partial<Entity>, _version: string) => ({
      ...initial,
      ...patch,
      updatedAt: 'v2',
    }))
    const queue = new DraftSave<Entity>('k', initial, save, new MemoryStorage(), 500)
    queue.change({ title: 'Write tests' })
    queue.change({ priority: 'high' })
    expect(queue.getSnapshot().state).toBe('pending')
    await vi.advanceTimersByTimeAsync(600)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][0]).toEqual({ title: 'Write tests', priority: 'high' })
    expect(save.mock.calls[0][1]).toBe('v1')
    expect(queue.getSnapshot().state).toBe('saved')
    expect(queue.getSnapshot().value.title).toBe('Write tests')
  })

  it('keeps content and offers retry after a failed save', async () => {
    let fail = true
    const save = vi.fn(async (patch: Partial<Entity>) => {
      if (fail) throw { success: false, error: { code: 'INTERNAL_ERROR' } }
      return { ...initial, ...patch, updatedAt: 'v2' }
    })
    const storage = new MemoryStorage()
    const queue = new DraftSave<Entity>('k', initial, save, storage, 100)
    queue.change({ title: 'Draft' })
    await vi.advanceTimersByTimeAsync(150)
    expect(queue.getSnapshot().state).toBe('error')
    expect(queue.getSnapshot().value.title).toBe('Draft')
    expect(storage.getItem('k')).toContain('Draft')
    fail = false
    queue.retry()
    await vi.advanceTimersByTimeAsync(10)
    expect(queue.getSnapshot().state).toBe('saved')
    expect(storage.getItem('k')).toBeNull()
  })

  it('enters conflict when the remote version moved and resolves by keeping the draft', async () => {
    const save = vi.fn(async (patch: Partial<Entity>) => ({
      ...initial,
      ...patch,
      updatedAt: 'v3',
    }))
    const queue = new DraftSave<Entity>('k', initial, save, new MemoryStorage(), 100)
    queue.change({ title: 'Mine' })
    queue.remote({ ...initial, title: 'Theirs', updatedAt: 'v2' })
    expect(queue.getSnapshot().state).toBe('conflict')
    await vi.advanceTimersByTimeAsync(200)
    expect(save).not.toHaveBeenCalled()
    queue.keepDraft({ ...initial, title: 'Theirs', updatedAt: 'v2' })
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledWith({ title: 'Mine' }, 'v2')
    expect(queue.getSnapshot().state).toBe('saved')
  })

  it('restores a stored draft for the same version as pending', () => {
    const storage = new MemoryStorage()
    storage.setItem('k', JSON.stringify({ version: 'v1', patch: { title: 'Recovered' } }))
    const queue = new DraftSave<Entity>('k', initial, vi.fn(), storage, 100)
    expect(queue.getSnapshot().state).toBe('pending')
    expect(queue.getSnapshot().value.title).toBe('Recovered')
  })
})
