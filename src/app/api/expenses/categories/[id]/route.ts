import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { updateCategorySchema } from '@/lib/validations/expenses'
import { ZodError } from 'zod'

export const PATCH = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!
    const body = await req.json()
    const data = updateCategorySchema.parse(body)

    const category = await prisma.expenseCategory.findFirst({
      where: { id, userId: user.id },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      )
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        slug: updated.slug,
        icon: updated.icon,
        color: updated.color,
        isDefault: updated.isDefault,
        sortOrder: updated.sortOrder,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
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
    console.error('Category PATCH error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const id = req.nextUrl.pathname.split('/').pop()!

    const category = await prisma.expenseCategory.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { expenses: true } } },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      )
    }

    if (category._count.expenses > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: `Cannot delete category with ${category._count.expenses} expenses. Reassign them first.` } },
        { status: 409 }
      )
    }

    await prisma.expenseCategory.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
})
