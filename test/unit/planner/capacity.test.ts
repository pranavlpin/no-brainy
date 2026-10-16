import { expect, it } from 'vitest'
import { planCapacity } from '@/lib/planner/capacity'
import { dateParamSchema, updateDayPlanSchema } from '@/lib/validations/planner'

it('counts scheduled work once, includes buffers and labels unknown estimates honestly', () => {
  const result = planCapacity({
    tasks: [
      { id: 'a', estimatedMinutes: 45 },
      { id: 'b', estimatedMinutes: null },
      { id: 'a', estimatedMinutes: 45 },
    ],
    blocks: [
      {
        id: 'block-a',
        title: 'Deep work',
        startTime: '09:00',
        endTime: '10:00',
        taskId: 'a',
        isCompleted: false,
      },
      { id: 'meeting', title: 'Meeting', startTime: '11:00', endTime: '11:30', isCompleted: false },
    ],
    availableMinutes: 120,
    bufferMinutes: 15,
    workStart: '09:00',
    workEnd: '17:00',
  })
  expect(result).toMatchObject({
    plannedMinutes: 105,
    availableMinutes: 120,
    unknownTaskIds: ['b'],
    overBy: 0,
    fits: false,
  })
})

it('warns about overlaps, respects the working window and supports a smaller-capacity day', () => {
  const result = planCapacity({
    tasks: [{ id: 'a', estimatedMinutes: 90 }],
    blocks: [
      {
        id: 'a',
        title: 'Work',
        startTime: '09:00',
        endTime: '10:00',
        taskId: 'a',
        isCompleted: false,
      },
      { id: 'b', title: 'Call', startTime: '09:30', endTime: '10:30', isCompleted: false },
    ],
    availableMinutes: 240,
    bufferMinutes: 20,
    workStart: '09:00',
    workEnd: '11:00',
  })
  expect(result).toMatchObject({
    plannedMinutes: 170,
    availableMinutes: 120,
    overBy: 50,
    fits: false,
  })
  expect(result.overlaps).toEqual(['a', 'b'])
})

it('rejects impossible dates, invalid intervals and duplicate block IDs while permitting overlap warnings', () => {
  expect(dateParamSchema.safeParse('2026-02-30').success).toBe(false)
  const block = { id: 'b', title: 'Work', startTime: '14:00', endTime: '13:00', isCompleted: false }
  expect(updateDayPlanSchema.safeParse({ timeBlocks: [block] }).success).toBe(false)
  expect(
    updateDayPlanSchema.safeParse({
      timeBlocks: [
        { ...block, endTime: '15:00' },
        { ...block, endTime: '16:00' },
      ],
    }).success
  ).toBe(false)
  expect(
    updateDayPlanSchema.safeParse({
      timeBlocks: [
        { ...block, endTime: '15:00' },
        { ...block, id: 'c', endTime: '16:00' },
      ],
    }).success
  ).toBe(true)
})
