export type EvidenceKind = 'reflection' | 'practice' | 'rest' | 'skip'
export type GrowthSourceType = 'note' | 'book' | 'project' | 'session'

export interface EvidenceResponse {
  id: string
  goalId: string
  /** Calendar key of the observation. */
  observedAt: string
  summary: string
  measurement: number | null
  kind: EvidenceKind
  sourceType: GrowthSourceType | null
  sourceId: string | null
  sourceTitle: string | null
  sourceHref: string | null
  createdAt: string
  updatedAt: string
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

export interface GrowthSourceItem {
  id: string
  title: string
  /** For sessions: the local day it ended, so practice dates line up. */
  observedAt?: string
}
