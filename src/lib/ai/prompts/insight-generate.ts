import { AI_MODELS } from '../openai-client'
import type { UserDataSummary } from '../insights/aggregate-user-data'

export const insightGeneratePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 2048,
  temperature: 0.4,

  systemPrompt: `You are NoBrainy Insight Engine. Analyze the user's productivity and financial data and generate actionable insights.

Rules:
- Generate 3-7 insights based on the data provided.
- Each insight must have: insightType, contentMd (1-2 sentences, Markdown OK), severity (info|warning|positive), relatedEntity (task|note|flashcard|habit|expense|null).
- Only generate insights where the data supports them. Do not fabricate patterns.
- Be specific: reference actual numbers, task names, category names, or amounts from the data.
- severity "positive" for streaks, savings, and good patterns, "warning" for overspending or problems, "info" for neutral observations.
- insightType must be one of: procrastination, workload, priority, streak, gap, time, topic, spending, budget, category_trend.
- For expense data: highlight top spending categories, month-over-month changes, unusually high single transactions, and spending patterns.

Return JSON: { "insights": [{ "insightType": "...", "contentMd": "...", "severity": "...", "relatedEntity": "..." }] }`,

  userPrompt: (data: UserDataSummary) =>
    `Here is my productivity data for the last 30 days:\n\n${JSON.stringify(data, null, 2)}`,
}
