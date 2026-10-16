import type { TaskResponse } from './tasks'

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type ProjectContext = 'work' | 'personal'

export interface ProjectNoteSummary {
  id: string
  title: string
  updatedAt: string
}

export interface ProjectResponse {
  id: string
  userId: string
  title: string
  outcome: string
  context: ProjectContext
  status: ProjectStatus
  goalId: string | null
  nextActionId: string | null
  /** The chosen next action while it is still open; null once done. */
  nextAction: TaskResponse | null
  tasks: TaskResponse[]
  notes: ProjectNoteSummary[]
  taskCount: number
  completedTaskCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectInput {
  title: string
  outcome?: string
  context?: ProjectContext
  status?: ProjectStatus
  goalId?: string | null
}

export interface ProjectUpdate extends Partial<ProjectInput> {
  nextActionId?: string | null
  noteIds?: string[]
  expectedUpdatedAt?: string
}

export interface ProjectFilters {
  status?: ProjectStatus | 'all'
  context?: ProjectContext | 'all'
  search?: string
}
