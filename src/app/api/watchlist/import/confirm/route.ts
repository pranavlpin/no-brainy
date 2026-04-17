import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { z } from 'zod'
import { ZodError } from 'zod'

const confirmSchema = z.object({
  items: z.array(z.object({
    title: z.string(),
    type: z.enum(['movie', 'show']).default('movie'),
    year: z.number().nullable().optional(),
    genre: z.array(z.string()).default([]),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    status: z.enum(['want_to_watch', 'watching', 'completed', 'dropped']).default('want_to_watch'),
    platform: z.string().optional(),
    imdbId: z.string().nullable().optional(),
  })).min(1),
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const { items } = confirmSchema.parse(body)

    // Check for duplicates by title+year
    const existing = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      select: { title: true, year: true },
    })
    const existingSet = new Set(existing.map((e) => `${e.title.toLowerCase()}|${e.year ?? ''}`))

    const newItems = items.filter((item) => {
      const key = `${item.title.toLowerCase()}|${item.year ?? ''}`
      return !existingSet.has(key)
    })

    if (newItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: { created: 0, skipped: items.length, message: 'All items already exist in your watchlist' },
      })
    }

    const result = await prisma.watchlistItem.createMany({
      data: newItems.map((item) => ({
        userId: user.id,
        title: item.title,
        type: item.type,
        year: item.year ?? null,
        genre: item.genre,
        tags: item.imdbId ? [`imdb:${item.imdbId}`] : [],
        rating: item.rating ?? null,
        status: item.status,
        platform: item.platform ?? null,
        notesMd: '',
      })),
    })

    return NextResponse.json({
      success: true,
      data: { created: result.count, skipped: items.length - newItems.length },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid import data' } },
        { status: 400 }
      )
    }
    console.error('Watchlist import confirm error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import' } },
      { status: 500 }
    )
  }
})
