"use client"

import { useEffect, useRef, useCallback } from "react"
import { EditorView, keymap, placeholder as placeholderExt, highlightSpecialChars, type KeyBinding } from "@codemirror/view"
import { EditorState, type StateCommand } from "@codemirror/state"
import { markdown } from "@codemirror/lang-markdown"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-content": {
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
    lineHeight: "1.6",
    padding: "16px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "0 4px",
  },
})

// Wrap selected text with markdown syntax, or insert placeholder if no selection
function wrapSelection(prefix: string, suffix: string, placeholder: string): StateCommand {
  return ({ state, dispatch }) => {
    const { from, to } = state.selection.main
    const selected = state.sliceDoc(from, to)

    if (selected) {
      // Check if already wrapped — toggle off
      const beforePrefix = state.sliceDoc(Math.max(0, from - prefix.length), from)
      const afterSuffix = state.sliceDoc(to, to + suffix.length)
      if (beforePrefix === prefix && afterSuffix === suffix) {
        dispatch(state.update({
          changes: [
            { from: from - prefix.length, to: from, insert: '' },
            { from: to, to: to + suffix.length, insert: '' },
          ],
          selection: { anchor: from - prefix.length, head: to - prefix.length },
        }))
        return true
      }
      // Wrap selection
      dispatch(state.update({
        changes: [
          { from, insert: prefix },
          { from: to, insert: suffix },
        ],
        selection: { anchor: from + prefix.length, head: to + prefix.length },
      }))
    } else {
      // No selection — insert with placeholder
      const text = `${prefix}${placeholder}${suffix}`
      dispatch(state.update({
        changes: { from, insert: text },
        selection: { anchor: from + prefix.length, head: from + prefix.length + placeholder.length },
      }))
    }
    return true
  }
}

const markdownKeymap: KeyBinding[] = [
  { key: "Mod-b", run: wrapSelection("**", "**", "bold"), preventDefault: true },
  { key: "Mod-i", run: wrapSelection("*", "*", "italic"), preventDefault: true },
  { key: "Mod-u", run: wrapSelection("<u>", "</u>", "underline"), preventDefault: true },
  { key: "Mod-Shift-x", run: wrapSelection("~~", "~~", "strikethrough"), preventDefault: true },
  { key: "Mod-e", run: wrapSelection("`", "`", "code"), preventDefault: true },
]

export function CodeMirrorEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep callback ref current without triggering re-creation
  onChangeRef.current = onChange

  const createExtensions = useCallback(() => {
    const extensions = [
      baseTheme,
      markdown(),
      syntaxHighlighting(defaultHighlightStyle),
      highlightSpecialChars(),
      history(),
      search({ top: true }),
      highlightSelectionMatches(),
      keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
    ]

    if (placeholder) {
      extensions.push(placeholderExt(placeholder))
    }

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true))
      extensions.push(EditorView.editable.of(false))
    }

    return extensions
  }, [placeholder, readOnly])

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createExtensions])

  // Update value from outside (avoid feedback loop)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      })
    }
  }, [value])

  // Block browser shortcuts that conflict with CodeMirror when editor is focused
  const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return

    // Block browser defaults for editor shortcuts
    // Cmd+F: find, Cmd+H: replace, Cmd+G: find next, Cmd+D: bookmark
    // Cmd+B: bold, Cmd+I: italic, Cmd+U: underline, Cmd+E: inline code
    if (['f', 'h', 'g', 'd', 'b', 'i', 'u', 'e'].includes(e.key.toLowerCase())) {
      e.preventDefault()
    }
    // Cmd+Shift+X: strikethrough
    if (e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="h-full overflow-auto [&_.cm-editor]:h-full"
    />
  )
}
