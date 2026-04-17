export interface ParsedWatchlistItem {
  title: string
  type: 'movie' | 'show'
  year: number | null
  genre: string[]
  rating: number | null
  imdbRating: number | null
  imdbId: string | null
  imdbUrl: string | null
  directors: string | null
  originalLine: string
}

export interface WatchlistParseResult {
  items: ParsedWatchlistItem[]
  format: 'imdb' | 'google' | 'unknown'
  errors: string[]
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function mapImdbType(titleType: string): 'movie' | 'show' {
  const lower = titleType.toLowerCase()
  if (lower.includes('series') || lower.includes('show') || lower.includes('tv')) {
    return 'show'
  }
  return 'movie'
}

function mapImdbRatingTo5(imdbRating: number | null, userRating: number | null): number | null {
  // Prefer user rating (IMDB uses 1-10, map to 1-5)
  if (userRating && userRating > 0) {
    return Math.min(5, Math.max(1, Math.round(userRating / 2)))
  }
  if (imdbRating && imdbRating > 0) {
    return Math.min(5, Math.max(1, Math.round(imdbRating / 2)))
  }
  return null
}

function parseGenres(genreStr: string): string[] {
  if (!genreStr) return []
  return genreStr
    .replace(/^"|"$/g, '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
}

export function parseImdbCSV(content: string): WatchlistParseResult {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const errors: string[] = []
  const items: ParsedWatchlistItem[] = []

  if (lines.length < 2) {
    return { items: [], format: 'imdb', errors: ['File has no data rows'] }
  }

  const headers = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ''))

  // Detect IMDB format by checking for known columns
  const titleIdx = headers.findIndex((h) => h === 'title')
  const constIdx = headers.findIndex((h) => h === 'const')
  const typeIdx = headers.findIndex((h) => h === 'title type')
  const yearIdx = headers.findIndex((h) => h === 'year')
  const genreIdx = headers.findIndex((h) => h === 'genres')
  const imdbRatingIdx = headers.findIndex((h) => h === 'imdb rating')
  const userRatingIdx = headers.findIndex((h) => h === 'your rating')
  const urlIdx = headers.findIndex((h) => h === 'url')
  const directorsIdx = headers.findIndex((h) => h === 'directors')

  if (titleIdx === -1) {
    return { items: [], format: 'unknown', errors: ['Could not find Title column'] }
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i])

    const title = fields[titleIdx]?.replace(/^"|"$/g, '')
    if (!title) continue

    const titleType = typeIdx !== -1 ? fields[typeIdx]?.replace(/^"|"$/g, '') || '' : ''
    const yearStr = yearIdx !== -1 ? fields[yearIdx] : ''
    const genreStr = genreIdx !== -1 ? fields[genreIdx] || '' : ''
    const imdbRatingStr = imdbRatingIdx !== -1 ? fields[imdbRatingIdx] : ''
    const userRatingStr = userRatingIdx !== -1 ? fields[userRatingIdx] : ''
    const imdbId = constIdx !== -1 ? fields[constIdx] || null : null
    const url = urlIdx !== -1 ? fields[urlIdx] || null : null
    const directors = directorsIdx !== -1 ? fields[directorsIdx]?.replace(/^"|"$/g, '') || null : null

    const year = yearStr ? parseInt(yearStr, 10) : null
    const imdbRating = imdbRatingStr ? parseFloat(imdbRatingStr) : null
    const userRating = userRatingStr ? parseFloat(userRatingStr) : null

    items.push({
      title,
      type: mapImdbType(titleType),
      year: year && !isNaN(year) ? year : null,
      genre: parseGenres(genreStr),
      rating: mapImdbRatingTo5(imdbRating, userRating),
      imdbRating: imdbRating && !isNaN(imdbRating) ? imdbRating : null,
      imdbId,
      imdbUrl: url,
      directors,
      originalLine: lines[i],
    })
  }

  if (items.length === 0 && lines.length > 1) {
    errors.push('No items could be parsed from the file')
  }

  const format = constIdx !== -1 ? 'imdb' : 'google'

  return { items, format, errors }
}

export function parseWatchlistFile(content: string, filename: string): WatchlistParseResult {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext !== 'csv') {
    return { items: [], format: 'unknown', errors: ['Only CSV files are supported'] }
  }
  return parseImdbCSV(content)
}
