import { normalizeEmail } from './util'

export interface ImportRow {
  email: string
  name: string
  phone: string
  address: string
}

export interface ParsedImport {
  rows: ImportRow[]
  /** Rows with an email-column value that is not a valid address. */
  invalid: number
  /** Rows the file marks as unsubscribed, bounced, etc. */
  skipped: number
  /** Rows with no email address at all (e.g. text-message-only contacts). */
  noEmail: number
  /** Imported rows that have no name. */
  missingName: number
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

/** Splits CSV text into records, allowing quoted fields that contain line breaks. */
function splitRecords(text: string): string[] {
  const records: string[] = []
  let current = ''
  let quoted = false
  for (const ch of text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')) {
    if (ch === '"') quoted = !quoted
    if (ch === '\n' && !quoted) {
      if (current.trim()) records.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) records.push(current)
  return records
}

// A cell like this in a status column means the person already opted out of email.
const OPTED_OUT = /^(unsubscribed|bounced|removed|non-subscriber|opted[ -]?out|do not mail)$/i

function indexes(header: string[], test: (h: string) => boolean): number[] {
  return header.flatMap((h, i) => (test(h) ? [i] : []))
}

function firstValue(cells: string[], cols: number[]): string {
  for (const i of cols) if (cells[i]) return cells[i]
  return ''
}

/**
 * Accepts a pasted or uploaded CSV (such as a Constant Contact export) or just
 * a list of email addresses, one per line. With a header row it finds the email,
 * name, phone, address and email-status columns by name. Only *email* status
 * columns decide whether someone is skipped, so a text-message opt-out does not
 * drop a person who is still subscribed to email.
 */
export function parseImport(text: string): ParsedImport {
  const lines = splitRecords(text)
  const result: ParsedImport = { rows: [], invalid: 0, skipped: 0, noEmail: 0, missingName: 0 }
  if (lines.length === 0) return result

  const first = parseLine(lines[0])
  const hasHeader = first.some((c) => /email/i.test(c)) && !first.some((c) => c.includes('@'))

  let emailCol = 0
  let nameCols: number[] = []
  let phoneCols: number[] = []
  let addressCols: { street: number[]; city: number[]; state: number[]; zip: number[]; country: number[] } = { street: [], city: [], state: [], zip: [], country: [] }
  let statusCols: number[] = []

  if (hasHeader) {
    emailCol = first.findIndex((c) => /e-?mail/i.test(c) && !/status|permission|list|opt/i.test(c))
    if (emailCol < 0) emailCol = first.findIndex((c) => /e-?mail/i.test(c))
    const firstName = first.findIndex((c) => /first\s*name/i.test(c))
    const lastName = first.findIndex((c) => /last\s*name/i.test(c))
    const fullName = first.findIndex((c) => /^(full\s*)?name$/i.test(c))
    nameCols = [firstName, lastName].filter((i) => i >= 0)
    if (nameCols.length === 0 && fullName >= 0) nameCols = [fullName]

    // Mobile numbers first, then other phone columns; the SMS number is a last resort.
    const phones = indexes(first, (h) => /phone|mobile|cell/i.test(h) && !/sms/i.test(h))
    phoneCols = [...phones.filter((i) => /mobile|cell/i.test(first[i])), ...phones.filter((i) => !/mobile|cell/i.test(first[i])), ...indexes(first, (h) => /sms\s*number/i.test(h))]

    const notEmail = (h: string) => !/e-?mail/i.test(h)
    addressCols = {
      street: indexes(first, (h) => notEmail(h) && /street|address\s*line/i.test(h)),
      city: indexes(first, (h) => /^city\b/i.test(h)),
      state: indexes(first, (h) => /^state|province/i.test(h)),
      zip: indexes(first, (h) => /zip|postal/i.test(h)),
      country: indexes(first, (h) => /^country\b/i.test(h)),
    }
    statusCols = indexes(first, (h) => /status|permission/i.test(h) && !/sms|phone|text/i.test(h))
  }

  const seen = new Set<string>()
  for (const line of lines.slice(hasHeader ? 1 : 0)) {
    const cells = parseLine(line)

    const checkCells = hasHeader ? statusCols.map((i) => cells[i] ?? '') : cells
    if (checkCells.some((c) => OPTED_OUT.test(c))) {
      result.skipped++
      continue
    }

    const rawEmail = cells[emailCol] ?? ''
    if (!rawEmail) {
      result.noEmail++
      continue
    }
    const email = normalizeEmail(rawEmail)
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
    const phone = firstValue(cells, phoneCols).slice(0, 40)
    const place = [firstValue(cells, addressCols.street), [firstValue(cells, addressCols.city), [firstValue(cells, addressCols.state), firstValue(cells, addressCols.zip)].filter(Boolean).join(' ')].filter(Boolean).join(', '), firstValue(cells, addressCols.country)]
    const address = place.filter(Boolean).join(', ').slice(0, 300)

    if (!name) result.missingName++
    result.rows.push({ email, name, phone, address })
  }
  return result
}
