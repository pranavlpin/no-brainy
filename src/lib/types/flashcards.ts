export type CardType = 'basic' | 'cloze' | 'reverse'

export type FlashcardState = 'new' | 'learning' | 'review' | 'relearning' | 'mastered'

export type ReviewRating = 'forgot' | 'hard' | 'medium' | 'easy'

export interface DeckResponse {
  id: string
  userId: string
  name: string
  descriptionMd: string
  tags: string[]
  createdAt: string
  updatedAt: string
  flashcardCount?: number
  dueCount?: number
  newCount?: number
}

export interface FlashcardResponse {
  id: string
  deckId: string
  userId: string
  cardType: CardType
  frontMd: string
  backMd: string
  tags: string[]
  sourceType: string | null
  sourceId: string | null
  sourceExcerpt: string | null
  state: FlashcardState
  easeFactor: number
  interval: number
  nextReviewAt: string
  reviewCount: number
  lastRating: ReviewRating | null
  createdAt: string
  updatedAt: string
}

export interface CreateDeckRequest {
  name: string
  descriptionMd?: string
  tags?: string[]
}

export interface UpdateDeckRequest {
  name?: string
  descriptionMd?: string
  tags?: string[]
}

export interface CreateFlashcardRequest {
  deckId: string
  cardType: CardType
  frontMd: string
  backMd: string
  tags?: string[]
  sourceType?: string
  sourceId?: string
  sourceExcerpt?: string
}

export interface UpdateFlashcardRequest {
  cardType?: CardType
  frontMd?: string
  backMd?: string
  tags?: string[]
  deckId?: string
}

export interface ReviewFlashcardRequest {
  rating: ReviewRating
}

export interface ReviewSessionResponse {
  id: string
  userId: string
  deckId: string | null
  startedAt: string
  completedAt: string | null
  cardsReviewed: number
  cardsEasy: number
  cardsMedium: number
  cardsHard: number
  cardsForgot: number
}
