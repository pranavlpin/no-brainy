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
  mainOutcome: string
  availableMinutes: number
  bufferMinutes: number
  workStart: string | null
  workEnd: string | null
  growthTaskId: string | null
  updatedAt: string
  id: string
  userId: string
  planDate: string
  focusTaskIds: string[]
  timeBlocks: TimeBlock[]
  aiBriefMd: string | null
  createdAt: string
}

export interface CreateDayPlanRequest {
  planDate: string
  focusTaskIds?: string[]
  timeBlocks?: TimeBlock[]
}

export interface UpdateDayPlanRequest {
  mainOutcome?: string
  availableMinutes?: number
  bufferMinutes?: number
  workStart?: string | null
  workEnd?: string | null
  growthTaskId?: string | null
  expectedUpdatedAt?: string
  focusTaskIds?: string[]
  timeBlocks?: TimeBlock[]
  aiBriefMd?: string | null
}
