// All AI endpoints return this envelope
export interface AIActionResponse<T> {
  success: true
  data: T
  model: string        // which model was used
  tokensUsed?: number  // optional: total_tokens from usage
}

// Note AI
export interface NoteSummary {
  bullets: string[]   // 3-5 bullet points
}

export interface NoteInsights {
  insights: Array<{
    title: string      // short label
    description: string // 1-2 sentence explanation
  }>
}

export interface TagSuggestions {
  tags: string[]       // 3-8 suggested tags
}

// Flashcard AI
export interface GeneratedFlashcard {
  cardType: 'qa' | 'cloze' | 'definition'
  frontMd: string
  backMd: string
  sourceExcerpt?: string
}

export interface FlashcardGenerationResult {
  cards: GeneratedFlashcard[]
  sourceType: 'note' | 'book'
  sourceId: string
}

// Task AI
export interface PrioritySuggestion {
  taskId: string
  taskTitle?: string
  currentPriority: string
  suggestedPriority: string
  reason: string
}

export interface TaskPrioritizationResult {
  suggestions: PrioritySuggestion[]
  reasoning: string   // overall explanation
}

// Daily Plan AI
export interface DailyPlanSuggestion {
  suggestedTaskIds: string[]
  reasoning: string
  briefMd: string     // markdown morning brief
}

// Review AI
export interface ReviewSummary {
  summaryMd: string   // natural language recap
}

// Coach AI (streamed -- individual messages, not a typed response)
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}
