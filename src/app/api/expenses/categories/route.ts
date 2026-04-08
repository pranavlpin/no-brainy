import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { createCategorySchema } from '@/lib/validations/expenses'
import { ensureDefaultCategories } from '@/lib/expenses/seed-categories'
import { ZodError } from 'zod'

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    await ensureDefaultCategories(user.id)

    const categories = await prisma.expenseCategory.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { expenses: true } },
      },
    })

    const items = categories.map((cat) => ({
      id: cat.id,
      userId: cat.userId,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      expenseCount: cat._count.expenses,
    }))

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const data = createCategorySchema.parse(body)

    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const existing = await prisma.expenseCategory.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'A category with this name already exists' } },
        { status: 409 }
      )
    }

    const maxOrder = await prisma.expenseCategory.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    })

    const category = await prisma.expenseCategory.create({
      data: {
        userId: user.id,
        name: data.name,
        slug,
        icon: data.icon,
        color: data.color,
        isDefault: false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: category.id,
          userId: category.userId,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault,
          sortOrder: category.sortOrder,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
          expenseCount: 0,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    console.error('Categories POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
