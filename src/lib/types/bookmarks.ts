export interface BookmarkResponse {
  id: string
  userId: string
  title: string
  url: string
  description: string | null
  tags: string[]
  favicon: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBookmarkRequest {
  title: string
  url: string
  description?: string
  tags?: string[]
  favicon?: string
}

export interface UpdateBookmarkRequest {
  title?: string
  url?: string
  description?: string | null
  tags?: string[]
  favicon?: string | null
  isPinned?: boolean
}

export interface BookmarkFilters {
  search?: string
  tags?: string[]
  isPinned?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}
