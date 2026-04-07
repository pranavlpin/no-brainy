'use client'

import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'

const syntaxItems = [
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
  { element: 'Table', syntax: '| Header | Title |\\n| --- | --- |' },
  { element: 'Code Block', syntax: '```lang\\ncode\\n```' },
  { element: 'Strikethrough', syntax: '~~struck text~~' },
  { element: 'Task List', syntax: '- [x] Done\\n- [ ] Todo' },
  { element: 'Footnote', syntax: 'Text [^1]\\n[^1]: Note' },
  { element: 'Highlight', syntax: '==highlighted==' },
  { element: 'Subscript', syntax: 'H~2~O' },
  { element: 'Superscript', syntax: 'X^2^' },
]

export function MarkdownCheatsheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 bottom-4 z-40 flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground hover:shadow-md transition-all"
        title="Markdown Guide"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Markdown Guide
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Popup */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                Markdown Syntax Guide
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="space-y-1.5">
                {syntaxItems.map((item) => (
                  <div key={item.element} className="flex items-baseline gap-3 text-sm">
                    <span className="w-28 shrink-0 text-muted-foreground">
                      {item.element}
                    </span>
                    <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                      {item.syntax}
                    </code>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <span className="text-xs text-muted-foreground">
                Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">Esc</kbd> to close
              </span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
