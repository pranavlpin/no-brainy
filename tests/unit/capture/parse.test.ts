import { describe, expect, it } from 'vitest'
import { parseCapture } from '@/lib/capture/parse'

const today = '2026-10-16' // Friday
const goals = [
  { id: 'g1', title: 'Fitness goal' },
  { id: 'g2', title: 'Ship NoBrainy' },
]

describe('parseCapture', () => {
  it('extracts a relative date, tag, and priority', () => {
    const p = parseCapture('Call bank tomorrow #finance !high', { today })
    expect(p.kind).toBe('task')
    expect(p.title).toBe('Call bank')
    expect(p.dueDate).toBe('2026-10-17')
    expect(p.tags).toEqual(['finance'])
    expect(p.priority).toBe('high')
  })

  it('recognizes a note prefix', () => {
    const p = parseCapture('note: idea about onboarding', { today })
    expect(p.kind).toBe('note')
    expect(p.title).toBe('idea about onboarding')
    expect(parseCapture('task: fix login', { today }).kind).toBe('task')
  })

  it('matches multi-word goals by prefix and rolls weekdays forward', () => {
    const p = parseCapture('Gym on friday @Fitness goal', { today, goals })
    expect(p.goalId).toBe('g1')
    expect(p.title).toBe('Gym')
    expect(p.dueDate).toBe('2026-10-23') // next Friday, not today
    const q = parseCapture('Demo @Ship monday', { today, goals })
    expect(q.goalId).toBe('g2')
    expect(q.dueDate).toBe('2026-10-19')
  })

  it('handles absolute dates and day-month forms', () => {
    expect(parseCapture('Pay rent 2026-11-01', { today }).dueDate).toBe('2026-11-01')
    expect(parseCapture('Pay rent 2026-11-01', { today }).title).toBe('Pay rent')
    expect(parseCapture('Buy gifts 25/12', { today }).dueDate).toBe('2026-12-25')
    expect(parseCapture('Renew passport 5/1', { today }).dueDate).toBe('2027-01-05')
  })

  it('handles "in N days", "next week", "today", and "tonight"', () => {
    expect(parseCapture('Draft spec in 3 days', { today }).dueDate).toBe('2026-10-19')
    expect(parseCapture('Draft spec in 3 days', { today }).title).toBe('Draft spec')
    expect(parseCapture('Review next week', { today }).dueDate).toBe('2026-10-19')
    expect(parseCapture('Standup today', { today }).dueDate).toBe('2026-10-16')
    expect(parseCapture('Finish slides tonight', { today }).dueDate).toBe('2026-10-16')
  })

  it('maps numeric priorities and leaves plain titles alone', () => {
    expect(parseCapture('Fix prod !1', { today }).priority).toBe('urgent')
    expect(parseCapture('Tidy desk !4', { today }).priority).toBe('low')
    expect(parseCapture('Read a chapter !medium', { today }).priority).toBe('medium')
    const plain = parseCapture('Just a plain title', { today })
    expect(plain).toMatchObject({ kind: 'task', title: 'Just a plain title', tags: [] })
    expect(plain.dueDate).toBeUndefined()
    expect(plain.priority).toBeUndefined()
  })

  it('collects multiple tags and strips dangling prepositions', () => {
    const p = parseCapture('Submit report by tomorrow #work #q4', { today })
    expect(p.tags).toEqual(['work', 'q4'])
    expect(p.title).toBe('Submit report')
  })
})
