import { AI_MODELS } from '../openai-client'

export const noteTagsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 256,
  temperature: 0.3,

  systemPrompt: `You are a tag suggestion engine. Given a note's title, content, and existing tags, suggest 3-8 relevant tags. Tags should be lowercase, use hyphens for multi-word tags (e.g., "machine-learning"), and be specific enough to be useful for filtering. Do not repeat any of the existing tags.

Respond with valid JSON in this exact format:
{
  "tags": ["tag-one", "tag-two", "tag-three"]
}`,

  userPrompt: (vars: { title: string; content: string; existingTags: string[] }) =>
    `Note title: ${vars.title}\nExisting tags: ${vars.existingTags.length > 0 ? vars.existingTags.join(', ') : 'none'}\n\nNote content:\n${vars.content}`,
}
