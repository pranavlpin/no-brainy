import { addDays, dateFromKey, isValidDateKey, relativeDayLabel } from '@/lib/dates'
import type { TaskPriority } from '@/lib/types/tasks'

export type CaptureKind = 'task' | 'note' | 'inbox'

export interface CaptureGoal {
  id: string
  title: string
}

export interface ParsedCapture {
  kind: CaptureKind
  title: string
  /**
   * `YYYY-MM-DD` when a date phrase was found. A plain date ("tomorrow",
   * "on friday") is the day you plan to do it; "by", "before", "until" or
   * "due" make it a deadline instead.
   */
  plannedDate?: string
  dueDate?: string
  /** Human label for the chip, e.g. "Tomorrow" or "Fri, 23 Oct". */
  dateLabel?: string
  tags: string[]
  priority?: TaskPriority
  goalId?: string
  goalTitle?: string
  /** `@text` that matched no goal; shown as a hint. */
  goalQuery?: string
}

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}

const PRIORITIES: Record<string, TaskPriority> = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  med: 'medium',
  low: 'low',
  '1': 'urgent',
  '2': 'high',
  '3': 'medium',
  '4': 'low',
}

const DANGLING = new Set(['on', 'by', 'at', 'due', 'until', 'till', 'before', 'for'])
/** Prepositions that turn a date into a deadline rather than a planned day. */
const DEADLINE_WORDS = new Set(['by', 'due', 'until', 'till', 'before'])

function nextWeekday(today: string, target: number): string {
  const dow = dateFromKey(today).getUTCDay()
  const delta = (target - dow + 7) % 7 || 7
  return addDays(today, delta)
}

function dayMonth(today: string, d: number, m: number, y?: number): string | undefined {
  const year = y ?? Number(today.slice(0, 4))
  const key = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  if (!isValidDateKey(key)) return undefined
  if (y === undefined && key < today) {
    const nextYear = `${year + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return isValidDateKey(nextYear) ? nextYear : key
  }
  return key
}

/**
 * Try to read a date phrase starting at `i`. Returns the key and how many
 * words were consumed, or null.
 */
function readDate(words: string[], i: number, today: string): { key: string; used: number } | null {
  const w = words[i].toLowerCase()
  const next = words[i + 1]?.toLowerCase()

  if (w === 'today' || w === 'tonight') return { key: today, used: 1 }
  if (w === 'tomorrow' || w === 'tmrw' || w === 'tmr') return { key: addDays(today, 1), used: 1 }
  if (w === 'yesterday') return { key: addDays(today, -1), used: 1 }
  if (w in WEEKDAYS) return { key: nextWeekday(today, WEEKDAYS[w]), used: 1 }

  if (w === 'next' && next) {
    if (next === 'week') return { key: nextWeekday(today, 1), used: 2 }
    if (next in WEEKDAYS) return { key: nextWeekday(today, WEEKDAYS[next]), used: 2 }
    if (next === 'month') {
      const d = dateFromKey(today)
      d.setUTCMonth(d.getUTCMonth() + 1, 1)
      return { key: d.toISOString().slice(0, 10), used: 2 }
    }
  }

  if (w === 'in' && next && /^\d+$/.test(next)) {
    const unit = words[i + 2]?.toLowerCase()
    const n = Number(next)
    if (unit && /^days?$/.test(unit)) return { key: addDays(today, n), used: 3 }
    if (unit && /^weeks?$/.test(unit)) return { key: addDays(today, n * 7), used: 3 }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(w) && isValidDateKey(w)) return { key: w, used: 1 }

  const dm = /^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}))?$/.exec(w)
  if (dm) {
    const key = dayMonth(today, Number(dm[1]), Number(dm[2]), dm[3] ? Number(dm[3]) : undefined)
    if (key) return { key, used: 1 }
  }

  return null
}

/**
 * Parse a capture line such as `Call bank tomorrow #finance !high @Fitness`.
 * Pure and deterministic; `today` must be the user's local date key.
 */
export function parseCapture(
  raw: string,
  opts: { today: string; goals?: CaptureGoal[] }
): ParsedCapture {
  let text = raw.trim().replace(/\s+/g, ' ')
  let kind: CaptureKind = 'task'
  const prefix = /^(note|task|inbox)\s*:\s*/i.exec(text)
  if (prefix) {
    kind = prefix[1].toLowerCase() as CaptureKind
    text = text.slice(prefix[0].length)
  }
  // Inbox keeps the raw thought verbatim; nothing is parsed out of it.
  if (kind === 'inbox') return { kind, title: text.trim(), tags: [] }

  const words = text.split(' ').filter(Boolean)
  const keep: (string | null)[] = [...words]
  const tags: string[] = []
  let priority: TaskPriority | undefined
  let dateKey: string | undefined
  let deadline = false
  let goalId: string | undefined
  let goalTitle: string | undefined
  let goalQuery: string | undefined
  const goals = opts.goals ?? []

  for (let i = 0; i < words.length; i++) {
    if (keep[i] === null) continue
    const w = words[i]

    const tag = /^#([\w-]+)$/.exec(w)
    if (tag) {
      tags.push(tag[1].toLowerCase())
      keep[i] = null
      continue
    }

    const pri = /^!([a-z]+|[1-4])$/i.exec(w)
    if (pri && PRIORITIES[pri[1].toLowerCase()]) {
      priority = PRIORITIES[pri[1].toLowerCase()]
      keep[i] = null
      continue
    }

    if (w.startsWith('@') && w.length > 1) {
      const rest = words.slice(i).join(' ').slice(1).toLowerCase()
      const word = w.slice(1).toLowerCase()
      // Prefer the longest goal title spelled out in full after the @, then
      // fall back to a goal whose title starts with the single @word.
      const full = goals
        .filter((g) => rest.startsWith(g.title.toLowerCase()))
        .sort((a, b) => b.title.length - a.title.length)[0]
      const partial = full
        ? undefined
        : goals
            .filter((g) => g.title.toLowerCase().startsWith(word))
            .sort((a, b) => a.title.length - b.title.length)[0]
      const match = full ?? partial
      if (match) {
        goalId = match.id
        goalTitle = match.title
        const used = full ? match.title.split(/\s+/).length : 1
        for (let k = i; k < i + used && k < words.length; k++) keep[k] = null
        i += used - 1
      } else {
        goalQuery = w.slice(1)
        keep[i] = null
      }
      continue
    }

    if (dateKey === undefined) {
      const date = readDate(words, i, opts.today)
      if (date) {
        dateKey = date.key
        for (let k = i; k < i + date.used; k++) keep[k] = null
        // Drop a dangling preposition right before the date phrase; a
        // deadline word makes this a due date instead of a planned day.
        let p = i - 1
        while (p >= 0 && keep[p] === null) p--
        if (p >= 0 && DANGLING.has(words[p].toLowerCase())) {
          deadline = DEADLINE_WORDS.has(words[p].toLowerCase())
          keep[p] = null
        }
        i += date.used - 1
        continue
      }
    }
  }

  const title = keep
    .filter((w): w is string => w !== null)
    .join(' ')
    .trim()

  const parsed: ParsedCapture = { kind, title, tags }
  if (dateKey) {
    if (deadline) parsed.dueDate = dateKey
    else parsed.plannedDate = dateKey
    parsed.dateLabel = relativeDayLabel(dateKey, opts.today)
  }
  if (priority) parsed.priority = priority
  if (goalId) {
    parsed.goalId = goalId
    parsed.goalTitle = goalTitle
  }
  if (goalQuery) parsed.goalQuery = goalQuery
  return parsed
}
