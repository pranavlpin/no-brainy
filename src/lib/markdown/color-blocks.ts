/**
 * Color system for NoBrainy notes:
 * - :::color ... ::: → colored background blocks
 * - {color}text{/color} → inline text color
 */

const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  red:    { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' },
  green:  { bg: '#DCFCE7', border: '#22C55E', text: '#16A34A' },
  yellow: { bg: '#FEF9C3', border: '#EAB308', text: '#A16207' },
  purple: { bg: '#F3E8FF', border: '#A855F7', text: '#7C3AED' },
  orange: { bg: '#FFEDD5', border: '#F97316', text: '#EA580C' },
  gray:   { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563' },
}

const INLINE_COLORS: Record<string, string> = {
  blue: '#2563EB',
  red: '#DC2626',
  green: '#16A34A',
  yellow: '#A16207',
  purple: '#7C3AED',
  orange: '#EA580C',
  gray: '#6B7280',
}

/**
 * Process :::color blocks into HTML divs
 * Converts:
 *   :::blue
 *   content here
 *   :::
 * Into an HTML div with background color
 */
function processColorBlocks(content: string): string {
  const colorNames = Object.keys(COLORS).join('|')
  const blockRegex = new RegExp(
    `^:::(${colorNames})\\s*\\n([\\s\\S]*?)\\n:::`,
    'gm'
  )

  return content.replace(blockRegex, (_match, color: string, inner: string) => {
    const c = COLORS[color]
    if (!c) return _match
    return `<div class="color-block color-block-${color}" style="background:${c.bg};border-left:4px solid ${c.border};padding:12px 16px;margin:8px 0;">\n\n${inner.trim()}\n\n</div>`
  })
}

/**
 * Process {color}text{/color} into colored spans
 */
function processInlineColors(content: string): string {
  const colorNames = Object.keys(INLINE_COLORS).join('|')
  const inlineRegex = new RegExp(
    `\\{(${colorNames})\\}(.*?)\\{/\\1\\}`,
    'gs'
  )

  return content.replace(inlineRegex, (_match, color: string, inner: string) => {
    const c = INLINE_COLORS[color]
    if (!c) return _match
    return `<span class="inline-color inline-color-${color}" style="color:${c}">${inner}</span>`
  })
}

/**
 * Process all color syntax in markdown content
 */
export function processColors(content: string): string {
  let result = processColorBlocks(content)
  result = processInlineColors(result)
  return result
}

/**
 * Strip all color HTML for plain printing
 */
export function stripColorStyles(html: string): string {
  // Remove background/border styles from color blocks but keep content
  return html
    .replace(/style="background:[^"]*;border-left:[^"]*;padding:[^"]*;margin:[^"]*;"/g, '')
    .replace(/style="color:[^"]*"/g, '')
}

/**
 * Get CSS for color blocks and inline colors (for print/export)
 */
export function getColorCSS(): string {
  let css = ''
  for (const [name, c] of Object.entries(COLORS)) {
    css += `.color-block-${name} { background: ${c.bg} !important; border-left: 4px solid ${c.border} !important; padding: 12px 16px !important; margin: 8px 0 !important; }\n`
  }
  for (const [name, c] of Object.entries(INLINE_COLORS)) {
    css += `.inline-color-${name} { color: ${c} !important; }\n`
  }
  return css
}

export { COLORS, INLINE_COLORS }
