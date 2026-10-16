import { describe, expect, it } from 'vitest'
import { planCapacity, timeMinutes } from '@/lib/planner/capacity'
import { updateDayPlanSchema } from '@/lib/validations/planner'

describe('planCapacity', () => {
  it('counts scheduled work once, includes buffers, and keeps unknown estimates unknown', () => {
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
        {
          id: 'meeting',
          title: 'Meeting',
          startTime: '11:00',
          endTime: '11:30',
          isCompleted: false,
        },
      ],
      availableMinutes: 120,
      bufferMinutes: 15,
      workStart: '09:00',
      workEnd: '17:00',
    })
    // 15 buffer + 30 unlinked meeting + max(45, 60) for task a; b stays unknown.
    expect(result).toMatchObject({
      plannedMinutes: 105,
      availableMinutes: 120,
      unknownTaskIds: ['b'],
      overBy: 0,
      fits: false,
    })
  })

  it('warns about overlaps and caps available minutes to the working window', () => {
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

  it('fits when everything is estimated, nothing overlaps, and the total is under capacity', () => {
    const result = planCapacity({
      tasks: [{ id: 'a', estimatedMinutes: 30 }],
      blocks: [],
      availableMinutes: 180,
      bufferMinutes: 15,
    })
    expect(result.fits).toBe(true)
    expect(timeMinutes('13:45')).toBe(825)
  })
})

describe('updateDayPlanSchema capacity and time blocks', () => {
  const block = { id: 'b', title: 'Work', startTime: '14:00', endTime: '13:00', isCompleted: false }

  it('rejects a block whose end is not after its start, and duplicate block ids', () => {
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

  it('bounds capacity fields and accepts a nullable working window', () => {
    expect(updateDayPlanSchema.safeParse({ availableMinutes: 240, bufferMinutes: 0 }).success).toBe(
      true
    )
    expect(updateDayPlanSchema.safeParse({ availableMinutes: 1500 }).success).toBe(false)
    expect(updateDayPlanSchema.safeParse({ bufferMinutes: -5 }).success).toBe(false)
    expect(updateDayPlanSchema.safeParse({ workStart: '09:00', workEnd: null }).success).toBe(true)
    expect(updateDayPlanSchema.safeParse({ workStart: '9am' }).success).toBe(false)
  })
})
