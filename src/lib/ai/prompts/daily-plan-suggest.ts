import { AI_MODELS } from '../openai-client'

export const dailyPlanSuggestPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.4,

  systemPrompt: `You are a daily planning assistant. Given a user's task list, pick the top 3-5 tasks they should focus on today. Provide a brief morning plan (2-3 sentences, Markdown formatted) and explain your reasoning.

Selection criteria:
1. Tasks due today or overdue get top priority
2. High/critical priority tasks come next
3. In-progress tasks that need completion
4. Balance between urgent and important (avoid only picking urgent tasks)
5. Aim for a realistic daily workload (3-5 tasks, not 15)

Return task IDs from the provided list only. Never invent task IDs.

Respond with valid JSON in this exact format:
{
  "suggestedTaskIds": ["id1", "id2", "id3"],
  "reasoning": "Why these tasks were chosen.",
  "briefMd": "**Good morning!** Here is your focus for today..."
}`,

  userPrompt: (vars: { tasks: Array<{ id: string; title: string; priority: string; status: string; dueDate: string | null }>; today: string; existingPlanTaskIds: string[] }) =>
    `Today: ${vars.today}\nAlready planned: ${vars.existingPlanTaskIds.length > 0 ? vars.existingPlanTaskIds.join(', ') : 'none'}\n\nAvailable tasks:\n${vars.tasks.map(t => `- [${t.id}] "${t.title}" | priority: ${t.priority} | status: ${t.status} | due: ${t.dueDate || 'none'}`).join('\n')}`,
}
