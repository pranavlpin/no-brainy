import { NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { DEFAULT_CATEGORIES } from '@/lib/expenses/seed-categories'
import { calendarDate } from '@/lib/dates/calendar'
const schema = z.object({
  rows: z
    .array(
      z.object({
        date: z.string().refine((v) => calendarDate(v) === v),
        name: z.string().trim().min(1).max(500),
        amount: z
          .number()
          .finite()
          .positive()
          .max(9999999999.99)
          .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001),
        categorySlug: z.string().max(100),
        originalLine: z.string().max(10000).optional(),
      })
    )
    .min(1)
    .max(5000),
  source: z.enum(['csv_import', 'txt_import']).default('csv_import'),
})
export const POST = withAuth(async (req, user) => {
  try {
    const raw = await req.text()
    if (Buffer.byteLength(raw) > 5 * 1024 * 1024)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Import is too large. Use a file under 5 MB.',
          },
        },
        { status: 413 }
      )
    const { rows, source } = schema.parse(JSON.parse(raw))
    const result = await prisma.$transaction(
      async (db) => {
        await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
        if (!(await db.expenseCategory.count({ where: { userId: user.id } })))
          await db.expenseCategory.createMany({
            data: DEFAULT_CATEGORIES.map((category) => ({
              ...category,
              userId: user.id,
              isDefault: true,
            })),
            skipDuplicates: true,
          })
        const unknown = await db.expenseCategory.upsert({
          where: { userId_slug: { userId: user.id, slug: 'unknown' } },
          update: {},
          create: { userId: user.id, slug: 'unknown', name: 'Unknown', isDefault: true },
        })
        const categories = await db.expenseCategory.findMany({
            where: { userId: user.id },
            select: { id: true, slug: true },
          }),
          ids = new Map(categories.map((c) => [c.slug, c.id]))
        let created = 0,
          skipped = 0
        for (const row of rows) {
          const date = new Date(row.date),
            amount = Math.round(row.amount * 100) / 100,
            importRef = row.originalLine?.trim() ?? null
          const existing = await db.expense.findFirst({
            where: { userId: user.id, source, date, name: row.name, amount, importRef },
          })
          if (existing) {
            skipped++
            continue
          }
          await db.expense.create({
            data: {
              userId: user.id,
              categoryId: ids.get(row.categorySlug) ?? unknown.id,
              name: row.name,
              amount,
              date,
              source,
              importRef,
            },
          })
          created++
        }
        return { created, skipped, total: rows.length }
      },
      { timeout: 30000 }
    )
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message:
            error instanceof ZodError || error instanceof SyntaxError
              ? 'Check import dates, descriptions and amounts (at most two decimal places).'
              : 'Could not import expenses. No partial changes were saved; retry when ready.',
        },
      },
      { status: error instanceof ZodError || error instanceof SyntaxError ? 400 : 500 }
    )
  }
})
