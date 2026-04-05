import { AI_MODELS } from '../openai-client'

export const noteSummarizePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 512,
  temperature: 0.3,

  systemPrompt: `You are a concise note summarizer. Given a note's title and content, produce a summary as 3-5 bullet points. Each bullet should be one clear sentence capturing a key point. Focus on actionable information and main ideas. Do not include filler or meta-commentary.

Respond with valid JSON in this exact format:
{
  "bullets": ["First key point.", "Second key point.", "Third key point."]
}`,

  userPrompt: (vars: { title: string; content: string }) =>
    `Note title: ${vars.title}\n\nNote content:\n${vars.content}`,
}
