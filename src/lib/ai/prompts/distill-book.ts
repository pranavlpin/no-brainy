import { AI_MODELS } from '../openai-client'

export interface DistillBookInput {
  title: string
  author: string | null
  summaryMd: string
  keyIdeas: unknown[]
  quotes: unknown[]
  learningsMd: string
  applicationMd: string
}

export const distillBookPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 2048,
  temperature: 0.3,

  systemPrompt: `You are NoBrainy Knowledge Distiller. Convert book summaries into well-structured Markdown notes.

Format the note with:
- # Title (book title + "Notes")
- ## Key Takeaways (numbered list of most important ideas)
- ## Notable Quotes (blockquotes with attribution)
- ## Personal Applications (actionable items from learnings)
- ## Connections (how this relates to other knowledge areas)

Return JSON: { "title": "...", "contentMd": "...", "suggestedTags": [...] }`,

  userPrompt: (book: DistillBookInput) =>
    `Convert this book into a structured note:\n\nTitle: ${book.title}\nAuthor: ${book.author ?? 'Unknown'}\nSummary: ${book.summaryMd}\nKey Ideas: ${JSON.stringify(book.keyIdeas)}\nQuotes: ${JSON.stringify(book.quotes)}\nLearnings: ${book.learningsMd}\nApplications: ${book.applicationMd}`,
}
