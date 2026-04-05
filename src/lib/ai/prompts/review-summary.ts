import { AI_MODELS } from '../openai-client'

export const reviewSummaryPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 512,
  temperature: 0.5,

  systemPrompt: `You are a productivity coach writing a brief end-of-day summary. Given the user's daily metrics and optional reflection, write a natural language recap in 3-5 sentences. Be encouraging but honest. Use Markdown formatting.

Tone: supportive, concise, action-oriented. Mention specific numbers. If the user wrote a reflection, reference their own words. End with one forward-looking sentence about tomorrow.

Respond with valid JSON in this exact format:
{
  "summaryMd": "Your markdown summary here..."
}`,

  userPrompt: (vars: {
    date: string
    tasksCompleted: number
    tasksMissed: number
    notesCreated: number
    cardsReviewed: number
    reflection: string | null
    mood: string | null
  }) =>
    `Date: ${vars.date}\nTasks completed: ${vars.tasksCompleted}\nTasks missed: ${vars.tasksMissed}\nNotes created: ${vars.notesCreated}\nFlashcards reviewed: ${vars.cardsReviewed}\nMood: ${vars.mood || 'not set'}\nUser reflection: ${vars.reflection || 'No reflection written.'}`,
}
