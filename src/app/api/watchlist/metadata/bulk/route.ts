import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

const OMDB_KEY = process.env.OMDB_API_KEY || ''

interface OmdbResult {
  Title?: string
  Year?: string
  Rated?: string
  Genre?: string
  Director?: string
  Plot?: string
  Poster?: string
  imdbRating?: string
  imdbID?: string
  Type?: string
  Response?: string
}

async function fetchOmdb(title: string, year?: number | null): Promise<OmdbResult | null> {
  if (!OMDB_KEY) return null
  const params = new URLSearchParams({ apikey: OMDB_KEY, t: title })
  if (year) params.set('y', String(year))
  try {
    const res = await fetch(`https://www.omdbapi.com/?${params}`)
    const data = await res.json() as OmdbResult
    return data.Response === 'True' ? data : null
  } catch {
    return null
  }
}

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    if (!OMDB_KEY) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'OMDB_API_KEY not configured. Get a free key at https://www.omdbapi.com/apikey.aspx' } },
        { status: 400 }
      )
    }

    // Get items that haven't been fetched yet
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id, metadataFetched: false },
      select: { id: true, title: true, year: true, coverUrl: true, genre: true, notesMd: true, tags: true },
      take: 50, // Process max 50 at a time (OMDB rate limit)
    })

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        data: { updated: 0, total: 0, message: 'All items already have metadata fetched' },
      })
    }

    let updated = 0
    let failed = 0

    for (const item of items) {
      // Small delay to respect OMDB rate limits
      await new Promise((resolve) => setTimeout(resolve, 200))

      const omdb = await fetchOmdb(item.title, item.year)

      const updateData: Record<string, unknown> = { metadataFetched: true }

      if (omdb) {
        if (omdb.Poster && omdb.Poster !== 'N/A' && !item.coverUrl) {
          updateData.coverUrl = omdb.Poster
        }
        if (omdb.Year && !item.year) {
          updateData.year = parseInt(omdb.Year, 10)
        }
        if (omdb.Genre && item.genre.length === 0) {
          updateData.genre = omdb.Genre.split(',').map((g: string) => g.trim())
        }
        if (omdb.Type) {
          const type = omdb.Type.toLowerCase().includes('series') ? 'show' : 'movie'
          updateData.type = type
        }

        const notes: string[] = []
        if (omdb.Director && omdb.Director !== 'N/A') notes.push(`**Director:** ${omdb.Director}`)
        if (omdb.Rated && omdb.Rated !== 'N/A') notes.push(`**Rated:** ${omdb.Rated}`)
        if (omdb.imdbRating && omdb.imdbRating !== 'N/A') notes.push(`**IMDB Rating:** ${omdb.imdbRating}/10`)
        if (omdb.Plot && omdb.Plot !== 'N/A') notes.push(`\n${omdb.Plot}`)
        if (notes.length > 0 && !item.notesMd) {
          updateData.notesMd = notes.join('\n')
        }

        if (omdb.imdbID) {
          const imdbTag = `imdb:${omdb.imdbID}`
          if (!item.tags.includes(imdbTag)) {
            updateData.tags = [...item.tags, imdbTag]
          }
        }

        updated++
      } else {
        failed++
      }

      await prisma.watchlistItem.update({
        where: { id: item.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      success: true,
      data: { updated, failed, total: items.length },
    })
  } catch (error) {
    console.error('Bulk metadata fetch error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metadata' } },
      { status: 500 }
    )
  }
})
