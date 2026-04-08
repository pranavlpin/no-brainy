export interface ParsedExpenseRow {
  date: string
  name: string
  amount: number
  originalLine: string
  suggestedCategorySlug?: string
}

export interface ParseResult {
  rows: ParsedExpenseRow[]
  format: 'csv' | 'txt'
  errors: string[]
}

// ──────────────────────────────────────────────
// CSV Parser
// ──────────────────────────────────────────────

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

function detectDateFormat(value: string): Date | null {
  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]))
  }
  // YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  }
  // DD-Mon-YY or DD-Mon-YYYY (e.g. 07-Apr-25, 07-Apr-2025)
  const monMatch = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/)
  if (monMatch) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }
    const m = months[monMatch[2].toLowerCase()]
    if (m !== undefined) {
      let year = Number(monMatch[3])
      if (year < 100) year += 2000
      return new Date(year, m, Number(monMatch[1]))
    }
  }
  return null
}

function parseAmount(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[₹,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

interface ColumnMapping {
  dateCol: number
  nameCol: number
  amountCol: number
}

function detectColumns(headers: string[]): ColumnMapping | null {
  const lower = headers.map((h) => h.toLowerCase().trim())

  let dateCol = lower.findIndex((h) => h === 'date' || h === 'transaction date' || h === 'txn date' || h === 'value date')
  let nameCol = lower.findIndex((h) => h === 'description' || h === 'narration' || h === 'particulars' || h === 'details' || h === 'transaction details')
  let amountCol = lower.findIndex((h) => h === 'debit' || h === 'amount' || h === 'withdrawal' || h === 'debit amount' || h === 'withdrawal amt')

  if (dateCol === -1) dateCol = lower.findIndex((h) => h.includes('date'))
  if (nameCol === -1) nameCol = lower.findIndex((h) => h.includes('description') || h.includes('narration') || h.includes('particular'))
  if (amountCol === -1) amountCol = lower.findIndex((h) => h.includes('debit') || h.includes('amount') || h.includes('withdrawal'))

  if (dateCol === -1 || nameCol === -1 || amountCol === -1) return null
  return { dateCol, nameCol, amountCol }
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const errors: string[] = []
  const rows: ParsedExpenseRow[] = []

  if (lines.length < 2) {
    return { rows: [], format: 'csv', errors: ['File has no data rows'] }
  }

  const headers = splitCSVLine(lines[0])
  const mapping = detectColumns(headers)

  if (!mapping) {
    return { rows: [], format: 'csv', errors: ['Could not detect columns. Expected: Date, Description/Narration, Debit/Amount'] }
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCSVLine(lines[i])
    const dateStr = fields[mapping.dateCol]
    const name = fields[mapping.nameCol]
    const amountStr = fields[mapping.amountCol]

    if (!dateStr || !name) continue

    const date = detectDateFormat(dateStr)
    const amount = parseAmount(amountStr)

    if (!date) {
      errors.push(`Row ${i + 1}: Could not parse date "${dateStr}"`)
      continue
    }
    if (amount === null || amount === 0) continue // skip zero/empty amounts (credits)

    rows.push({
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      name: name.trim(),
      amount: Math.abs(amount),
      originalLine: lines[i],
    })
  }

  return { rows, format: 'csv', errors }
}

// ──────────────────────────────────────────────
// TXT / SMS Parser
// ──────────────────────────────────────────────

const SMS_PATTERNS = [
  // INR 450.00 debited from A/c XX1234 on 07-Apr-25. UPI/SWIGGY/OrderID
  /INR\s*([\d,]+\.?\d*)\s*(?:debited|spent|charged).*?on\s*(\d{1,2}-[A-Za-z]{3}-\d{2,4})\.?\s*(.*)/i,
  // Rs.450.00 debited from A/c on 07-Apr-25 to VPA merchant@bank
  /Rs\.?\s*([\d,]+\.?\d*)\s*(?:debited|spent).*?on\s*(\d{1,2}-[A-Za-z]{3}-\d{2,4})\s*(.*)/i,
  // You've spent Rs 450 on HDFC CC XX5678 at AMAZON.IN on 07-Apr-25
  /(?:spent|charged)\s*(?:Rs\.?|INR)\s*([\d,]+\.?\d*)\s*.*?(?:at|to|for)\s+([\w\s.]+?)(?:\s+on\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4}))/i,
  // Txn of INR 450 at AMAZON on 07-Apr-25
  /(?:Txn|Transaction).*?INR\s*([\d,]+\.?\d*)\s*(?:at|to)\s+([\w\s.]+?)(?:\s+on\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4}))/i,
  // Generic: amount + date pattern
  /(?:INR|Rs\.?)\s*([\d,]+\.?\d*).*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:\d{1,2}-[A-Za-z]{3}-\d{2,4}))/i,
]

function extractMerchantFromSMS(text: string): string {
  // Try to extract merchant from UPI/payment patterns
  const upiMatch = text.match(/UPI\/([\w\s.]+?)(?:\/|$)/i)
  if (upiMatch) return upiMatch[1].trim()

  const atMatch = text.match(/(?:at|to|for)\s+([\w\s.]+?)(?:\s+on|\s*$)/i)
  if (atMatch) return atMatch[1].trim()

  const vpaMatch = text.match(/VPA\s+([\w.@]+)/i)
  if (vpaMatch) return vpaMatch[1].trim()

  // Fallback: take first meaningful chunk
  const cleaned = text
    .replace(/UPI\/|NEFT\/|IMPS\/|Ref\s*#?\s*\d+/gi, '')
    .replace(/\d{10,}/g, '') // remove long numbers
    .trim()

  return cleaned.substring(0, 60) || 'Unknown transaction'
}

export function parseTXT(content: string): ParseResult {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const errors: string[] = []
  const rows: ParsedExpenseRow[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let matched = false

    for (const pattern of SMS_PATTERNS) {
      const match = line.match(pattern)
      if (!match) continue

      let amount: number | null = null
      let date: Date | null = null
      let name = ''

      // Pattern-specific extraction
      if (match[1]) amount = parseAmount(match[1])
      if (match[2]) {
        date = detectDateFormat(match[2])
        if (!date) {
          // match[2] might be the merchant, match[3] might be date
          name = match[2].trim()
          if (match[3]) date = detectDateFormat(match[3])
        }
      }
      if (match[3] && !name) name = match[3].trim()

      if (!name) name = extractMerchantFromSMS(line)
      if (!date) date = new Date() // fallback to today
      if (!amount || amount === 0) continue

      rows.push({
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        name,
        amount: Math.abs(amount),
        originalLine: line,
      })
      matched = true
      break
    }

    if (!matched && line.length > 10) {
      // Try generic amount extraction as last resort
      const amountMatch = line.match(/(?:INR|Rs\.?)\s*([\d,]+\.?\d*)/i)
      if (amountMatch) {
        const amount = parseAmount(amountMatch[1])
        if (amount && amount > 0) {
          rows.push({
            date: new Date().toISOString().split('T')[0],
            name: extractMerchantFromSMS(line),
            amount: Math.abs(amount),
            originalLine: line,
          })
        }
      }
    }
  }

  if (rows.length === 0 && lines.length > 0) {
    errors.push('No transactions could be parsed from this file. Expected bank SMS or transaction text format.')
  }

  return { rows, format: 'txt', errors }
}

// ──────────────────────────────────────────────
// Auto-detect format and parse
// ──────────────────────────────────────────────

export function parseFile(content: string, filename: string): ParseResult {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'csv') {
    return parseCSV(content)
  }

  if (ext === 'txt') {
    return parseTXT(content)
  }

  // Auto-detect: if first line looks like CSV headers, parse as CSV
  const firstLine = content.split('\n')[0]?.trim() ?? ''
  if (firstLine.includes(',') && /date|description|narration|amount|debit/i.test(firstLine)) {
    return parseCSV(content)
  }

  return parseTXT(content)
}
