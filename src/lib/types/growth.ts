import type { GoalResponse } from './goals'
export type EvidenceKind = 'reflection' | 'practice' | 'rest' | 'skip'
export type GrowthSourceType = 'note' | 'book' | 'project' | 'session'
export interface EvidenceResponse {
  id: string
  goalId: string
  observedAt: string
  summary: string
  measurement: number | null
  kind: EvidenceKind
  sourceType: GrowthSourceType | null
  sourceId: string | null
  sourceTitle: string | null
  sourceHref: string | null
  practiceKey: string | null
  updatedAt: string
  createdAt: string
}
export interface EvidenceInput {
  clientRequestId: string
  goalId: string
  observedAt: string
  summary: string
  measurement?: number | null
  kind: EvidenceKind
  sourceType?: GrowthSourceType | null
  sourceId?: string | null
}
export interface EvidenceEdit {
  expectedUpdatedAt: string
  observedAt?: string
  summary?: string
  measurement?: number | null
  kind?: EvidenceKind
}
export interface GrowthGoal extends GoalResponse {
  practiceCount: number
  needsPractice: boolean
  evidenceCount: number
  projects: { id: string; title: string; status: string }[]
  notes: { id: string; title: string }[]
}
export interface GrowthOverview {
  today: string
  timezone: string
  weekStart: string
  weekEnd: string
  goals: GrowthGoal[]
  dueLearning: number
}
export interface GrowthActionInput {
  clientRequestId: string
  title: string
  goalId?: string | null
  description?: string
  plannedDate?: string | null
  estimatedMinutes?: number | null
  rrule?: 'FREQ=DAILY' | 'FREQ=WEEKLY' | 'FREQ=MONTHLY' | null
  sourceType?: 'book' | 'note' | null
  sourceId?: string | null
}
