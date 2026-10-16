import { describe, expect, it } from 'vitest'
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/tasks'

describe('task calendar contract', () => {
  it('accepts a calendar deadline from quick capture', () => {
    const result = createTaskSchema.safeParse({ title: 'Read', dueDate: '2028-02-29' })
    expect(result.success).toBe(true)
  })

  it('retains the calendar label of compatible ISO deadlines', () => {
    expect(
      createTaskSchema.parse({ title: 'Read', dueDate: '2026-10-17T00:00:00.000Z' }).dueDate
    ).toBe('2026-10-17')
  })

  it.each(['2026-02-29', '2026-04-31', '2026-13-01', 'tomorrow'])(
    'rejects impossible date %s',
    (dueDate) => {
      expect(createTaskSchema.safeParse({ title: 'Read', dueDate }).success).toBe(false)
    }
  )

  it('rejects reversed ranges and accepts the complete active status filter', () => {
    expect(taskQuerySchema.safeParse({ status: 'pending,in_progress' }).success).toBe(true)
    expect(
      taskQuerySchema.safeParse({ dueDateFrom: '2026-10-20', dueDateTo: '2026-10-10' }).success
    ).toBe(false)
  })
})
