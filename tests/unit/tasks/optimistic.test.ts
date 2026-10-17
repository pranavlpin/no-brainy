import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { patchDeep, patchCaches, restoreCaches } from '@/lib/query/optimistic'

type Item = { id: string; status: string }

describe('patchDeep', () => {
  it('patches matching items inside a paginated API response', () => {
    const data = {
      success: true,
      data: {
        items: [
          { id: 'a', status: 'pending' },
          { id: 'b', status: 'pending' },
        ],
        total: 2,
      },
    }
    const out = patchDeep(
      data,
      (t: Item) => t.id === 'a',
      (t) => ({ ...t, status: 'completed' })
    )
    expect(out.data.items[0].status).toBe('completed')
    expect(out.data.items[1]).toBe(data.data.items[1]) // untouched items keep identity
    expect(data.data.items[0].status).toBe('pending') // input not mutated
  })

  it('patches raw arrays and nested planner shapes', () => {
    const arr = [{ id: 'a', status: 'pending' }]
    expect(
      patchDeep(
        arr,
        (t: Item) => t.id === 'a',
        (t) => ({ ...t, status: 'x' })
      )[0].status
    ).toBe('x')

    const plan = {
      success: true,
      data: {
        focusTaskIds: ['a'],
        focusTasks: [{ id: 'a', status: 'pending' }],
        tasksDueToday: [
          { id: 'a', status: 'pending' },
          { id: 'c', status: 'pending' },
        ],
      },
    }
    const out = patchDeep(
      plan,
      (t: Item) => t.id === 'a',
      (t) => ({ ...t, status: 'completed' })
    )
    expect(out.data.focusTasks[0].status).toBe('completed')
    expect(out.data.tasksDueToday[0].status).toBe('completed')
    expect(out.data.tasksDueToday[1].status).toBe('pending')
    expect(out.data.focusTaskIds).toEqual(['a'])
  })

  it('patches a single detail object', () => {
    const detail = { success: true, data: { id: 'a', status: 'pending' } }
    const out = patchDeep(
      detail,
      (t: Item) => t.id === 'a',
      (t) => ({ ...t, status: 'done' })
    )
    expect(out.data.status).toBe('done')
  })
})

describe('patchCaches / restoreCaches', () => {
  it('patches every cache under a key prefix and can roll back', () => {
    const qc = new QueryClient()
    qc.setQueryData(['tasks', { status: 'pending' }], {
      success: true,
      data: { items: [{ id: 'a', status: 'pending' }] },
    })
    qc.setQueryData(['tasks', 'a'], { success: true, data: { id: 'a', status: 'pending' } })
    qc.setQueryData(['notes'], [{ id: 'a', status: 'note' }])

    const snapshots = patchCaches<Item>(
      qc,
      ['tasks'],
      (t) => t.id === 'a',
      (t) => ({
        ...t,
        status: 'completed',
      })
    )
    expect(snapshots).toHaveLength(2)
    const list = qc.getQueryData<{ data: { items: Item[] } }>(['tasks', { status: 'pending' }])
    expect(list?.data.items[0].status).toBe('completed')
    const detail = qc.getQueryData<{ data: Item }>(['tasks', 'a'])
    expect(detail?.data.status).toBe('completed')
    expect(qc.getQueryData<Item[]>(['notes'])?.[0].status).toBe('note')

    restoreCaches(qc, snapshots)
    expect(
      qc.getQueryData<{ data: { items: Item[] } }>(['tasks', { status: 'pending' }])?.data.items[0]
        .status
    ).toBe('pending')
  })
})
