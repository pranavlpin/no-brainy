export type SearchEntityType = 'note' | 'task' | 'book' | 'flashcard' | 'deck' | 'goal' | 'habit'

export interface SearchRequest {
  query: string
  entityTypes?: SearchEntityType[]
  tags?: string[]
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: string
  entityType: SearchEntityType
  title: string
  excerpt: string
  tags: string[]
  score: number
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  highlights?: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  entityTypes: SearchEntityType[]
}
