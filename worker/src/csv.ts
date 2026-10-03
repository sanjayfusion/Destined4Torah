import { normalizeEmail } from './util'

export interface ImportRow {
  email: string
  name: string
}

export interface ParsedImport {
  rows: ImportRow[]
  invalid: number
  skipped: number
}

/** Parses one CSV line, honoring double-quoted fields. */
function parseLine(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells.map((c) => c.trim())
}

// A cell like this means the person already opted out, so they must not be imported.
const OPTED_OUT = /^(unsubscribed|bounced|removed|non-subscriber|opted[ -]?out|do not mail)$/i

/**
 * Accepts a pasted CSV (such as a Constant Contact export) or just a list of
 * email addresses, one per line. If there is a header row, the "email" column
 * and "first name"/"last name"/"name" columns are used.
 */
export function parseImport(text: string): ParsedImport {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim())
  const result: ParsedImport = { rows: [], invalid: 0, skipped: 0 }
  if (lines.length === 0) return result

  const first = parseLine(lines[0])
  const headerLooksLikeHeader = first.some((c) => /email/i.test(c)) && !first.some((c) => c.includes('@'))
  let emailCol = 0
  let nameCols: number[] = []
  let start = 0

  if (headerLooksLikeHeader) {
    start = 1
    emailCol = first.findIndex((c) => /e-?mail/i.test(c))
    const firstName = first.findIndex((c) => /first\s*name/i.test(c))
    const lastName = first.findIndex((c) => /last\s*name/i.test(c))
    const fullName = first.findIndex((c) => /^(full\s*)?name$/i.test(c))
    nameCols = [firstName, lastName].filter((i) => i >= 0)
    if (nameCols.length === 0 && fullName >= 0) nameCols = [fullName]
  }

  const seen = new Set<string>()
  for (const line of lines.slice(start)) {
    const cells = parseLine(line)
    if (cells.some((c) => OPTED_OUT.test(c))) {
      result.skipped++
      continue
    }
    const email = normalizeEmail(cells[emailCol] ?? '')
    if (!email) {
      result.invalid++
      continue
    }
    if (seen.has(email)) continue
    seen.add(email)
    const name = nameCols
      .map((i) => cells[i] ?? '')
      .filter(Boolean)
      .join(' ')
      .slice(0, 100)
    result.rows.push({ email, name })
  }
  return result
}
