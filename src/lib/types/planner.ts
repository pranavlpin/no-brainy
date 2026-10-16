export interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  title: string
  taskId?: string
  color?: string
  isCompleted: boolean
}

export interface DayPlanResponse {
  id: string
  userId: string
  planDate: string
  focusTaskIds: string[]
  timeBlocks: TimeBlock[]
  aiBriefMd: string | null
  /** The one line this day is about; seeded from the previous evening's review. */
  intentMd: string | null
  /** Minutes realistically available for planned work. */
  availableMinutes: number
  /** Slack reserved for the unexpected; counted as planned. */
  bufferMinutes: number
  /** Optional working window as local HH:mm labels. */
  workStart: string | null
  workEnd: string | null
  createdAt: string
}

export interface CapacitySettings {
  availableMinutes: number
  bufferMinutes: number
  workStart: string | null
  workEnd: string | null
}

/** Minimal goal shape for chips in the planner and home. */
export interface PlannerGoal {
  id: string
  title: string
  category: string | null
}

export type TriageAction = 'keep' | 'move' | 'drop'

export interface TriageRequest {
  taskId: string
  action: TriageAction
  /** Required when action is `move`; a `YYYY-MM-DD` key after today. */
  date?: string
}

export interface CreateDayPlanRequest {
  planDate: string
  focusTaskIds?: string[]
  timeBlocks?: TimeBlock[]
}

export interface UpdateDayPlanRequest {
  focusTaskIds?: string[]
  timeBlocks?: TimeBlock[]
  aiBriefMd?: string | null
  intentMd?: string | null
  availableMinutes?: number
  bufferMinutes?: number
  workStart?: string | null
  workEnd?: string | null
}
