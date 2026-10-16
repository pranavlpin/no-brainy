import { describe, expect, it } from 'vitest'
import { BACKUP_MAX_BYTES, parseBackup } from '@/lib/validations/backup'
import { remapBackup } from '@/lib/data/backup'

const empty = (): Record<string, unknown[]> => ({
  captures: [],
  goals: [],
  projects: [],
  notes: [],
  tasks: [],
  taskLinks: [],
  projectNotes: [],
  noteLinks: [],
  dayPlans: [],
  dailyReviews: [],
  weeklyReviews: [],
  focusSessions: [],
  growthEvidence: [],
})

const envelope = (data: Record<string, unknown[]> = {}) => ({
  version: 1,
  scope: 'nobrainy-core',
  exportedAt: '2026-10-16T10:00:00.000Z',
  omittedLinks: 0,
  data: { ...empty(), ...data },
})

const stamps = { createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z' }
const task = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  ...stamps,
  title: `Task ${id}`,
  descriptionMd: '',
  parentTaskId: null,
  projectId: null,
  goalId: null,
  plannedDate: null,
  dueDate: null,
  estimatedMinutes: null,
  effort: null,
  context: null,
  priority: 'medium',
  status: 'pending',
  tags: [],
  completedAt: null,
  isRecurring: false,
  rrule: null,
  quadrant: null,
  orderIndex: 0,
  ...over,
})

describe('core backup format', () => {
  it('carries a version and refuses unknown versions', () => {
    expect(parseBackup(envelope()).version).toBe(1)
    expect(() => parseBackup({ ...envelope(), version: 2 })).toThrow()
  })

  it('never accepts credentials, share tokens, or owner ids inside rows', () => {
    const note = {
      id: 'n1',
      ...stamps,
      title: 'Private',
      contentMd: '',
      tags: [],
      isPinned: false,
      isDeleted: false,
      deletedAt: null,
      wordCount: 0,
    }
    expect(parseBackup(envelope({ notes: [note] })).data.notes).toHaveLength(1)
    expect(() => parseBackup(envelope({ notes: [{ ...note, shareId: 'abc' }] }))).toThrow()
    expect(() => parseBackup(envelope({ notes: [{ ...note, userId: 'u1' }] }))).toThrow()
    expect(() => parseBackup(envelope({ notes: [{ ...note, apiKey: 'sk-x' }] }))).toThrow()
  })

  it('rejects dangling references and oversized payloads', () => {
    expect(() => parseBackup(envelope({ tasks: [task('t1', { goalId: 'missing' })] }))).toThrow(
      /goals/
    )
    expect(() => parseBackup(envelope({ tasks: [task('t1'), task('t1')] }))).toThrow(/Duplicate/)
    const huge = envelope({ notes: [] })
    const raw = JSON.stringify(huge).replace(
      '"notes":[]',
      `"notes":[],"pad":"${'x'.repeat(BACKUP_MAX_BYTES)}"`
    )
    expect(() => parseBackup(raw)).toThrow(/too large/i)
  })

  it('remaps every id additively and keeps references consistent', () => {
    const backup = parseBackup(
      envelope({
        goals: [
          {
            id: 'g1',
            ...stamps,
            title: 'Run',
            description: '',
            category: null,
            targetDate: null,
            startDate: null,
            expenseTag: null,
            targetAmount: null,
            status: 'active',
            successCriteria: '',
            baseline: null,
            target: null,
            unit: null,
            weeklyPracticeTarget: null,
          },
        ],
        tasks: [task('t1', { goalId: 'g1' }), task('t2', { parentTaskId: 't1', goalId: 'g1' })],
      })
    )
    let n = 0
    const remapped = remapBackup(backup, () => `new${++n}`)
    const ids = new Set([...remapped.data.goals, ...remapped.data.tasks].map((r) => r.id))
    expect(ids.has('g1')).toBe(false)
    expect(ids.has('t1')).toBe(false)
    const [t1, t2] = remapped.data.tasks
    expect(t1.goalId).toBe(remapped.data.goals[0].id)
    expect(t2.parentTaskId).toBe(t1.id)
    expect(remapped.data.tasks.map((t) => t.id)).toEqual(['new2', 'new3'])
  })
})
