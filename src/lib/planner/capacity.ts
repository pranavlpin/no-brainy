import type { TimeBlock } from '@/lib/types/planner'
export interface CapacityInput {
  tasks: { id: string; estimatedMinutes?: number | null }[]
  blocks: TimeBlock[]
  availableMinutes: number
  bufferMinutes: number
  workStart?: string | null
  workEnd?: string | null
}
/** Convert a validated local HH:mm label to minutes after midnight; no timezone conversion. */
export const timeMinutes = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))

/** Count each task once, retain unknown estimates and warn without silently moving commitments. */
export function planCapacity(input: CapacityInput) {
  const tasks = new Map(input.tasks.map((task) => [task.id, task]))
  const blocksByTask = new Map<string, number>()
  let unlinkedMinutes = 0
  const overlaps = new Set<string>()
  for (const [index, block] of input.blocks.entries()) {
    const length = Math.max(0, timeMinutes(block.endTime) - timeMinutes(block.startTime))
    if (block.taskId) blocksByTask.set(block.taskId, (blocksByTask.get(block.taskId) ?? 0) + length)
    else unlinkedMinutes += length
    for (const other of input.blocks.slice(index + 1))
      if (block.startTime < other.endTime && other.startTime < block.endTime) {
        overlaps.add(block.id)
        overlaps.add(other.id)
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
