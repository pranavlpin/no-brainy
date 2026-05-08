import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface FileEntry {
  name: string
  type: 'file' | 'directory'
  children?: FileEntry[]
}

function scanDir(dirPath: string, basePath: string): FileEntry[] {
  if (!fs.existsSync(dirPath)) return []

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const result: FileEntry[] = []

  for (const entry of entries) {
    if (entry.name === 'index.html' || entry.name.startsWith('.')) continue

    if (entry.isDirectory()) {
      const children = scanDir(path.join(dirPath, entry.name), path.join(basePath, entry.name))
      result.push({ name: entry.name, type: 'directory', children })
    } else {
      result.push({ name: entry.name, type: 'file' })
    }
  }

  return result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function GET(): Promise<NextResponse> {
  const secretDir = path.join(process.cwd(), 'public', 'secret')
  const files = scanDir(secretDir, '')
  return NextResponse.json({ files })
}
