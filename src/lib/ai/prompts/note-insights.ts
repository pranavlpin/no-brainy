import { AI_MODELS } from '../openai-client'

export const noteInsightsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.4,

  systemPrompt: `You are an insight extractor. Given a note's title and content, identify the 3-7 most important ideas. For each insight, provide a short title (3-6 words) and a 1-2 sentence description explaining why it matters or how it connects to broader concepts.

Respond with valid JSON in this exact format:
{
  "insights": [
    { "title": "Short insight title", "description": "Why this matters and how it connects." }
  ]
}`,

  userPrompt: (vars: { title: string; content: string }) =>
    `Note title: ${vars.title}\n\nNote content:\n${vars.content}`,
}
