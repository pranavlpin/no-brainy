'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const basicSyntax = [
  { element: 'Heading', syntax: '# H1 / ## H2 / ### H3' },
  { element: 'Bold', syntax: '**bold text**' },
  { element: 'Italic', syntax: '*italicized text*' },
  { element: 'Blockquote', syntax: '> blockquote' },
  { element: 'Ordered List', syntax: '1. First item' },
  { element: 'Unordered List', syntax: '- First item' },
  { element: 'Code', syntax: '`code`' },
  { element: 'Horizontal Rule', syntax: '---' },
  { element: 'Link', syntax: '[title](https://url.com)' },
  { element: 'Image', syntax: '![alt text](image.jpg)' },
]

const extendedSyntax = [
  { element: 'Table', syntax: '| Header | Title |\\n| --- | --- |' },
  { element: 'Code Block', syntax: '```lang\\ncode\\n```' },
  { element: 'Strikethrough', syntax: '~~struck text~~' },
  { element: 'Task List', syntax: '- [x] Done\\n- [ ] Todo' },
  { element: 'Footnote', syntax: 'Text [^1]\\n[^1]: Note' },
  { element: 'Highlight', syntax: '==highlighted==' },
  { element: 'Subscript', syntax: 'H~2~O' },
  { element: 'Superscript', syntax: 'X^2^' },
]

function SyntaxTable({ title, items, defaultOpen = true }: {
  title: string
  items: { element: string; syntax: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {items.map((item) => (
            <div key={item.element} className="flex items-baseline gap-2 text-xs">
              <span className="shrink-0 w-24 text-muted-foreground">{item.element}</span>
              <code className="flex-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground break-all">
                {item.syntax}
              </code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MarkdownCheatsheet() {
  const [visible, setVisible] = useState(false)

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed left-4 bottom-4 z-40 flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground hover:shadow-md transition-all"
        title="Markdown Guide"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Markdown Guide
      </button>
    )
  }

  return (
    <div className="fixed left-4 bottom-4 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <BookOpen className="h-4 w-4" />
          Markdown Guide
        </span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4 p-3">
        <SyntaxTable title="Basic Syntax" items={basicSyntax} />
        <SyntaxTable title="Extended Syntax" items={extendedSyntax} defaultOpen={false} />
      </div>
    </div>
  )
}
