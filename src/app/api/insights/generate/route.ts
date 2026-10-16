import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI, AIError } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { insightGeneratePrompt } from '@/lib/ai/prompts'
import { aggregateUserData } from '@/lib/ai/insights/aggregate-user-data'
import { contextSchema, validateAIOutput } from '@/lib/ai/validation'
const escapeLabel = (value: string) => value.replace(/[\\\[\]()]/g, '\\$&')
export const POST = withAI(async (req, { user, apiKey, preferredModel }) => {
  try {
    const input = contextSchema.parse(await req.json().catch(() => ({})))
    const data = await aggregateUserData(user.id, input.modules, input.dateFrom, input.dateTo)
    const result = await callAI<unknown>({
      apiKey,
      model: preferredModel ?? insightGeneratePrompt.model,
      systemPrompt: insightGeneratePrompt.systemPrompt,
      userPrompt: insightGeneratePrompt.userPrompt(data),
      maxTokens: insightGeneratePrompt.maxTokens,
      temperature: insightGeneratePrompt.temperature,
      responseFormat: 'json',
    })
    const output = validateAIOutput('insights', result.data),
      sources = new Map((data.sources ?? []).map((s) => [s.id, s]))
    if (output.insights.some((item) => item.sourceIds.some((id) => !sources.has(id))))
      throw new AIError(
        'The observation referenced unavailable evidence. Please retry.',
        'AI_INVALID_RESPONSE'
      )
    const created = await prisma.$transaction(async (db) => {
      await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      await db.insight.deleteMany({
        where: {
          userId: user.id,
          OR: [{ isDismissed: false }, { validUntil: { lt: new Date() } }],
        },
      })
      const saved = []
      for (const insight of output.insights) {
        const refs = [...new Set(insight.sourceIds)].map((id) => sources.get(id)!)
        saved.push(
          await db.insight.create({
            data: {
              userId: user.id,
              insightType: insight.insightType,
              contentMd: `${insight.contentMd}\n\nContext: ${data.window?.from} – ${data.window?.to} (${data.window?.timezone}). Current goal and budget status is a snapshot.\n\nSources: ${refs.map((s) => `[${escapeLabel(s.title)} · ${s.date}](${s.href})`).join(', ')}`,
              severity: insight.severity,
              relatedEntity: insight.relatedEntity,
              relatedIds: refs.map((s) => s.id),
              validUntil: new Date(Date.now() + 7 * 86400000),
            },
          })
        )
      }
      return saved
    })
    return NextResponse.json({
      success: true,
      data: { insights: created, generatedAt: new Date().toISOString() },
      model: result.model,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    return handleAIError(error)
  }
})
