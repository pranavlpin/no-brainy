export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned'

export interface BookResponse {
  id: string
  userId: string
  title: string
  author: string | null
  coverUrl: string | null
  genre: string[]
  status: BookStatus
  rating: number | null
  summaryMd: string
  keyIdeas: unknown[]
  quotes: unknown[]
  learningsMd: string
  applicationMd: string
  pagesTotal: number | null
  pagesRead: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBookRequest {
  title: string
  author?: string
  coverUrl?: string
  genre?: string[]
  status?: BookStatus
  pagesTotal?: number
}

export interface UpdateBookRequest {
  title?: string
  author?: string | null
  coverUrl?: string | null
  genre?: string[]
  status?: BookStatus
  rating?: number | null
  summaryMd?: string
  keyIdeas?: unknown[]
  quotes?: unknown[]
  learningsMd?: string
  applicationMd?: string
  pagesTotal?: number | null
  pagesRead?: number
  completedAt?: string | null
}

export interface BookFilters {
  search?: string
  status?: BookStatus | BookStatus[]
  genre?: string[]
  hasRating?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'author' | 'rating'
  sortOrder?: 'asc' | 'desc'
}
