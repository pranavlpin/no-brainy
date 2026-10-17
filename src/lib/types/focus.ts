export type FocusKind = 'work' | 'break'

export interface FocusSessionResponse {
  id: string
  userId: string
  taskId: string | null
  kind: FocusKind
  startedAt: string
  endedAt: string | null
  durationSec: number
  completed: boolean
}

export interface FocusDayResponse {
  date: string
  sessions: FocusSessionResponse[]
  /** Minutes of finished work sessions on that local day. */
  totalWorkMinutes: number
  pomodorosCompleted: number
}
