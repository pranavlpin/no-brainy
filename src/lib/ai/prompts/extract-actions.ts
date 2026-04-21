import { AI_MODELS } from '../openai-client'

export const extractActionsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.3,

  systemPrompt: `You are NoBrainy Action Extractor. Given text content, identify concrete actionable tasks the user should do.

Rules:
- Extract 2-8 specific, actionable tasks.
- Each task title should start with a verb (e.g., "Research...", "Set up...", "Practice...").
- Assign priority based on urgency/importance implied by the content. Use: urgent, high, medium, or low.
- Provide a brief reason for why each task was extracted.

Return JSON: { "tasks": [{ "title": "...", "priority": "medium", "reason": "..." }] }`,

  userPrompt: (content: string) =>
    `Extract actionable tasks from this content:\n\n${content}`,
}
