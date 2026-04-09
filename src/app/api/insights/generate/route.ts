import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { insightGeneratePrompt } from '@/lib/ai/prompts'
import { aggregateUserData, type InsightModule } from '@/lib/ai/insights/aggregate-user-data'

interface GeneratedInsight {
  insightType: string
  contentMd: string
  severity: string
  relatedEntity: string | null
}

interface InsightGenerationResult {
  insights: GeneratedInsight[]
}

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  try {
    // Parse optional modules and date range from request body
    let selectedModules: InsightModule[] | undefined
    let dateFrom: string | undefined
    let dateTo: string | undefined
    try {
      const body = await req.json()
      if (body.modules && Array.isArray(body.modules)) {
        selectedModules = body.modules as InsightModule[]
      }
      if (body.dateFrom) dateFrom = body.dateFrom as string
      if (body.dateTo) dateTo = body.dateTo as string
    } catch {
      // No body or invalid JSON — use defaults
    }

    // Delete expired insights
    await prisma.insight.deleteMany({
      where: {
        userId: user.id,
        validUntil: { lt: new Date() },
      },
    })

    // Aggregate user data (only selected modules, within date range)
    const data = await aggregateUserData(user.id, selectedModules, dateFrom, dateTo)

    // Call AI
    const result = await callAI<InsightGenerationResult>({
      apiKey,
      model: insightGeneratePrompt.model,
      systemPrompt: insightGeneratePrompt.systemPrompt,
      userPrompt: insightGeneratePrompt.userPrompt(data, { from: dateFrom, to: dateTo }),
      maxTokens: insightGeneratePrompt.maxTokens,
      temperature: insightGeneratePrompt.temperature,
      responseFormat: 'json',
    })

    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    // Bulk insert new insights
    const insightData = result.data.insights.map((insight) => ({
      userId: user.id,
      insightType: insight.insightType,
      contentMd: insight.contentMd,
      severity: insight.severity,
      relatedEntity: insight.relatedEntity,
      validUntil,
    }))

    // Delete old non-dismissed insights before inserting new ones
    await prisma.insight.deleteMany({
      where: {
        userId: user.id,
        isDismissed: false,
      },
    })

    const created = await Promise.all(
      insightData.map((data) =>
        prisma.insight.create({ data })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        insights: created,
        generatedAt: new Date().toISOString(),
      },
      model: result.model,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    return handleAIError(error)
  }
})
