import { esc } from './html'

// A deliberately small, safe subset of Markdown for writing emails:
// # headings, paragraphs, **bold**, *italic*, [links](https://...),
// ![images](https://...), - lists, > quotes, and --- rules.
// All text is HTML-escaped first, and only http(s) and mailto links are allowed.

const LINK_COLOR = '#8a5a2c'

function inline(raw: string): string {
  let out = esc(raw)
  out = out.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, alt: string, url: string) => `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:6px">`,
  )
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    (_m, text: string, url: string) => `<a href="${url}" style="color:${LINK_COLOR}">${text}</a>`,
  )
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  return out
}

export function markdownToHtml(source: string): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: string[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let quote: string[] = []

  const flush = () => {
    if (paragraph.length) {
      blocks.push(`<p style="margin:0 0 16px">${paragraph.map(inline).join('<br>')}</p>`)
      paragraph = []
    }
    if (list.length) {
      blocks.push(`<ul style="margin:0 0 16px;padding-left:22px">${list.map((li) => `<li style="margin:0 0 6px">${inline(li)}</li>`).join('')}</ul>`)
      list = []
    }
    if (quote.length) {
      blocks.push(
        `<blockquote style="margin:0 0 16px;padding:2px 16px;border-left:3px solid #e6e2d8;color:#6b6475">${quote.map(inline).join('<br>')}</blockquote>`,
      )
      quote = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed)
    if (!trimmed) {
      flush()
    } else if (heading) {
      flush()
      const level = heading[1].length
      const size = level === 1 ? 28 : level === 2 ? 22 : 18
      const align = level === 1 ? 'center' : 'left'
      // The main headline gets extra room before the greeting; subheadings stay snug to their text.
      const bottom = level === 1 ? 22 : 12
      blocks.push(`<h${level} style="margin:24px 0 ${bottom}px;font:700 ${size}px/1.25 Arial,Helvetica,sans-serif;color:#1a1522;text-align:${align}">${inline(heading[2])}</h${level}>`)
    } else if (/^---+$/.test(trimmed)) {
      flush()
      blocks.push('<hr style="border:0;border-top:1px solid #e6e2d8;margin:22px 0">')
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (paragraph.length || quote.length) flush()
      list.push(trimmed.replace(/^[-*]\s+/, ''))
    } else if (trimmed.startsWith('>')) {
      if (paragraph.length || list.length) flush()
      quote.push(trimmed.replace(/^>\s?/, ''))
    } else {
      if (list.length || quote.length) flush()
      paragraph.push(trimmed)
    }
  }
  flush()
  return blocks.join('\n')
}

export function markdownToText(source: string): string {
  return source
    .replace(/\r\n?/g, '\n')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^---+$/gm, '--------')
    .trim()
}
