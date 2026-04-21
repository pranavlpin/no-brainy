import { type CompletionContext, type Completion } from '@codemirror/autocomplete'
import { type EditorView } from '@codemirror/view'

interface SlashCommand {
  label: string
  detail: string
  insert: string
  cursorOffset?: number // offset from end of insert to place cursor
}

const STATIC_COMMANDS: SlashCommand[] = [
  { label: '/h1', detail: 'Heading 1', insert: '# ', cursorOffset: 0 },
  { label: '/h2', detail: 'Heading 2', insert: '## ', cursorOffset: 0 },
  { label: '/h3', detail: 'Heading 3', insert: '### ', cursorOffset: 0 },
  { label: '/bullets', detail: 'Bullet list', insert: '- ', cursorOffset: 0 },
  { label: '/numbered', detail: 'Numbered list', insert: '1. ', cursorOffset: 0 },
  { label: '/todo', detail: 'Unchecked todo', insert: '- [ ] ', cursorOffset: 0 },
  { label: '/done', detail: 'Checked todo', insert: '- [x] ', cursorOffset: 0 },
  { label: '/code', detail: 'Code block', insert: '```\n\n```', cursorOffset: 4 },
  { label: '/codejs', detail: 'JavaScript block', insert: '```javascript\n\n```', cursorOffset: 4 },
  { label: '/codets', detail: 'TypeScript block', insert: '```typescript\n\n```', cursorOffset: 4 },
  { label: '/codepy', detail: 'Python block', insert: '```python\n\n```', cursorOffset: 4 },
  { label: '/codebash', detail: 'Bash block', insert: '```bash\n\n```', cursorOffset: 4 },
  { label: '/codejson', detail: 'JSON block', insert: '```json\n\n```', cursorOffset: 4 },
  { label: '/codesql', detail: 'SQL block', insert: '```sql\n\n```', cursorOffset: 4 },
  { label: '/quote', detail: 'Blockquote', insert: '> ', cursorOffset: 0 },
  { label: '/divider', detail: 'Horizontal rule', insert: '\n---\n', cursorOffset: 0 },
  { label: '/table', detail: 'Table (3 cols)', insert: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n|          |          |          |\n', cursorOffset: 0 },
  { label: '/table2', detail: 'Table (2 cols)', insert: '| Column 1 | Column 2 |\n|----------|----------|\n|          |          |\n', cursorOffset: 0 },
  { label: '/table4', detail: 'Table (4 cols)', insert: '| Col 1 | Col 2 | Col 3 | Col 4 |\n|-------|-------|-------|-------|\n|       |       |       |       |\n', cursorOffset: 0 },
  { label: '/date', detail: 'Insert today\'s date', insert: new Date().toISOString().split('T')[0], cursorOffset: 0 },
  { label: '/callout', detail: 'Callout box', insert: '> **Note:** ', cursorOffset: 0 },
  { label: '/url', detail: 'External link [text](url)', insert: '[text](https://)', cursorOffset: 1 },
]

function applySlashCommand(
  view: EditorView,
  completion: Completion,
  from: number,
  to: number
): void {
  const cmd = completion as Completion & { _insert: string; _cursorOffset: number }
  const insert = cmd._insert
  const cursorOffset = cmd._cursorOffset

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length - cursorOffset },
  })
}

export function slashCommandCompletions(context: CompletionContext): { from: number; options: Completion[] } | null {
  // Match / at start of line or after whitespace
  const word = context.matchBefore(/\/\w*/)
  if (!word) return null
  if (word.from > 0) {
    const charBefore = context.state.sliceDoc(word.from - 1, word.from)
    if (charBefore !== '\n' && charBefore !== ' ' && charBefore !== '\t' && word.from !== 0) {
      return null // only trigger at line start or after space
    }
  }

  // Update /date to current date
  const commands = STATIC_COMMANDS.map((cmd) => {
    if (cmd.label === '/date') {
      return { ...cmd, insert: new Date().toISOString().split('T')[0] }
    }
    return cmd
  })

  const options: Completion[] = commands.map((cmd) => ({
    label: cmd.label,
    detail: cmd.detail,
    type: 'keyword',
    _insert: cmd.insert,
    _cursorOffset: cmd.cursorOffset ?? 0,
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      applySlashCommand(view, { ...(_completion as object), _insert: cmd.insert, _cursorOffset: cmd.cursorOffset ?? 0 } as Completion & { _insert: string; _cursorOffset: number }, from, to)
    },
  }))

  return { from: word.from, options }
}
