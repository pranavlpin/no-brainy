/**
 * Realistic-day arithmetic for the planner.
 *
 * Ported from the owner's acceptance branch (`test/product-final-acceptance`,
 * NB-07). Each task counts once (the larger of its estimate and the time
 * blocked for it), unknown estimates stay unknown instead of becoming zero,
 * buffer and unlinked blocks count as planned, overlaps are surfaced, and the
 * working window caps what the day can hold.
 */
import type { TimeBlock } from '@/lib/types/planner'

export interface CapacityTask {
  id: string
  estimatedMinutes?: number | null
}

export interface CapacityInput {
  tasks: CapacityTask[]
  blocks: TimeBlock[]
  availableMinutes: number
  bufferMinutes: number
  workStart?: string | null
  workEnd?: string | null
}

export interface CapacityResult {
  plannedMinutes: number
  availableMinutes: number
  unknownTaskIds: string[]
  overBy: number
  overlaps: string[]
  fits: boolean
}

/** Local `HH:mm` label to minutes after midnight; no timezone conversion. */
export const timeMinutes = (value: string): number =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))

export function planCapacity(input: CapacityInput): CapacityResult {
  const tasks = new Map(input.tasks.map((task) => [task.id, task]))
  const blocksByTask = new Map<string, number>()
  let unlinkedMinutes = 0
  const overlaps = new Set<string>()

  for (const [index, block] of input.blocks.entries()) {
    const length = Math.max(0, timeMinutes(block.endTime) - timeMinutes(block.startTime))
    if (block.taskId) blocksByTask.set(block.taskId, (blocksByTask.get(block.taskId) ?? 0) + length)
    else unlinkedMinutes += length
    for (const other of input.blocks.slice(index + 1)) {
      if (block.startTime < other.endTime && other.startTime < block.endTime) {
        overlaps.add(block.id)
        overlaps.add(other.id)
      }
    }
  }

  let plannedMinutes = input.bufferMinutes + unlinkedMinutes
  const unknownTaskIds: string[] = []
  for (const id of new Set([...tasks.keys(), ...blocksByTask.keys()])) {
    const estimate = tasks.get(id)?.estimatedMinutes
    const blocked = blocksByTask.get(id) ?? 0
    if (estimate == null && !blocked) unknownTaskIds.push(id)
    plannedMinutes += Math.max(estimate ?? 0, blocked)
  }

  const window =
    input.workStart && input.workEnd
      ? Math.max(0, timeMinutes(input.workEnd) - timeMinutes(input.workStart))
      : 1440
  const availableMinutes = Math.min(input.availableMinutes, window)
  const overBy = Math.max(0, plannedMinutes - availableMinutes)

  return {
    plannedMinutes,
    availableMinutes,
    unknownTaskIds,
    overBy,
    overlaps: [...overlaps],
    fits: !overBy && !unknownTaskIds.length && !overlaps.size,
  }
}

/** Minutes as a compact label: 45m, 1h, 1h 30m. */
export function formatMinutes(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes))
  if (whole < 60) return `${whole}m`
  const h = Math.floor(whole / 60)
  const m = whole % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * Pick the tasks to move so the day fits: lowest priority first, then the
 * longest, until the remaining planned minutes are within capacity. Tasks
 * without an estimate are never moved automatically.
 */
export function tasksToMoveForSmallerDay(
  tasks: {
    id: string
    estimatedMinutes: number | null
    priorityRank: number
    protected?: boolean
  }[],
  overBy: number
): string[] {
  if (overBy <= 0) return []
  const candidates = tasks
    .filter((t) => !t.protected && t.estimatedMinutes != null && t.estimatedMinutes > 0)
    .sort((a, b) => b.priorityRank - a.priorityRank || b.estimatedMinutes! - a.estimatedMinutes!)
  const moved: string[] = []
  let remaining = overBy
  for (const t of candidates) {
    if (remaining <= 0) break
    moved.push(t.id)
    remaining -= t.estimatedMinutes!
  }
  return moved
}
