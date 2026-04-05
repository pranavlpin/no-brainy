import { createOpenAIClient, type AIModel } from './openai-client'
import type { AIActionResponse } from './types'

interface CallAIOptions {
  apiKey: string
  model: AIModel
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  responseFormat?: 'json'
}

/**
 * Single function for all non-streaming AI calls.
 * Handles client creation, API call, JSON parsing, and error mapping.
 */
export async function callAI<T>(options: CallAIOptions): Promise<AIActionResponse<T>> {
  const client = createOpenAIClient(options.apiKey)

  const response = await client.chat.completions.create({
    model: options.model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ],
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    response_format: options.responseFormat === 'json'
      ? { type: 'json_object' }
      : undefined,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new AIError('Empty response from AI model', 'AI_EMPTY_RESPONSE')
  }

  const parsed = options.responseFormat === 'json'
    ? JSON.parse(content) as T
    : content as unknown as T

  return {
    success: true,
    data: parsed,
    model: options.model,
    tokensUsed: response.usage?.total_tokens,
  }
}

export class AIError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'AIError'
  }
}
