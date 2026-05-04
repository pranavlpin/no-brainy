import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const shareId = req.nextUrl.pathname.split('/').pop()

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
        { status: 404 }
      )
    }

    const note = await prisma.note.findFirst({
      where: { shareId, isPublic: true, isDeleted: false },
      select: {
        title: true,
        contentMd: true,
        tags: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    if (!note) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Note not found or not shared' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        title: note.title,
        contentMd: note.contentMd,
        tags: note.tags,
        updatedAt: note.updatedAt.toISOString(),
        createdAt: note.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Public note error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
