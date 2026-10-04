import type { Env } from './env'

// A strong, free-tier writing model on Cloudflare's built-in AI.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

const VOICE = `You help Dr. Sanjay Prajapati, a Messianic Jewish teacher and author, write the Destined4Torah email newsletter. His voice is warm, reverent, clear and encouraging, rooted in the Torah and in Scripture's Jewish context from Genesis to Revelation. Write plainly, in short paragraphs. Do not use emojis, hype, clickbait, or ALL CAPS. Never invent facts, events, dates, quotations, or Bible verses: use only what the writer gave you.`

const FORMAT = `The message uses simple Markdown: a first line starting with "# " is the headline; **bold**, *italic*, and lines starting with "- " for lists. Keep any links and web addresses the writer gave you exactly as written, but never create a link or web address of your own and never write placeholder links. Do NOT write a greeting like "Dear ..." because one is added automatically for each reader.`

/**
 * Safety net: a model sometimes invents a link. Keep a Markdown link only if its
 * address appears in the writer's own text; otherwise keep just the link text.
 */
function keepOnlyKnownLinks(output: string, source: string): string {
  return output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (match, text: string, url: string) => (source.includes(url) ? match : text))
}

async function ask(env: Env, system: string, user: string, maxTokens: number): Promise<string> {
  const run = (env.AI as unknown as { run: (model: string, input: unknown) => Promise<{ response?: string }> }).run.bind(env.AI)
  const result = await run(MODEL, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  })
  return (result.response ?? '').trim()
}

function cleanLine(line: string): string {
  return line
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim()
}

export async function suggestSubjects(env: Env, subject: string, body: string): Promise<string[]> {
  const text = await ask(
    env,
    VOICE,
    `Write 6 different email subject lines for this newsletter. Mix styles: a direct one, a curiosity one, a Scripture-focused one, a warm personal one. Each under 60 characters, no quotation marks, no numbering, no emojis, and avoid spam words like FREE or URGENT. Output only the 6 lines, one per line.\n\nCurrent subject: ${subject || '(none yet)'}\n\nMessage:\n${body.slice(0, 4000)}`,
    300,
  )
  const lines = text.split('\n').map(cleanLine).filter((l) => l.length >= 8 && l.length <= 90)
  return [...new Set(lines)].slice(0, 6)
}

export async function improveBody(env: Env, subject: string, body: string): Promise<string> {
  const improved = await ask(
    env,
    `${VOICE}\n\n${FORMAT}`,
    `Improve the writer's draft: fix grammar and flow, tighten wordy sentences, and make it warm and clear, while keeping his meaning, his voice, and all the facts, names and links exactly as they are. Do not add new claims, stories, or Bible verses. Keep it about the same length. Return only the improved message.\n\nSubject: ${subject || '(none yet)'}\n\nDraft:\n${body.slice(0, 6000)}`,
    1800,
  )
  return keepOnlyKnownLinks(improved, body)
}

export async function draftFromNotes(env: Env, subject: string, notes: string): Promise<string> {
  const draft = await ask(
    env,
    `${VOICE}\n\n${FORMAT}`,
    `Write a first draft of a newsletter from the writer's notes. Start with a "# " headline, then 3 to 5 short paragraphs (about 200 to 300 words in all), then end with "Blessings," on its own line followed by **Dr. Sanjay Prajapati**. Use only the ideas and Scripture references in the notes; do not quote verses word for word, do not add facts, and do not include any links unless the notes contain them. Return only the message.\n\nSubject: ${subject || '(none yet)'}\n\nNotes:\n${notes.slice(0, 3000)}`,
    1500,
  )
  return keepOnlyKnownLinks(draft, notes)
}
