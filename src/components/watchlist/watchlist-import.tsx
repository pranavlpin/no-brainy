'use client'

import { useState, useRef } from 'react'
import { Upload, Check, AlertCircle, X, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { WatchlistStatus } from '@/lib/types/watchlist'

interface ParsedItem {
  title: string
  type: 'movie' | 'show'
  year: number | null
  genre: string[]
  rating: number | null
  imdbRating: number | null
  imdbId: string | null
  directors: string | null
}

interface ParseResponse {
  items: ParsedItem[]
  format: string
  totalItems: number
  errors: string[]
}

type Step = 'upload' | 'preview' | 'done'

interface WatchlistImportProps {
  onClose: () => void
  onComplete: () => void
}

export function WatchlistImport({ onClose, onComplete }: WatchlistImportProps): React.ReactElement {
  const [step, setStep] = useState<Step>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseData, setParseData] = useState<ParseResponse | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<WatchlistStatus>('want_to_watch')
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/watchlist/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to parse file')
        setIsUploading(false)
        return
      }
      setParseData(data.data)
      setStep('preview')
    } catch {
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = async (): Promise<void> => {
    if (!parseData) return
    setIsImporting(true)
    setError(null)
    try {
      const items = parseData.items.map((item) => ({
        title: item.title,
        type: item.type,
        year: item.year,
        genre: item.genre,
        rating: item.rating,
        status: defaultStatus,
        imdbId: item.imdbId,
      }))
      const res = await fetch('/api/watchlist/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message || 'Failed to import')
        setIsImporting(false)
        return
      }
      setImportResult(data.data)
      setStep('done')
    } catch {
      setError('Failed to import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[85vh] border-2 border-retro-dark bg-white shadow-hard flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-dark/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-retro-dark">
            {step === 'upload' && 'Import Watchlist'}
            {step === 'preview' && 'Review Import'}
            {step === 'done' && 'Import Complete'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 flex items-center gap-2 border-2 border-red-300 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <div>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-retro-dark/30 py-16 hover:border-retro-blue/50 transition-colors cursor-pointer"
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />
                {isUploading ? (
                  <p className="text-muted-foreground">Parsing file...</p>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="font-display text-lg font-medium">Drop your CSV file here</p>
                    <p className="mt-2 text-sm text-muted-foreground">Supports IMDB and Google Watchlist exports</p>
                  </>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-retro-dark/50">How to export</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>IMDB:</strong> Go to your IMDB Watchlist → three dots menu → Export</p>
                  <p><strong>Google:</strong> Go to Google Search → "My Watchlist" → Export as CSV</p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && parseData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Film className="h-4 w-4" />
                  <span>{parseData.totalItems} items found ({parseData.format.toUpperCase()} format)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-retro-dark/50">Import as:</span>
                  <Select
                    value={defaultStatus}
                    onChange={(e) => setDefaultStatus(e.target.value as WatchlistStatus)}
                    className="w-40 h-8 text-xs"
                  >
                    <option value="want_to_watch">Want to Watch</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto border-2 border-retro-dark/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-retro-blue/10 text-left">
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">#</th>
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">Title</th>
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">Type</th>
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">Year</th>
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">Genre</th>
                      <th className="px-3 py-2 font-mono text-xs uppercase tracking-wider text-retro-dark/60">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseData.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-border/50">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium max-w-[200px] truncate">{item.title}</td>
                        <td className="px-3 py-2">
                          <span className={`font-mono text-xs px-1.5 py-0.5 ${item.type === 'movie' ? 'bg-retro-blue/10 text-retro-blue' : 'bg-retro-pink/10 text-retro-pink'}`}>
                            {item.type === 'movie' ? 'Movie' : 'Show'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{item.year ?? '-'}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[150px] truncate">{item.genre.join(', ') || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{item.rating ? `${item.rating}/5` : item.imdbRating ? `${item.imdbRating}/10` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'done' && importResult && (
            <div className="flex flex-col items-center py-12">
              <div className="flex h-16 w-16 items-center justify-center bg-retro-mint/10">
                <Check className="h-8 w-8 text-retro-mint" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">Import Successful</h3>
              <p className="mt-2 text-muted-foreground">
                {importResult.created} item{importResult.created !== 1 ? 's' : ''} imported
                {importResult.skipped > 0 && `, ${importResult.skipped} skipped (already exist)`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-retro-dark/10 px-6 py-4 flex justify-end gap-3">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setParseData(null) }}>Back</Button>
              <button
                onClick={handleConfirm}
                disabled={isImporting}
                className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : `Import ${parseData?.totalItems} Items`}
              </button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => { onComplete(); onClose() }}>Done</Button>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
        </div>
      </div>
    </div>
  )
}
