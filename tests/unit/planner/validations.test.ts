import { describe, expect, it } from 'vitest'
import { triageSchema, updateDayPlanSchema } from '@/lib/validations/planner'
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/tasks'

describe('triageSchema', () => {
  it('accepts keep and drop without a date', () => {
    expect(triageSchema.safeParse({ taskId: 't1', action: 'keep' }).success).toBe(true)
    expect(triageSchema.safeParse({ taskId: 't1', action: 'drop' }).success).toBe(true)
  })

  it('requires a valid date for move', () => {
    expect(triageSchema.safeParse({ taskId: 't1', action: 'move' }).success).toBe(false)
    expect(
      triageSchema.safeParse({ taskId: 't1', action: 'move', date: '2026-13-40' }).success
    ).toBe(false)
    expect(
      triageSchema.safeParse({ taskId: 't1', action: 'move', date: '2026-10-20' }).success
    ).toBe(true)
  })

  it('rejects unknown actions and empty ids', () => {
    expect(triageSchema.safeParse({ taskId: '', action: 'keep' }).success).toBe(false)
    expect(triageSchema.safeParse({ taskId: 't1', action: 'snooze' }).success).toBe(false)
  })
})

describe('updateDayPlanSchema intent', () => {
  it('accepts an intent up to 500 characters and null to clear', () => {
    expect(updateDayPlanSchema.safeParse({ intentMd: 'Ship the Today page' }).success).toBe(true)
    expect(updateDayPlanSchema.safeParse({ intentMd: null }).success).toBe(true)
    expect(updateDayPlanSchema.safeParse({ intentMd: 'x'.repeat(501) }).success).toBe(false)
  })
})

describe('task dueDate accepts date keys', () => {
  it('normalizes YYYY-MM-DD to UTC midnight and keeps ISO datetimes', () => {
    const a = createTaskSchema.parse({ title: 'A', dueDate: '2026-10-16' })
    expect(a.dueDate).toBe('2026-10-16T00:00:00.000Z')
    const b = createTaskSchema.parse({ title: 'B', dueDate: '2026-10-16T09:30:00.000Z' })
    expect(b.dueDate).toBe('2026-10-16T09:30:00.000Z')
    expect(createTaskSchema.safeParse({ title: 'C', dueDate: 'tomorrow' }).success).toBe(false)
    const u = updateTaskSchema.parse({ dueDate: '2026-11-01' })
    expect(u.dueDate).toBe('2026-11-01T00:00:00.000Z')
    expect(updateTaskSchema.parse({ dueDate: null }).dueDate).toBeNull()
  })
})
