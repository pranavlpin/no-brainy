import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'

// Uses OMDB API (free tier: 1000 requests/day)
// User can set their own OMDB key in env, or we use a basic search approach
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
  Error?: string
}

async function searchOmdb(title: string, year?: number | null): Promise<OmdbResult | null> {
  if (!OMDB_KEY) return null

  const params = new URLSearchParams({ apikey: OMDB_KEY, t: title })
  if (year) params.set('y', String(year))

  try {
    const res = await fetch(`https://www.omdbapi.com/?${params}`, { next: { revalidate: 86400 } })
    const data = await res.json() as OmdbResult
    if (data.Response === 'True') return data
    return null
  } catch {
    return null
  }
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { id } = await req.json() as { id: string }

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'id is required' } },
        { status: 400 }
      )
    }

    const item = await prisma.watchlistItem.findFirst({
      where: { id, userId: user.id },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } },
        { status: 404 }
      )
    }

    if (!OMDB_KEY) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFIG_ERROR', message: 'OMDB_API_KEY not configured. Get a free key at https://www.omdbapi.com/apikey.aspx and add it to your .env file.' } },
        { status: 400 }
      )
    }

    const omdb = await searchOmdb(item.title, item.year)

    if (!omdb) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `No metadata found for "${item.title}"` } },
        { status: 404 }
      )
    }

    // Build update data from OMDB
    const updateData: Record<string, unknown> = {}
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
      if (item.type !== type) updateData.type = type
    }

    // Build notes with metadata
    const metadataNotes: string[] = []
    if (omdb.Director && omdb.Director !== 'N/A') metadataNotes.push(`**Director:** ${omdb.Director}`)
    if (omdb.Rated && omdb.Rated !== 'N/A') metadataNotes.push(`**Rated:** ${omdb.Rated}`)
    if (omdb.imdbRating && omdb.imdbRating !== 'N/A') metadataNotes.push(`**IMDB Rating:** ${omdb.imdbRating}/10`)
    if (omdb.Plot && omdb.Plot !== 'N/A') metadataNotes.push(`\n${omdb.Plot}`)

    if (metadataNotes.length > 0 && !item.notesMd) {
      updateData.notesMd = metadataNotes.join('\n')
    }

    // Add IMDB tag if found
    if (omdb.imdbID) {
      const imdbTag = `imdb:${omdb.imdbID}`
      if (!item.tags.includes(imdbTag)) {
        updateData.tags = [...item.tags, imdbTag]
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.watchlistItem.update({
        where: { id },
        data: updateData,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        updated: Object.keys(updateData).length > 0,
        fields: Object.keys(updateData),
        omdb: {
          title: omdb.Title,
          year: omdb.Year,
          genre: omdb.Genre,
          director: omdb.Director,
          poster: omdb.Poster !== 'N/A' ? omdb.Poster : null,
          imdbRating: omdb.imdbRating,
          plot: omdb.Plot !== 'N/A' ? omdb.Plot : null,
          imdbId: omdb.imdbID,
        },
      },
    })
  } catch (error) {
    console.error('Watchlist metadata error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metadata' } },
      { status: 500 }
    )
  }
})
