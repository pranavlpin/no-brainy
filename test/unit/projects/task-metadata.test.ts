import { expect, it } from 'vitest'
import { createTaskSchema, updateTaskSchema } from '@/lib/validations/tasks'

it('accepts title-only tasks and keeps planned dates independent of deadlines', () => {
  expect(createTaskSchema.parse({ title: 'Small next step' }).title).toBe('Small next step')
  expect(
    createTaskSchema.parse({
      title: 'Prepare release',
      plannedDate: '2026-10-20',
      dueDate: '2026-10-23',
      context: 'work',
      estimatedMinutes: 45,
      effort: 'deep',
      projectId: 'project-1',
    })
  ).toMatchObject({
    plannedDate: '2026-10-20',
    dueDate: '2026-10-23',
    context: 'work',
    estimatedMinutes: 45,
    effort: 'deep',
    projectId: 'project-1',
  })
  expect(updateTaskSchema.parse({ plannedDate: '2026-10-21' })).not.toHaveProperty('dueDate')
})

it('rejects impossible planning dates and negative estimates while allowing metadata to be cleared', () => {
  expect(createTaskSchema.safeParse({ title: 'Plan', plannedDate: '2026-02-30' }).success).toBe(
    false
  )
  expect(createTaskSchema.safeParse({ title: 'Plan', estimatedMinutes: -1 }).success).toBe(false)
  expect(
    updateTaskSchema.parse({
      projectId: null,
      plannedDate: null,
      estimatedMinutes: null,
      effort: null,
      context: null,
    })
  ).toMatchObject({
    projectId: null,
    plannedDate: null,
    estimatedMinutes: null,
    effort: null,
    context: null,
  })
})
