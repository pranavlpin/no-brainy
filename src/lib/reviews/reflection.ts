/**
 * The nightly reflection is stored as one markdown document with a heading
 * per prompt, so it stays readable in any markdown viewer while the UI can
 * still split it back into fields.
 */

export interface ReflectionFields {
  wentWell: string
  stuck: string
  learned: string
}

export const REFLECTION_PROMPTS: ReadonlyArray<{
  key: keyof ReflectionFields
  heading: string
  prompt: string
  placeholder: string
}> = [
  {
    key: 'wentWell',
    heading: 'What went well',
    prompt: 'What moved forward today?',
    placeholder: 'One or two wins, however small…',
  },
  {
    key: 'stuck',
    heading: 'Where I got stuck',
    prompt: 'What slowed you down or slipped?',
    placeholder: 'Blockers, distractions, or things you avoided…',
  },
  {
    key: 'learned',
    heading: 'What I learned',
    prompt: 'What would you tell yesterday-you?',
    placeholder: 'A lesson, a pattern, a reminder…',
  },
]

/** Join the three fields into markdown, skipping empty sections. */
export function buildReflectionMd(fields: ReflectionFields): string {
  const parts: string[] = []
  for (const p of REFLECTION_PROMPTS) {
    const text = fields[p.key]?.trim()
    if (text) parts.push(`## ${p.heading}\n\n${text}`)
  }
  return parts.join('\n\n')
}

/** Split stored markdown back into fields; plain legacy text lands in `wentWell`. */
export function parseReflectionMd(md: string): ReflectionFields {
  const fields: ReflectionFields = { wentWell: '', stuck: '', learned: '' }
  const text = (md ?? '').trim()
  if (!text) return fields

  const headingRe = /^##\s+(.+)$/gm
  const matches = Array.from(text.matchAll(headingRe))
  if (matches.length === 0) {
    fields.wentWell = text
    return fields
  }

  const byHeading = new Map(REFLECTION_PROMPTS.map((p) => [p.heading.toLowerCase(), p.key]))
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const key = byHeading.get(m[1].trim().toLowerCase())
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    const body = text.slice(start, end).trim()
    if (key) fields[key] = body
    else if (body) fields.wentWell = fields.wentWell ? `${fields.wentWell}\n\n${body}` : body
  }
  return fields
}
