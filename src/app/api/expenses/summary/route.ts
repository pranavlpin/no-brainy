import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { summaryQuerySchema } from '@/lib/validations/expenses'
import { ensureDefaultCategories } from '@/lib/expenses/seed-categories'
import { ZodError } from 'zod'

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)
    const queryObj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      queryObj[key] = value
    })

    const query = summaryQuerySchema.parse(queryObj)

    await ensureDefaultCategories(user.id)

    // Default to last 6 months
    const now = new Date()
    const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const defaultStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`

    const startMonth = query.startMonth || defaultStart
    const endMonth = query.endMonth || defaultEnd

    const startDate = new Date(`${startMonth}-01`)
    const endParts = endMonth.split('-')
    const endDate = new Date(Number(endParts[0]), Number(endParts[1]), 0) // last day of end month

    // Get all categories for this user
    const categories = await prisma.expenseCategory.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: 'asc' },
    })

    // Get aggregated expenses
    const expenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    })

    // Get monthly breakdown per category using raw query for month grouping
    const monthlyData = await prisma.$queryRaw<Array<{
      categoryId: string
      month: string
      total: number
    }>>`
      SELECT
        "categoryId",
        TO_CHAR("date", 'YYYY-MM') AS month,
        SUM("amount")::float AS total
      FROM "expenses"
      WHERE "userId" = ${user.id}
        AND "date" >= ${startDate}
        AND "date" <= ${endDate}
      GROUP BY "categoryId", TO_CHAR("date", 'YYYY-MM')
      ORDER BY month
    `

    // Build month list
    const months: string[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
      current.setMonth(current.getMonth() + 1)
    }

    // Build monthly lookup: categoryId -> month -> total
    const monthlyLookup = new Map<string, Map<string, number>>()
    for (const row of monthlyData) {
      if (!monthlyLookup.has(row.categoryId)) {
        monthlyLookup.set(row.categoryId, new Map())
      }
      monthlyLookup.get(row.categoryId)!.set(row.month, row.total)
    }

    // Build rows
    const rows = categories
      .map((cat) => {
        const catMonths = monthlyLookup.get(cat.id)
        const monthValues: Record<string, number> = {}
        let total = 0
        for (const month of months) {
          const val = catMonths?.get(month) ?? 0
          monthValues[month] = val
          total += val
        }
        return {
          category: cat.name,
          categoryId: cat.id,
          color: cat.color,
          icon: cat.icon,
          months: monthValues,
          total,
        }
      })
      .filter((row) => row.total > 0)

    // Month totals
    const monthTotals: Record<string, number> = {}
    for (const month of months) {
      monthTotals[month] = rows.reduce((sum, row) => sum + (row.months[month] ?? 0), 0)
    }

    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0)

    return NextResponse.json({
      success: true,
      data: { rows, months, monthTotals, grandTotal },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters' } },
        { status: 400 }
      )
    }
    console.error('Summary GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
