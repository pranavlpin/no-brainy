import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { AI_MODELS } from '@/lib/ai/openai-client'

export const POST = withAI(async (_req: NextRequest, { user, apiKey }) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [recentExpenses, prevExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { userId: user.id, date: { gte: thirtyDaysAgo } },
        select: { name: true, amount: true, date: true, category: { select: { name: true } } },
        orderBy: { amount: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId: user.id, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        select: { amount: true, category: { select: { name: true } } },
      }),
    ])

    if (recentExpenses.length === 0) {
      return NextResponse.json({
        success: true,
        data: { analysis: 'No expense data in the last 30 days. Start tracking your expenses to get AI-powered insights.' },
      })
    }

    const totalRecent = recentExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const totalPrev = prevExpenses.reduce((s, e) => s + Number(e.amount), 0)

    // Category breakdown
    const catMap = new Map<string, { total: number; count: number }>()
    for (const e of recentExpenses) {
      const cat = e.category?.name ?? 'Unknown'
      const cur = catMap.get(cat) ?? { total: 0, count: 0 }
      cur.total += Number(e.amount)
      cur.count++
      catMap.set(cat, cur)
    }

    const prevCatMap = new Map<string, number>()
    for (const e of prevExpenses) {
      const cat = e.category?.name ?? 'Unknown'
      prevCatMap.set(cat, (prevCatMap.get(cat) ?? 0) + Number(e.amount))
    }

    const categories = Array.from(catMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({
        name,
        total: Math.round(data.total),
        count: data.count,
        prevTotal: Math.round(prevCatMap.get(name) ?? 0),
      }))

    const top5Expenses = recentExpenses.slice(0, 5).map((e) => ({
      name: e.name,
      amount: Number(e.amount),
      category: e.category?.name ?? 'Unknown',
      date: e.date.toISOString().split('T')[0],
    }))

    const expenseData = {
      period: 'Last 30 days',
      totalSpent: Math.round(totalRecent),
      previousPeriodTotal: Math.round(totalPrev),
      transactionCount: recentExpenses.length,
      dailyAverage: Math.round(totalRecent / 30),
      categories,
      topExpenses: top5Expenses,
    }

    const result = await callAI({
      apiKey,
      model: AI_MODELS.FAST,
      maxTokens: 1024,
      temperature: 0.4,
      systemPrompt: `You are a smart personal finance analyst. Analyze the user's expense data and provide a concise, actionable analysis in Markdown format.

Include:
- A one-line spending summary
- Top spending categories and whether they increased or decreased vs last period
- Any unusually high individual expenses
- Practical suggestions to optimize spending
- Keep it conversational but data-driven. Use ₹ for currency (Indian Rupees).
- Use bullet points. Keep the total response under 300 words.`,
      userPrompt: JSON.stringify(expenseData, null, 2),
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'AI_ERROR', message: 'Failed to analyze expenses' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: result.data,
        model: result.model,
        tokensUsed: result.tokensUsed,
      },
    })
  } catch (error) {
    console.error('Expense AI analysis error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
