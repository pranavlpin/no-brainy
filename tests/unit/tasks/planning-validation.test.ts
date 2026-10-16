import { describe, expect, it } from 'vitest'
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '@/lib/validations/tasks'
import { priorityRank } from '@/lib/tasks/priority'

describe('task planning fields', () => {
  it('accepts a planned day key and bounded estimate, effort, and context', () => {
    const t = createTaskSchema.parse({
      title: 'Plan',
      plannedDate: '2026-10-20',
      estimatedMinutes: 45,
      effort: 'deep',
      context: 'work',
    })
    expect(t.plannedDate).toBe('2026-10-20')
    expect(t.estimatedMinutes).toBe(45)
    expect(createTaskSchema.safeParse({ title: 'x', estimatedMinutes: 0 }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'x', estimatedMinutes: 2000 }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'x', effort: 'huge' }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'x', context: 'school' }).success).toBe(false)
    expect(createTaskSchema.safeParse({ title: 'x', plannedDate: '2026-02-30' }).success).toBe(
      false
    )
  })

  it('allows clearing planning fields and carrying an expected version on update', () => {
    const u = updateTaskSchema.parse({
      plannedDate: null,
      estimatedMinutes: null,
      expectedUpdatedAt: '2026-10-16T00:00:00.000Z',
    })
    expect(u.plannedDate).toBeNull()
    expect(u.expectedUpdatedAt).toBe('2026-10-16T00:00:00.000Z')
  })

  it('understands the active status and planned-date bounds in list queries', () => {
    const q = taskQuerySchema.parse({
      status: 'active',
      plannedDateFrom: '2026-10-13',
      plannedDateTo: '2026-10-19',
      sortBy: 'plannedDate',
    })
    expect(q.status).toBe('active')
    expect(q.plannedDateFrom).toBe('2026-10-13')
    expect(q.sortBy).toBe('plannedDate')
  })

  it('ranks priorities numerically', () => {
    expect(priorityRank('urgent')).toBe(0)
    expect(priorityRank('high')).toBe(1)
    expect(priorityRank('medium')).toBe(2)
    expect(priorityRank('low')).toBe(3)
  })
})
