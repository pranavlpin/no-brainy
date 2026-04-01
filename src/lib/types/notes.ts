export interface NoteResponse {
  id: string
  userId: string
  title: string
  contentMd: string
  tags: string[]
  isPinned: boolean
  isDeleted: boolean
  deletedAt: string | null
  wordCount: number
  createdAt: string
  updatedAt: string
  noteLinks?: NoteLinkResponse[]
  linkedFrom?: NoteLinkResponse[]
}

export interface NoteLinkResponse {
  id: string
  sourceId: string
  targetType: string
  targetId: string
  createdAt: string
}

export interface CreateNoteRequest {
  title?: string
  contentMd?: string
  tags?: string[]
  isPinned?: boolean
}

export interface UpdateNoteRequest {
  title?: string
  contentMd?: string
  tags?: string[]
  isPinned?: boolean
  isDeleted?: boolean
}

export interface NoteFilters {
  search?: string
  tags?: string[]
  isPinned?: boolean
  isDeleted?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'wordCount'
  sortOrder?: 'asc' | 'desc'
}
