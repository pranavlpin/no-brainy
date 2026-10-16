export interface FocusSessionResponse {
  id: string
  userId: string
  taskId: string | null
  taskTitle: string
  intention: string
  state: 'running' | 'paused' | 'finished'
  startedAt: string
  activeSince: string | null
  accumulatedSeconds: number
  plannedSeconds: number
  completedAt: string | null
  outcome: 'completed' | 'progress' | 'blocked' | null
  reflection: string
  nextAction: string
  nextActionId: string | null
  updatedAt: string
}
export interface FocusSnapshot {
  active: FocusSessionResponse | null
  recent: FocusSessionResponse[]
  serverNow: string
}
export type FocusCommand = {
  id: string
  expectedUpdatedAt: string
  action: 'pause' | 'resume' | 'finish'
  outcome?: 'completed' | 'progress' | 'blocked'
  reflection?: string
  nextAction?: string
}
export type FocusStart = {
  clientRequestId: string
  taskId?: string | null
  plannedSeconds: number
  intention: string
}
