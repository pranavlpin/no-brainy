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
  createdAt: string
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
}
