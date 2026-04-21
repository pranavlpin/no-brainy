'use client'

import { useState } from 'react'
import { BookOpen, X, Keyboard } from 'lucide-react'

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
  { element: 'Color Block', syntax: ':::blue\\ncontent\\n:::' },
  { element: 'Inline Color', syntax: '{red}colored text{/red}' },
]

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
const mod = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { category: 'Find & Replace', items: [
    { action: 'Find', keys: `${mod}+F` },
    { action: 'Find & Replace', keys: `${mod}+H` },
    { action: 'Find Next', keys: `${mod}+G` },
    { action: 'Find Previous', keys: `${mod}+Shift+G` },
    { action: 'Select matching text', keys: 'Select text → all matches highlight' },
  ]},
  { category: 'Formatting', items: [
    { action: 'Bold', keys: `${mod}+B` },
    { action: 'Italic', keys: `${mod}+I` },
    { action: 'Underline', keys: `${mod}+U` },
    { action: 'Strikethrough', keys: `${mod}+Shift+X` },
    { action: 'Inline Code', keys: `${mod}+E` },
  ]},
  { category: 'Editing', items: [
    { action: 'Undo', keys: `${mod}+Z` },
    { action: 'Redo', keys: `${mod}+Shift+Z` },
    { action: 'Select All', keys: `${mod}+A` },
    { action: 'Indent', keys: 'Tab' },
    { action: 'Outdent', keys: 'Shift+Tab' },
  ]},
  { category: 'View', items: [
    { action: 'Fullscreen', keys: 'Click maximize icon in toolbar' },
    { action: 'Exit Fullscreen', keys: 'Esc' },
    { action: 'Split View', keys: 'Toolbar: Split' },
    { action: 'Editor Only', keys: 'Toolbar: Editor' },
    { action: 'Preview Only', keys: 'Toolbar: Preview' },
  ]},
]

const slashCommands = [
  { category: 'Headings & Text', items: [
    { command: '/h1', desc: 'Heading 1' },
    { command: '/h2', desc: 'Heading 2' },
    { command: '/h3', desc: 'Heading 3' },
    { command: '/quote', desc: 'Blockquote' },
    { command: '/callout', desc: 'Callout box' },
    { command: '/divider', desc: 'Horizontal rule' },
  ]},
  { category: 'Lists', items: [
    { command: '/bullets', desc: 'Bullet list' },
    { command: '/numbered', desc: 'Numbered list' },
    { command: '/todo', desc: 'Unchecked todo' },
    { command: '/done', desc: 'Checked todo' },
  ]},
  { category: 'Code & Tables', items: [
    { command: '/code', desc: 'Code block' },
    { command: '/codejs', desc: 'JavaScript block' },
    { command: '/codepy', desc: 'Python block' },
    { command: '/codebash', desc: 'Bash block' },
    { command: '/codejson', desc: 'JSON block' },
    { command: '/codesql', desc: 'SQL block' },
    { command: '/table', desc: 'Table (3 cols)' },
    { command: '/table2', desc: 'Table (2 cols)' },
    { command: '/table4', desc: 'Table (4 cols)' },
  ]},
  { category: 'Color Blocks', items: [
    { command: '/blue', desc: 'Blue background block' },
    { command: '/red', desc: 'Red background block' },
    { command: '/green', desc: 'Green background block' },
    { command: '/yellow', desc: 'Yellow background block' },
    { command: '/purple', desc: 'Purple background block' },
    { command: '/orange', desc: 'Orange background block' },
    { command: '/gray', desc: 'Gray background block' },
  ]},
  { category: 'Other', items: [
    { command: '/date', desc: "Insert today's date" },
    { command: '/link', desc: 'Search & link to a note' },
    { command: '/url', desc: 'External link [text](url)' },
  ]},
]

type Tab = 'syntax' | 'shortcuts' | 'commands'

export function MarkdownCheatsheet(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('syntax')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 flex items-center gap-1.5 border-2 border-r-0 border-retro-dark/20 bg-card px-3 py-2 text-xs font-mono font-medium text-muted-foreground shadow-sm hover:text-foreground hover:shadow-md transition-all"
        title="Guide"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Guide
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-2 border-retro-dark bg-card shadow-hard">
            <div className="flex items-center justify-between border-b-2 border-retro-dark/10 px-4 py-3">
              <span className="flex items-center gap-2 font-display text-sm font-bold text-retro-dark">
                <BookOpen className="h-4 w-4" />
                Guide
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-retro-dark/10">
              <button
                onClick={() => setTab('syntax')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-medium transition-colors ${
                  tab === 'syntax'
                    ? 'border-b-2 border-retro-blue text-retro-dark'
                    : 'text-retro-dark/40 hover:text-retro-dark/70'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Markdown Syntax
              </button>
              <button
                onClick={() => setTab('shortcuts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-medium transition-colors ${
                  tab === 'shortcuts'
                    ? 'border-b-2 border-retro-blue text-retro-dark'
                    : 'text-retro-dark/40 hover:text-retro-dark/70'
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" />
                Shortcuts
              </button>
              <button
                onClick={() => setTab('commands')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-medium transition-colors ${
                  tab === 'commands'
                    ? 'border-b-2 border-retro-blue text-retro-dark'
                    : 'text-retro-dark/40 hover:text-retro-dark/70'
                }`}
              >
                <span className="font-mono text-sm">/</span>
                Commands
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {tab === 'syntax' && (
                <div className="space-y-1.5">
                  {syntaxItems.map((item) => (
                    <div key={item.element} className="flex items-baseline gap-3 text-sm">
                      <span className="w-28 shrink-0 font-mono text-xs text-retro-dark/50">
                        {item.element}
                      </span>
                      <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs text-retro-dark">
                        {item.syntax}
                      </code>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'shortcuts' && (
                <div className="space-y-5">
                  {shortcuts.map((section) => (
                    <div key={section.category}>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-retro-dark/50 mb-2">
                        {section.category}
                      </h3>
                      <div className="space-y-1.5">
                        {section.items.map((item) => (
                          <div key={item.action} className="flex items-center justify-between text-sm">
                            <span className="text-retro-dark/70">{item.action}</span>
                            <kbd className="border border-retro-dark/15 bg-muted px-2 py-0.5 font-mono text-xs text-retro-dark">
                              {item.keys}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'commands' && (
                <div className="space-y-5">
                  <p className="text-xs text-retro-dark/50">
                    Type <kbd className="border border-retro-dark/15 bg-muted px-1 py-0.5 font-mono text-[10px]">/</kbd> at the start of a line or after a space to open the command palette.
                  </p>
                  {slashCommands.map((section) => (
                    <div key={section.category}>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-retro-dark/50 mb-2">
                        {section.category}
                      </h3>
                      <div className="space-y-1.5">
                        {section.items.map((item) => (
                          <div key={item.command} className="flex items-center justify-between text-sm">
                            <code className="font-mono text-xs text-retro-blue">{item.command}</code>
                            <span className="text-retro-dark/60 text-xs">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t-2 border-retro-dark/10 px-4 py-2.5 text-center">
              <span className="font-mono text-xs text-muted-foreground">
                Press <kbd className="border border-retro-dark/15 bg-muted px-1.5 py-0.5 text-[10px] font-mono">Esc</kbd> to close
              </span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
