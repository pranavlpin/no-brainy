import type { ReactNode } from "react"

/**
 * Parses text content and replaces [[WikiLink]] patterns with WikiLink components.
 * Used as a helper in the markdown preview custom component renderer.
 */
const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g

export function parseWikiLinks(
  text: string,
  createLink: (title: string, key: string) => ReactNode
): (string | ReactNode)[] {
  const parts: (string | ReactNode)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = WIKI_LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(createLink(match[1], `wiki-${match.index}`))
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}
