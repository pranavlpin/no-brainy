import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { ensureDefaultCategories } from '@/lib/expenses/seed-categories'
import { z } from 'zod'
import { ZodError } from 'zod'

const confirmSchema = z.object({
  rows: z.array(z.object({
    date: z.string(),
    name: z.string(),
    amount: z.number(),
    categorySlug: z.string(),
    originalLine: z.string().optional(),
  })).min(1),
  source: z.enum(['csv_import', 'txt_import']).default('csv_import'),
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { rows, source } = confirmSchema.parse(body)

    await ensureDefaultCategories(user.id)

    // Get all user categories to map slugs to IDs
    const categories = await prisma.expenseCategory.findMany({
      where: { userId: user.id },
      select: { id: true, slug: true },
    })
    const slugToId = new Map(categories.map((c) => [c.slug, c.id]))

    // Find the 'unknown' category as fallback
    const unknownId = slugToId.get('unknown')

    const expenseData = rows.map((row) => ({
      userId: user.id,
      categoryId: slugToId.get(row.categorySlug) || unknownId || categories[0]?.id || '',
      name: row.name,
      amount: row.amount,
      date: new Date(row.date),
      tags: [],
      source,
      importRef: row.originalLine ?? null,
    })).filter((e) => e.categoryId)

    // Batch insert in chunks of 100
    let created = 0
    const chunkSize = 100
    for (let i = 0; i < expenseData.length; i += chunkSize) {
      const chunk = expenseData.slice(i, i + chunkSize)
      const result = await prisma.expense.createMany({ data: chunk })
      created += result.count
    }

    return NextResponse.json(
      { success: true, data: { created, total: rows.length } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid import data' } },
        { status: 400 }
      )
    }
    console.error('Import confirm error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import expenses' } },
      { status: 500 }
    )
  }
})
