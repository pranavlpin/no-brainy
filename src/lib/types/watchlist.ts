export type WatchlistType = 'movie' | 'show'

export type WatchlistStatus = 'want_to_watch' | 'watching' | 'completed' | 'dropped'

export interface WatchlistItemResponse {
  id: string
  userId: string
  title: string
  type: WatchlistType
  genre: string[]
  tags: string[]
  status: WatchlistStatus
  rating: number | null
  notesMd: string
  coverUrl: string | null
  year: number | null
  platform: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateWatchlistRequest {
  title: string
  type?: WatchlistType
  genre?: string[]
  tags?: string[]
  status?: WatchlistStatus
  rating?: number
  notesMd?: string
  coverUrl?: string
  year?: number
  platform?: string
}

export interface UpdateWatchlistRequest {
  title?: string
  type?: WatchlistType
  genre?: string[]
  tags?: string[]
  status?: WatchlistStatus
  rating?: number | null
  notesMd?: string
  coverUrl?: string | null
  year?: number | null
  platform?: string | null
}

export interface WatchlistFilters {
  search?: string
  type?: WatchlistType
  status?: WatchlistStatus
  genre?: string[]
  tags?: string[]
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'rating' | 'year'
  sortOrder?: 'asc' | 'desc'
}
