export type FocusKind = 'work' | 'break'

/** How a work session ended. Only `completed` finishes the linked task. */
export type FocusOutcome = 'completed' | 'progress' | 'blocked'

export interface FocusSessionResponse {
  id: string
  userId: string
  taskId: string | null
  kind: FocusKind
  startedAt: string
  endedAt: string | null
  durationSec: number
  completed: boolean
  intention: string
  outcome: FocusOutcome | null
  reflection: string
  nextAction: string | null
  nextActionTaskId: string | null
}

export interface FinishSessionInput {
  outcome: FocusOutcome
  reflection?: string
  nextAction?: string
}

export interface FocusDayResponse {
  date: string
  sessions: FocusSessionResponse[]
  /** Minutes of finished work sessions on that local day. */
  totalWorkMinutes: number
  pomodorosCompleted: number
}
