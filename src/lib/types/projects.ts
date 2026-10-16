import type { TaskResponse } from './tasks'
import type { NoteResponse } from './notes'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export interface ProjectResponse {
  id: string
  userId: string
  title: string
  outcome: string
  context: 'work' | 'personal'
  status: ProjectStatus
  goalId: string | null
  nextActionId: string | null
  nextAction: TaskResponse | null
  tasks: TaskResponse[]
  notes: NoteResponse[]
  taskCount: number
  completedTaskCount: number
  createdAt: string
  updatedAt: string
}
export interface ProjectInput {
  title: string
  outcome?: string
  context?: 'work' | 'personal'
  status?: ProjectStatus
  goalId?: string | null
}
export interface ProjectUpdate extends Partial<ProjectInput> {
  nextActionId?: string | null
  noteIds?: string[]
  expectedUpdatedAt?: string
}
