import OpenAI from 'openai'

/**
 * Creates a per-request OpenAI client using the user's decrypted API key.
 * Never cache this -- a new instance per request ensures key isolation.
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey })
}

export type AIModel = 'gpt-4o-mini' | 'gpt-4o'

export const AI_MODELS = {
  FAST: 'gpt-4o-mini' as const,   // summarization, generation, prioritization
  SMART: 'gpt-4o' as const,        // coach, complex reasoning
}
