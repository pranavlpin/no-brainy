'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { formatINR, formatDate } from '@/lib/expenses/formatters'
import type { ExpenseCategoryResponse } from '@/lib/types/expenses'

interface ParsedRow {
  date: string
  name: string
  amount: number
  originalLine: string
  suggestedCategorySlug?: string
}

interface ParseResponse {
  rows: ParsedRow[]
  format: 'csv' | 'txt'
  totalRows: number
  totalAmount: number
  errors: string[]
}

type Step = 'upload' | 'preview' | 'done'

interface ExpenseImportWizardProps {
  onClose: () => void
  onComplete: () => void
}

export function ExpenseImportWizard({ onClose, onComplete }: ExpenseImportWizardProps): React.ReactElement {
  const [step, setStep] = useState<Step>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseData, setParseData] = useState<ParseResponse | null>(null)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, string>>({})
  const [importResult, setImportResult] = useState<{ created: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories } = useExpenseCategories()
  const slugMap = new Map<string, ExpenseCategoryResponse>()
  categories?.forEach((cat) => slugMap.set(cat.slug, cat))

  const handleFileSelect = async (file: File): Promise<void> => {
    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/expenses/import', {
        method: 'POST',
        body: formData,
      })

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

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleConfirm = async (): Promise<void> => {
    if (!parseData) return
    setIsImporting(true)
    setError(null)

    try {
      const rows = parseData.rows.map((row, idx) => ({
        date: row.date,
        name: row.name,
        amount: row.amount,
        categorySlug: categoryOverrides[idx] || row.suggestedCategorySlug || 'unknown',
        originalLine: row.originalLine,
      }))

      const res = await fetch('/api/expenses/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, source: `${parseData.format}_import` }),
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
      setError('Failed to import expenses')
    } finally {
      setIsImporting(false)
    }
  }

  const getCategoryForRow = (row: ParsedRow, idx: number): ExpenseCategoryResponse | undefined => {
    const slug = categoryOverrides[idx] || row.suggestedCategorySlug || 'unknown'
    return slugMap.get(slug)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-4xl max-h-[85vh] rounded-lg bg-background shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {step === 'upload' && 'Import Expenses'}
            {step === 'preview' && 'Review & Confirm'}
            {step === 'done' && 'Import Complete'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              {isUploading ? (
                <p className="text-muted-foreground">Parsing file...</p>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop your file here or click to browse</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Supports CSV (bank exports) and TXT (SMS/message exports)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Maximum 5MB</p>
                </>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && parseData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {parseData.format.toUpperCase()} format
                </span>
                <span>{parseData.totalRows} transactions</span>
                <span className="font-medium text-foreground">{formatINR(parseData.totalAmount)}</span>
              </div>

              {parseData.errors.length > 0 && (
                <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600">
                  {parseData.errors.length} row(s) skipped due to parsing errors.
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium w-8">#</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseData.rows.map((row, idx) => {
                      const cat = getCategoryForRow(row, idx)
                      return (
                        <tr key={idx} className="border-t border-border/50 hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.date)}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={categoryOverrides[idx] || row.suggestedCategorySlug || 'unknown'}
                              onChange={(e) => setCategoryOverrides({ ...categoryOverrides, [idx]: e.target.value })}
                              className="w-36 h-8 text-xs"
                            >
                              {categories?.map((c) => (
                                <option key={c.slug} value={c.slug}>{c.name}</option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                            {formatINR(row.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && importResult && (
            <div className="flex flex-col items-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Import Successful</h3>
              <p className="mt-2 text-muted-foreground">
                {importResult.created} expense{importResult.created !== 1 ? 's' : ''} imported successfully.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setParseData(null) }}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isImporting}>
                {isImporting ? 'Importing...' : `Import ${parseData?.totalRows} Expenses`}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={() => { onComplete(); onClose() }}>
              Done
            </Button>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
