import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { AI_MODELS } from '@/lib/ai/openai-client'

export const POST = withAI(async (_req: NextRequest, { user, apiKey, preferredModel }) => {
  try {
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

    // Get active budgets
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, isActive: true },
      include: { category: { select: { name: true } } },
    })

    if (budgets.length === 0) {
      return NextResponse.json({
        success: true,
        data: { analysis: 'No budgets set up yet. Create spending limits or savings targets to get AI-powered budget advice.' },
      })
    }

    // Get last 3 months of category-wise expenses
    const expenses = await prisma.$queryRaw<Array<{
      categoryId: string
      categoryName: string
      month: string
      total: number
    }>>`
      SELECT
        ec."id" AS "categoryId",
        ec."name" AS "categoryName",
        TO_CHAR(e."date", 'YYYY-MM') AS month,
        SUM(e."amount")::float AS total
      FROM "expenses" e
      JOIN "expense_categories" ec ON e."categoryId" = ec."id"
      WHERE e."userId" = ${user.id}
        AND e."date" >= ${threeMonthsAgo}
      GROUP BY ec."id", ec."name", TO_CHAR(e."date", 'YYYY-MM')
      ORDER BY ec."name", month
    `

    // Calculate current spend for each budget
    const budgetData = budgets.map((b) => {
      const categoryExpenses = expenses.filter((e) => e.categoryId === b.categoryId)
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const currentSpend = categoryExpenses
        .filter((e) => e.month === currentMonth)
        .reduce((sum, e) => sum + e.total, 0)

      return {
        name: b.name,
        type: b.type,
        category: b.category.name,
        limit: Number(b.amount),
        period: b.period,
        currentSpend: Math.round(currentSpend),
        percentage: Number(b.amount) > 0 ? Math.round((currentSpend / Number(b.amount)) * 100) : 0,
        status: currentSpend > Number(b.amount) ? 'OVER BUDGET' : currentSpend > Number(b.amount) * 0.75 ? 'WARNING' : 'ON TRACK',
      }
    })

    // Build category monthly trends for context
    const categoryMap = new Map<string, Record<string, number>>()
    for (const row of expenses) {
      if (!categoryMap.has(row.categoryName)) categoryMap.set(row.categoryName, {})
      categoryMap.get(row.categoryName)![row.month] = Math.round(row.total)
    }

    const trendsData = Array.from(categoryMap.entries()).map(([name, months]) => ({
      category: name,
      months,
    }))

    const contextData = {
      budgets: budgetData,
      categoryTrends: trendsData,
      currentMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    }

    const result = await callAI({
      apiKey,
      model: preferredModel || AI_MODELS.SMART,
      maxTokens: 1500,
      temperature: 0.4,
      systemPrompt: `You are a smart personal finance advisor. Analyze the user's budget goals and spending trends. Provide concise, actionable advice in Markdown.

Include:
- Which budgets are on track vs at risk
- Spending trends (increasing/decreasing) for key categories
- Specific suggestions to stay within limits or reach targets
- One encouraging observation if something is going well
- Keep it conversational but data-driven. Use ₹ for currency.
- Use bullet points. Keep under 250 words.
- Don't repeat the raw numbers back — focus on insights and actions.`,
      userPrompt: JSON.stringify(contextData, null, 2),
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: 'Failed to analyze budgets' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { analysis: result.data, model: result.model, tokensUsed: result.tokensUsed },
    })
  } catch (error) {
    console.error('Budget AI error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
