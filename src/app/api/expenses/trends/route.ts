import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { z } from 'zod'
import { ZodError } from 'zod'

const trendsQuerySchema = z.object({
  fromMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
  toMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM').optional(),
})

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => { queryObj[key] = value })
    const query = trendsQuerySchema.parse(queryObj)

    // Default: last 6 months
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const fromMonth = query.fromMonth || `${defaultFrom.getFullYear()}-${String(defaultFrom.getMonth() + 1).padStart(2, '0')}`
    const toMonth = query.toMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const startDate = new Date(`${fromMonth}-01`)
    const toParts = toMonth.split('-')
    const endDate = new Date(Number(toParts[0]), Number(toParts[1]), 0) // last day of toMonth

    const monthlyData = await prisma.$queryRaw<Array<{
      categoryId: string
      categoryName: string
      color: string
      month: string
      total: number
    }>>`
      SELECT
        ec."id" AS "categoryId",
        ec."name" AS "categoryName",
        ec."color",
        TO_CHAR(e."date", 'YYYY-MM') AS month,
        SUM(e."amount")::float AS total
      FROM "expenses" e
      JOIN "expense_categories" ec ON e."categoryId" = ec."id"
      WHERE e."userId" = ${user.id}
        AND e."date" >= ${startDate}
        AND e."date" <= ${endDate}
      GROUP BY ec."id", ec."name", ec."color", TO_CHAR(e."date", 'YYYY-MM')
      ORDER BY month
    `

    // Build full month list between from and to
    const monthList: string[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      monthList.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
      current.setMonth(current.getMonth() + 1)
    }

    // Build category map
    const categoryMap = new Map<string, { name: string; color: string; data: Record<string, number>; total: number }>()
    for (const row of monthlyData) {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, { name: row.categoryName, color: row.color, data: {}, total: 0 })
      }
      const cat = categoryMap.get(row.categoryId)!
      cat.data[row.month] = row.total
      cat.total += row.total
    }

    // Sort by total descending, take top 8
    const categories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([id, data]) => ({ id, ...data }))

    // Monthly totals
    const monthlyTotals = monthList.map((month) => ({
      month,
      total: monthlyData
        .filter((r) => r.month === month)
        .reduce((sum, r) => sum + r.total, 0),
    }))

    return NextResponse.json({
      success: true,
      data: { months: monthList, categories, monthlyTotals },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } },
        { status: 400 }
      )
    }
    console.error('Trends GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
