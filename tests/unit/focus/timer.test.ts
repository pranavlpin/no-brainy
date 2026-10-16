import { beforeEach, describe, expect, it } from 'vitest'
import {
  WORK_SEC,
  SHORT_BREAK_SEC,
  LONG_BREAK_SEC,
  elapsedSeconds,
  formatClock,
  remainingSeconds,
  staleSessionEnd,
} from '@/lib/focus/timer'
import { useFocusStore } from '@/stores/focus-store'

const t0 = Date.parse('2026-10-16T09:00:00Z')

describe('timer math', () => {
  it('derives elapsed and remaining from the wall clock while running', () => {
    const state = {
      phase: 'running' as const,
      startedAt: t0,
      accumulatedSec: 0,
      plannedSec: WORK_SEC,
    }
    expect(elapsedSeconds(state, t0 + 60_000)).toBe(60)
    expect(remainingSeconds(state, t0 + 60_000)).toBe(WORK_SEC - 60)
    expect(remainingSeconds(state, t0 + 10 * 60 * 60_000)).toBe(0)
  })

  it('freezes while paused', () => {
    const state = {
      phase: 'paused' as const,
      startedAt: null,
      accumulatedSec: 100,
      plannedSec: WORK_SEC,
    }
    expect(remainingSeconds(state, t0)).toBe(WORK_SEC - 100)
    expect(remainingSeconds(state, t0 + 999_999)).toBe(WORK_SEC - 100)
  })

  it('formats clocks and exposes the standard durations', () => {
    expect(formatClock(1500)).toBe('25:00')
    expect(formatClock(59)).toBe('00:59')
    expect(formatClock(3661)).toBe('61:01')
    expect(WORK_SEC).toBe(25 * 60)
    expect(SHORT_BREAK_SEC).toBe(5 * 60)
    expect(LONG_BREAK_SEC).toBe(15 * 60)
  })

  it('closes abandoned sessions at 25 minutes after a 2 hour grace', () => {
    const started = new Date(t0)
    expect(staleSessionEnd(started, new Date(t0 + 60 * 60_000))).toBeNull()
    expect(staleSessionEnd(started, new Date(t0 + 3 * 60 * 60_000))?.toISOString()).toBe(
      new Date(t0 + 25 * 60_000).toISOString()
    )
  })
})

describe('focus store', () => {
  beforeEach(() => useFocusStore.getState().reset())

  it('starts, pauses, resumes, and stops while preserving remaining time', () => {
    const s = useFocusStore.getState()
    s.start(
      { kind: 'work', plannedSec: WORK_SEC, taskId: 't1', taskTitle: 'Deep work', sessionId: 's1' },
      t0
    )
    expect(useFocusStore.getState().phase).toBe('running')
    expect(remainingSeconds(useFocusStore.getState(), t0 + 120_000)).toBe(WORK_SEC - 120)

    useFocusStore.getState().pause(t0 + 120_000)
    expect(useFocusStore.getState().phase).toBe('paused')
    expect(useFocusStore.getState().accumulatedSec).toBe(120)
    expect(remainingSeconds(useFocusStore.getState(), t0 + 999_000)).toBe(WORK_SEC - 120)

    useFocusStore.getState().resume(t0 + 300_000)
    expect(useFocusStore.getState().startedAt).toBe(t0 + 300_000)
    expect(remainingSeconds(useFocusStore.getState(), t0 + 360_000)).toBe(WORK_SEC - 180)

    useFocusStore.getState().stop()
    expect(useFocusStore.getState().phase).toBe('idle')
    expect(useFocusStore.getState().sessionId).toBeNull()
  })

  it('counts completed pomodoros and picks the break length', () => {
    const s = useFocusStore.getState()
    for (let i = 0; i < 3; i++) s.completePomodoro()
    expect(useFocusStore.getState().pomodoroCount).toBe(3)
    expect(useFocusStore.getState().nextBreakSec()).toBe(SHORT_BREAK_SEC)
    s.completePomodoro()
    expect(useFocusStore.getState().nextBreakSec()).toBe(LONG_BREAK_SEC)
  })
})
