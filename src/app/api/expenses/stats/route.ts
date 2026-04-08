import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { z } from 'zod'
import { ZodError } from 'zod'

const statsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
})

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => { queryObj[key] = value })
    const { month } = statsQuerySchema.parse(queryObj)

    const now = new Date()
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, mon] = targetMonth.split('-').map(Number)
    const startDate = new Date(year, mon - 1, 1)
    const endDate = new Date(year, mon, 0) // last day of month

    // Current month stats
    const stats = await prisma.$queryRaw<Array<{
      transaction_count: number
      total: number
      average: number
      highest: number
    }>>`
      SELECT
        COUNT(*)::int AS transaction_count,
        COALESCE(SUM("amount"), 0)::float AS total,
        COALESCE(AVG("amount"), 0)::float AS average,
        COALESCE(MAX("amount"), 0)::float AS highest
      FROM "expenses"
      WHERE "userId" = ${user.id}
        AND "date" >= ${startDate}
        AND "date" <= ${endDate}
    `

    // Previous month stats for comparison
    const prevStartDate = new Date(year, mon - 2, 1)
    const prevEndDate = new Date(year, mon - 1, 0)
    const prevStats = await prisma.$queryRaw<Array<{
      total: number
    }>>`
      SELECT COALESCE(SUM("amount"), 0)::float AS total
      FROM "expenses"
      WHERE "userId" = ${user.id}
        AND "date" >= ${prevStartDate}
        AND "date" <= ${prevEndDate}
    `

    // Top category this month
    const topCategory = await prisma.$queryRaw<Array<{
      categoryName: string
      color: string
      total: number
    }>>`
      SELECT
        ec."name" AS "categoryName",
        ec."color",
        SUM(e."amount")::float AS total
      FROM "expenses" e
      JOIN "expense_categories" ec ON e."categoryId" = ec."id"
      WHERE e."userId" = ${user.id}
        AND e."date" >= ${startDate}
        AND e."date" <= ${endDate}
      GROUP BY ec."name", ec."color"
      ORDER BY total DESC
      LIMIT 1
    `

    const current = stats[0] || { transaction_count: 0, total: 0, average: 0, highest: 0 }
    const prevTotal = prevStats[0]?.total || 0
    const changePercent = prevTotal > 0
      ? ((current.total - prevTotal) / prevTotal) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        month: targetMonth,
        transactionCount: current.transaction_count,
        total: current.total,
        average: current.average,
        highest: current.highest,
        previousTotal: prevTotal,
        changePercent: Math.round(changePercent * 10) / 10,
        topCategory: topCategory[0] || null,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } },
        { status: 400 }
      )
    }
    console.error('Stats GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
