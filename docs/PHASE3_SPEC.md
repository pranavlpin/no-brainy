# Phase 3 Technical Specification: Scale

**Version:** 1.0
**Date:** 2026-03-31
**Status:** Ready for Implementation
**PRD Reference:** `docs/MyFocusHub_PRD.md` v1.0 -- Sections 3.7, 3.9, 6.3, 6.4
**Phase 1 Spec:** `docs/TECHNICAL_SPEC.md` v1.0
**Phase 2 Spec:** `docs/PHASE2_SPEC.md` v1.0

---

## 1. Architecture Overview

### 1.1 Phase 3 Scope

Seven features, ordered by priority:

| # | Feature | Priority | AI Required | Schema Change |
|---|---------|----------|-------------|---------------|
| 1 | Insight Engine (full) | P0 | Yes | No (Insight model exists) |
| 2 | Enhanced Search | P0 | No | No |
| 3 | Focus Mode + Pomodoro | P1 | No | No |
| 4 | Flashcard Quiz Mode | P1 | No | Yes (QuizSession model) |
| 5 | Note Bi-directional Linking | P1 | No | No (NoteLink model exists) |
| 6 | AI Knowledge Distillation | P1 | Yes | No |
| 7 | Smart Reminders / Notifications | P1 | No | Yes (Notification model) |

**Out of scope:** React Native mobile app, Collaboration/sharing, pgvector/semantic search (requires infrastructure changes).

### 1.2 Dependency Graph

```
                    ┌──────────────────┐
                    │ Shared: UI Store  │
                    │ (focus mode state)│
                    └────────┬─────────┘
                             │
    ┌────────────────────────┼───────────────────────┐
    │                        │                        │
┌───┴────┐           ┌──────┴───────┐         ┌──────┴──────┐
│Feature 3│           │  Feature 1   │         │  Feature 7  │
│Focus    │           │  Insight     │         │  Smart      │
│Mode +   │           │  Engine      │         │  Reminders  │
│Pomodoro │           │              │         │             │
└─────────┘           └──────────────┘         └─────────────┘

    Independent features (can run in parallel):
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │Feature 2 │   │Feature 4 │   │  Feature 5   │
    │Enhanced  │   │Quiz Mode │   │  Bi-dir      │
    │Search    │   │          │   │  Links       │
    └──────────┘   └──────────┘   └──────────────┘

    Feature 6 (AI Distillation) depends on Feature 1 (Insight Engine)
    being done first (shared AI prompt patterns).
```

### 1.3 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Insight generation | On-demand via API call (not scheduled) | No Redis/BullMQ in current stack. User triggers insight refresh from dashboard or insights page. |
| Search upgrade | Enhanced relevance scoring (no pgvector) | pgvector requires DB extension setup. Improve keyword search with word-boundary matching, multi-term scoring, and field weighting instead. |
| Focus Mode state | Zustand UI store | Purely client-side UI state. No persistence needed -- focus mode is per-session. |
| Pomodoro timer | Client-side with `useRef` for interval | No server involvement. Timer state lives in React component. |
| Quiz scoring | New `QuizSession` Prisma model | Distinct from `ReviewSession` -- quiz has score, timer, and different flow (multiple choice for cloze). |
| Notifications | Web Push API + Service Worker | Native browser push. Fallback to in-app notification center for browsers without push support. |
| Notification storage | New `Notification` Prisma model | Persistent notification log with read/unread state. |
| Bi-directional links | Query existing `NoteLink` table inversely | No new tables needed. Backlinks = `SELECT * FROM note_links WHERE targetId = :noteId AND targetType = 'note'`. |
| Link graph | Simple force-directed using `d3-force` | Lightweight. No heavy graph library. Render as SVG. |

---

## 2. Feature 1: Insight Engine (Full)

### 2.1 Overview

AI-powered pattern detection that analyzes user behavior across tasks, notes, flashcards, and habits to surface actionable insights. The `Insight` Prisma model already exists. This feature adds the generation logic, API endpoints, and UI.

### 2.2 Insight Types

| Type | Key | Data Sources | Model |
|------|-----|-------------|-------|
| Procrastination Pattern | `procrastination` | Tasks overdue > 3 days, repeatedly rescheduled | gpt-4o-mini |
| Workload Imbalance | `workload` | Task due dates grouped by day-of-week | gpt-4o-mini |
| Priority Mismatch | `priority` | Completion rates by priority level | gpt-4o-mini |
| Consistency Streak | `streak` | Habit logs, flashcard review sessions | gpt-4o-mini |
| Knowledge Gap | `gap` | Flashcard ratings (cards with state='learning', high forgot rate) | gpt-4o-mini |
| Time Patterns | `time` | Task completion timestamps, note creation times | gpt-4o-mini |
| Topic Clusters | `topic` | Note tags frequency, book genres | gpt-4o-mini |

### 2.3 Data Aggregation (Server-Side)

Before calling the AI, aggregate raw data into a structured summary. This keeps prompts small and cost-effective.

```typescript
// src/lib/ai/insights/aggregate-user-data.ts

export interface UserDataSummary {
  tasks: {
    total: number
    completedLast30Days: number
    overdueCount: number
    overdueTasks: Array<{ title: string; dueDate: string; daysPastDue: number }>
    completionByPriority: Record<string, { total: number; completed: number }>
    completionByDayOfWeek: Record<string, number> // Mon=0..Sun=6
    completionTimestamps: string[] // ISO timestamps of last 50 completions
  }
  notes: {
    totalCreatedLast30Days: number
    tagFrequency: Record<string, number> // tag -> count
    creationTimestamps: string[]
  }
  flashcards: {
    totalReviewed: number
    forgotRate: number // percentage
    weakTags: Array<{ tag: string; forgotCount: number }>
    reviewStreak: number // consecutive days
  }
  habits: {
    habits: Array<{
      title: string
      frequency: string
      currentStreak: number
      completionRate30d: number // percentage
    }>
  }
}

export async function aggregateUserData(userId: string): Promise<UserDataSummary>
```

### 2.4 API Design

#### `POST /api/insights/generate`

Generates insights on demand. Clears expired insights, aggregates user data, calls AI, persists new insights.

```typescript
// src/app/api/insights/generate/route.ts

// Request: empty body (uses authenticated user)
// Response:
{
  success: true,
  data: {
    insights: Insight[], // newly generated insights
    generatedAt: string  // ISO timestamp
  }
}
```

Implementation flow:
1. `withAI` middleware authenticates + gets API key
2. Delete expired insights (`validUntil < now()`)
3. Call `aggregateUserData(userId)`
4. Build prompt with aggregated data
5. Call OpenAI (gpt-4o-mini, JSON response format)
6. Parse response into typed insights
7. Bulk insert into `Insight` table with `validUntil = now() + 7 days`
8. Return new insights

#### `GET /api/insights`

Returns active (non-expired, non-dismissed) insights for the user.

```typescript
// src/app/api/insights/route.ts

// Query params: ?dismissed=false (default) | ?dismissed=true | ?type=procrastination
// Response:
{
  success: true,
  data: {
    insights: Insight[],
    total: number
  }
}
```

#### `PATCH /api/insights/:id/dismiss`

Marks an insight as dismissed.

```typescript
// src/app/api/insights/[id]/dismiss/route.ts
// Response: { success: true, data: { id: string, isDismissed: true } }
```

### 2.5 Prompt Design

```typescript
// src/lib/ai/prompts/insight-generate.ts

export const insightGeneratePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 2048,
  temperature: 0.4,

  systemPrompt: `You are NoBrainy Insight Engine. Analyze the user's productivity data and generate actionable insights.

Rules:
- Generate 3-7 insights based on the data provided.
- Each insight must have: type, content (1-2 sentences, Markdown OK), severity (info|warning|positive), relatedEntity (task|note|flashcard|habit|null).
- Only generate insights where the data supports them. Do not fabricate patterns.
- Be specific: reference actual numbers, task names, or tags from the data.
- severity "positive" for streaks and good patterns, "warning" for problems, "info" for neutral observations.

Return JSON: { "insights": [{ "insightType": "...", "contentMd": "...", "severity": "...", "relatedEntity": "..." }] }`,

  userPrompt: (data: UserDataSummary) =>
    `Here is my productivity data for the last 30 days:\n\n${JSON.stringify(data, null, 2)}`
}
```

### 2.6 Frontend Components

```
src/app/(dashboard)/insights/page.tsx          -- Insights page
src/components/insights/insight-card.tsx        -- Individual insight card with dismiss
src/components/insights/insight-list.tsx        -- List of insight cards
src/components/insights/generate-button.tsx     -- "Generate Insights" button (AI-gated)
src/components/insights/insight-type-badge.tsx  -- Colored badge for insight type
src/hooks/use-insights.ts                      -- React Query hooks for insights CRUD
```

**Insight Card UI:**
- Left color stripe based on severity (green=positive, yellow=warning, blue=info)
- Icon per insight type (clock for time, target for priority, etc.)
- Content rendered as Markdown
- "Dismiss" button (ghost, right side)
- "Generated X hours ago" timestamp

**Dashboard Widget:**
- Top 3 undismissed insights shown in a compact card on the main dashboard (`src/app/(dashboard)/page.tsx`)
- "View all" link to `/insights`

### 2.7 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ai/insights/aggregate-user-data.ts` | Create | Data aggregation logic |
| `src/lib/ai/prompts/insight-generate.ts` | Create | Insight generation prompt |
| `src/app/api/insights/route.ts` | Create | GET insights list |
| `src/app/api/insights/generate/route.ts` | Create | POST generate insights |
| `src/app/api/insights/[id]/dismiss/route.ts` | Create | PATCH dismiss insight |
| `src/app/(dashboard)/insights/page.tsx` | Create | Insights page |
| `src/components/insights/insight-card.tsx` | Create | Insight card component |
| `src/components/insights/insight-list.tsx` | Create | Insight list component |
| `src/components/insights/generate-button.tsx` | Create | Generate button with AI gate |
| `src/components/insights/insight-type-badge.tsx` | Create | Type badge |
| `src/hooks/use-insights.ts` | Create | React Query hooks |
| `src/lib/validations/insight.ts` | Create | Zod schemas |
| `src/components/layout/sidebar-nav.tsx` | Modify | Add "Insights" nav item |
| `src/app/(dashboard)/page.tsx` | Modify | Add insights widget to dashboard |

### 2.8 Acceptance Criteria

- [ ] User can navigate to `/insights` page
- [ ] "Generate Insights" button is disabled without API key, shows prompt to configure
- [ ] Clicking "Generate Insights" calls AI and displays 3-7 insight cards
- [ ] Each insight card shows type badge, severity color, content, and dismiss button
- [ ] Dismissed insights disappear from the list (can be viewed with filter)
- [ ] Expired insights (>7 days) are auto-cleaned on next generation
- [ ] Dashboard shows top 3 insights in a compact widget
- [ ] Insights page supports filtering by type and dismissed status

---

## 3. Feature 2: Enhanced Search

### 3.1 Overview

Upgrade the existing search (`/api/search`) with better relevance scoring. No pgvector -- instead, implement multi-term matching, word-boundary awareness, field weighting, and date-range filtering.

### 3.2 Improvements Over Current Search

| Current Behavior | Enhanced Behavior |
|-----------------|-------------------|
| Single `contains` match | Multi-term: split query into words, score each match |
| Simple 100/90/80/50 scoring | Weighted scoring: title match 3x, tag match 2x, content match 1x |
| No date filtering | `from` and `to` query params for date range |
| No sorting options | `sort=relevance` (default), `sort=recent`, `sort=oldest` |
| No highlighting data | Return `matchPositions` for frontend highlighting |
| No recent searches | Frontend stores last 10 searches in localStorage |

### 3.3 API Changes

#### `GET /api/search` (enhanced)

New query parameters:

```typescript
// src/lib/validations/search.ts (update)

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'note', 'task', 'book', 'flashcard', 'deck']).default('all'),
  tags: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  // NEW in Phase 3:
  from: z.string().datetime().optional(),        // ISO date, filter updatedAt >= from
  to: z.string().datetime().optional(),          // ISO date, filter updatedAt <= to
  sort: z.enum(['relevance', 'recent', 'oldest']).default('relevance'),
})
```

### 3.4 Enhanced Scoring Algorithm

```typescript
// src/lib/search/score.ts

export function scoreSearchResult(
  query: string,
  fields: { title: string; content: string; tags: string[] }
): { score: number; matchedTerms: string[] } {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const title = fields.title.toLowerCase()
  const content = fields.content.toLowerCase()
  const tagStr = fields.tags.join(' ').toLowerCase()

  let score = 0
  const matchedTerms: string[] = []

  for (const term of terms) {
    let termScore = 0

    // Title matches (highest weight)
    if (title === term) termScore += 100           // exact title match
    else if (title.startsWith(term)) termScore += 60  // title starts with
    else if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(title)) termScore += 40 // word boundary
    else if (title.includes(term)) termScore += 20  // substring

    // Tag matches (medium weight)
    if (fields.tags.some(t => t.toLowerCase() === term)) termScore += 30
    else if (tagStr.includes(term)) termScore += 15

    // Content matches (lower weight)
    if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(content)) termScore += 10
    else if (content.includes(term)) termScore += 5

    if (termScore > 0) matchedTerms.push(term)
    score += termScore
  }

  // Bonus: all terms matched
  if (matchedTerms.length === terms.length && terms.length > 1) {
    score *= 1.5
  }

  return { score: Math.round(score), matchedTerms }
}
```

### 3.5 Frontend Enhancements

```
src/components/search/search-filters.tsx       -- Date range + sort dropdown
src/components/search/recent-searches.tsx       -- Recent searches from localStorage
src/hooks/use-recent-searches.ts               -- Hook for localStorage recent searches
```

Modify:
- `src/app/(dashboard)/search/page.tsx` -- Add filters bar, recent searches
- `src/components/search/search-result-item.tsx` -- Highlight matched terms
- `src/components/search/search-highlight.tsx` -- Multi-term highlight support

### 3.6 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/search/score.ts` | Create | Enhanced scoring algorithm |
| `src/components/search/search-filters.tsx` | Create | Filter controls |
| `src/components/search/recent-searches.tsx` | Create | Recent search list |
| `src/hooks/use-recent-searches.ts` | Create | localStorage hook |
| `src/app/api/search/route.ts` | Modify | New params, improved scoring |
| `src/lib/validations/search.ts` | Modify | Add new schema fields |
| `src/app/(dashboard)/search/page.tsx` | Modify | Filters, recent searches |
| `src/components/search/search-result-item.tsx` | Modify | Term highlighting |
| `src/components/search/search-highlight.tsx` | Modify | Multi-term support |

### 3.7 Acceptance Criteria

- [ ] Multi-word queries match across title, tags, and content independently
- [ ] Title matches rank higher than content matches
- [ ] Tag matches contribute to relevance score
- [ ] Date range filter (`from`/`to`) restricts results
- [ ] Sort by relevance (default), recent, or oldest
- [ ] Recent searches stored in localStorage and displayed on empty search page
- [ ] Matched terms highlighted in search results

---

## 4. Feature 3: Focus Mode + Pomodoro Timer

### 4.1 Overview

Distraction-free task execution mode. When activated on a task, the UI hides sidebar, navigation, and all chrome. Shows only the current task details, linked notes, and an optional Pomodoro timer. Press Escape to exit.

### 4.2 State Management

Extend the existing UI store:

```typescript
// src/stores/ui-store.ts (additions)

interface UIState {
  // ... existing fields ...

  // Focus Mode
  focusModeActive: boolean
  focusTaskId: string | null
  enterFocusMode: (taskId: string) => void
  exitFocusMode: () => void
}
```

### 4.3 AppShell Integration

The `AppShell` component conditionally renders based on focus mode state:

```typescript
// src/components/layout/app-shell.tsx (modified)

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, focusModeActive, focusTaskId, exitFocusMode } = useUIStore()

  // Focus mode: render only FocusModeView
  if (focusModeActive && focusTaskId) {
    return <FocusModeView taskId={focusTaskId} onExit={exitFocusMode} />
  }

  // Normal layout (unchanged)
  return (/* existing layout */)
}
```

### 4.4 Focus Mode View

```typescript
// src/components/focus/focus-mode-view.tsx

interface FocusModeViewProps {
  taskId: string
  onExit: () => void
}
```

**Layout:**
- Full screen, white/dark background, no sidebar/topbar
- Top right: "Exit Focus Mode" button + Escape key listener
- Center: Task title (large), description (Markdown rendered), subtask checklist
- Below task: Linked notes (collapsible, read-only preview)
- Bottom: Pomodoro timer (optional, toggled by button)

### 4.5 Pomodoro Timer

```typescript
// src/components/focus/pomodoro-timer.tsx

interface PomodoroTimerProps {
  onComplete: () => void  // called when work session ends
}

// State:
// - mode: 'work' | 'break' | 'idle'
// - timeRemaining: number (seconds)
// - isRunning: boolean
// - sessionsCompleted: number

// Defaults:
// - Work: 25 minutes
// - Short break: 5 minutes
// - Long break (every 4 sessions): 15 minutes

// UI:
// - Circular progress ring (SVG)
// - Time display: MM:SS
// - Start/Pause/Reset buttons
// - Session counter: "Session 2 of 4"
// - Audio notification on timer end (optional, user can mute)
```

The timer uses `useRef` + `setInterval` for accuracy. No server-side state.

### 4.6 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Escape | Exit focus mode |
| Space | Start/pause Pomodoro timer |
| R | Reset timer |
| S | Toggle subtask checklist visibility |

### 4.7 API Requirements

No new API endpoints. Focus mode reads from:
- `GET /api/tasks/:id` -- task details + subtasks
- `GET /api/tasks/:id/links` -- linked notes/books
- `PATCH /api/tasks/:id` -- update task status, complete subtasks

### 4.8 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/focus/focus-mode-view.tsx` | Create | Main focus mode container |
| `src/components/focus/pomodoro-timer.tsx` | Create | Pomodoro timer component |
| `src/components/focus/focus-task-detail.tsx` | Create | Task detail view for focus mode |
| `src/components/focus/focus-linked-notes.tsx` | Create | Linked notes panel |
| `src/stores/ui-store.ts` | Modify | Add focus mode state |
| `src/components/layout/app-shell.tsx` | Modify | Conditional focus mode rendering |
| `src/components/tasks/task-list.tsx` | Modify | Add "Focus" button to task actions |
| `src/app/(dashboard)/tasks/[id]/page.tsx` | Modify | Add "Enter Focus Mode" button |

### 4.9 Acceptance Criteria

- [ ] "Focus" button appears on task list items and task detail page
- [ ] Clicking "Focus" hides sidebar, topbar, and all navigation
- [ ] Focus view shows task title, description, subtask checklist
- [ ] Linked notes are shown in a collapsible panel below the task
- [ ] Subtasks can be checked off directly in focus mode
- [ ] Pomodoro timer can be started/paused/reset
- [ ] Timer displays circular progress ring with MM:SS
- [ ] Timer cycles through work/break automatically
- [ ] Audio notification plays on timer completion (can be muted)
- [ ] Escape key exits focus mode and returns to previous view
- [ ] Focus mode works on mobile (responsive layout)

---

## 5. Feature 4: Flashcard Quiz Mode

### 5.1 Overview

Structured quiz with scoring, timer, and results page. Different from the existing review mode: quiz has a total score, time limit (optional), multiple choice for cloze cards, and a results summary at the end.

### 5.2 Schema Changes

```prisma
// prisma/schema.prisma (additions)

model QuizSession {
  id              String    @id @default(cuid())
  userId          String
  deckId          String
  mode            String    @default("standard") // standard | timed | multiple_choice
  totalCards      Int
  correctCount    Int       @default(0)
  incorrectCount  Int       @default(0)
  skippedCount    Int       @default(0)
  scorePercent    Float     @default(0)
  timeLimitSec    Int?      // null = untimed
  timeUsedSec     Int?
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  answers         Json      @default("[]") // QuizAnswer[]

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  deck Deck @relation(fields: [deckId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deckId])
  @@map("quiz_sessions")
}

// QuizAnswer JSON shape:
// { cardId: string, correct: boolean, userAnswer?: string, timeMs: number }
```

Add relation to User and Deck models:

```prisma
// In User model, add:
quizSessions  QuizSession[]

// In Deck model, add:
quizSessions  QuizSession[]
```

### 5.3 Quiz Flow

1. **Start Quiz**: User selects deck -> chooses mode (standard, timed, multiple choice) -> optional card count (10/20/all)
2. **Quiz Loop**: Show card front -> user answers -> reveal back + mark correct/incorrect -> next card
3. **Multiple Choice (cloze cards)**: Generate 3 wrong options + 1 correct from the deck's other cards
4. **End**: Show results page with score, time, per-card breakdown

### 5.4 API Design

#### `POST /api/decks/:id/quiz/start`

```typescript
// Request:
{ mode: 'standard' | 'timed' | 'multiple_choice', cardCount?: number, timeLimitSec?: number }

// Response:
{
  success: true,
  data: {
    quizSessionId: string,
    cards: Array<{
      id: string,
      frontMd: string,
      backMd: string,
      cardType: string,
      options?: string[]  // only for multiple_choice mode with cloze cards
    }>,
    totalCards: number,
    timeLimitSec: number | null
  }
}
```

#### `POST /api/quiz-sessions/:id/answer`

```typescript
// Request:
{ cardId: string, correct: boolean, userAnswer?: string, timeMs: number }

// Response:
{ success: true, data: { answersRecorded: number, remaining: number } }
```

#### `POST /api/quiz-sessions/:id/complete`

```typescript
// Response:
{
  success: true,
  data: {
    scorePercent: number,
    correctCount: number,
    incorrectCount: number,
    skippedCount: number,
    totalCards: number,
    timeUsedSec: number,
    answers: QuizAnswer[]
  }
}
```

#### `GET /api/quiz-sessions?deckId=xxx`

Returns quiz history for a deck.

### 5.5 Multiple Choice Generation

For cloze cards, generate distractors from the same deck:

```typescript
// src/lib/quiz/generate-options.ts

export function generateMultipleChoiceOptions(
  correctAnswer: string,
  allCards: Array<{ backMd: string }>,
  count: number = 3
): string[] {
  // 1. Filter out the correct answer
  // 2. Shuffle remaining card backs
  // 3. Take `count` distractors
  // 4. Shuffle [correct, ...distractors] and return
}
```

### 5.6 Frontend Components

```
src/app/(dashboard)/flashcards/[id]/quiz/page.tsx    -- Quiz page
src/components/quiz/quiz-setup-dialog.tsx             -- Mode/count selection
src/components/quiz/quiz-card.tsx                     -- Card display during quiz
src/components/quiz/quiz-progress-bar.tsx             -- Progress indicator
src/components/quiz/quiz-timer.tsx                    -- Countdown timer (timed mode)
src/components/quiz/quiz-multiple-choice.tsx          -- Multiple choice UI
src/components/quiz/quiz-results.tsx                  -- Results page with score breakdown
src/hooks/use-quiz.ts                                -- React Query hooks
```

### 5.7 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add QuizSession model |
| `src/app/api/decks/[id]/quiz/start/route.ts` | Create | Start quiz endpoint |
| `src/app/api/quiz-sessions/[id]/answer/route.ts` | Create | Submit answer |
| `src/app/api/quiz-sessions/[id]/complete/route.ts` | Create | Complete quiz |
| `src/app/api/quiz-sessions/route.ts` | Create | Quiz history |
| `src/lib/quiz/generate-options.ts` | Create | MC option generator |
| `src/lib/validations/quiz.ts` | Create | Zod schemas |
| `src/app/(dashboard)/flashcards/[id]/quiz/page.tsx` | Create | Quiz page |
| `src/components/quiz/quiz-setup-dialog.tsx` | Create | Setup dialog |
| `src/components/quiz/quiz-card.tsx` | Create | Quiz card display |
| `src/components/quiz/quiz-progress-bar.tsx` | Create | Progress bar |
| `src/components/quiz/quiz-timer.tsx` | Create | Timer |
| `src/components/quiz/quiz-multiple-choice.tsx` | Create | MC options |
| `src/components/quiz/quiz-results.tsx` | Create | Results page |
| `src/hooks/use-quiz.ts` | Create | React Query hooks |
| `src/app/(dashboard)/flashcards/[id]/page.tsx` | Modify | Add "Quiz" button |
| `src/components/flashcards/deck-card.tsx` | Modify | Add quiz action |

### 5.8 Acceptance Criteria

- [ ] "Quiz" button on deck detail page and deck card
- [ ] Quiz setup dialog lets user choose mode, card count, and time limit
- [ ] Standard mode: show front, user self-grades correct/incorrect
- [ ] Multiple choice mode: cloze cards show 4 options, auto-grades on selection
- [ ] Timed mode: countdown timer, auto-completes when time runs out
- [ ] Progress bar shows current card / total
- [ ] Results page shows score percentage, correct/incorrect/skipped counts
- [ ] Per-card breakdown in results (which cards were wrong)
- [ ] Quiz history viewable per deck
- [ ] Quiz session is persisted and can be reviewed later

---

## 6. Feature 5: Note Bi-directional Linking (Enhanced)

### 6.1 Overview

Enhance the existing `[[wiki-link]]` system with a backlinks panel and a simple link graph visualization. The `NoteLink` model already exists. This feature makes links truly bi-directional by showing "notes that link TO this note" alongside "notes this note links to."

### 6.2 Backlinks Query

```typescript
// src/lib/notes/get-backlinks.ts

export async function getBacklinks(noteId: string, userId: string) {
  return prisma.noteLink.findMany({
    where: {
      targetId: noteId,
      targetType: 'note',
      sourceNote: { userId, isDeleted: false },
    },
    include: {
      sourceNote: {
        select: { id: true, title: true, contentMd: true, updatedAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
```

### 6.3 API Design

#### `GET /api/notes/:id/backlinks`

```typescript
// Response:
{
  success: true,
  data: {
    backlinks: Array<{
      id: string           // NoteLink id
      sourceNote: {
        id: string
        title: string
        excerpt: string    // first 100 chars of content
        updatedAt: string
      }
      createdAt: string
    }>,
    count: number
  }
}
```

#### `GET /api/notes/graph?noteId=xxx`

Returns the link graph centered on a note (1-2 levels deep).

```typescript
// Response:
{
  success: true,
  data: {
    nodes: Array<{ id: string, title: string, type: 'center' | 'linked' | 'backlinked' }>,
    edges: Array<{ source: string, target: string }>
  }
}
```

### 6.4 Link Graph Visualization

Use `d3-force` for a simple force-directed graph rendered as SVG.

```typescript
// src/components/notes/link-graph.tsx

interface LinkGraphProps {
  noteId: string
}

// Nodes: circles with labels
// Center node: larger, highlighted color
// Edges: lines connecting nodes
// Click node: navigate to that note
// Drag to reposition nodes
// Zoom/pan support
```

### 6.5 Backlinks Panel

```typescript
// src/components/notes/backlinks-panel.tsx

// Collapsible panel shown on note detail page
// Header: "Linked from (N notes)"
// Each backlink: note title + excerpt + date
// Click to navigate to source note
```

### 6.6 Wiki-Link Resolution Enhancement

Enhance the existing `src/components/editor/wiki-link.tsx` to:
1. Show tooltip preview on hover (first 100 chars of linked note)
2. Red styling for broken links (target note not found)
3. Auto-complete suggestions when typing `[[`

### 6.7 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/notes/get-backlinks.ts` | Create | Backlinks query |
| `src/app/api/notes/[id]/backlinks/route.ts` | Create | Backlinks endpoint |
| `src/app/api/notes/graph/route.ts` | Create | Link graph endpoint |
| `src/components/notes/backlinks-panel.tsx` | Create | Backlinks panel |
| `src/components/notes/link-graph.tsx` | Create | Force-directed graph |
| `src/hooks/use-backlinks.ts` | Create | React Query hooks |
| `src/components/editor/wiki-link.tsx` | Modify | Tooltip preview, broken link style |
| `src/app/(dashboard)/notes/[id]/page.tsx` | Modify | Add backlinks panel + graph toggle |

### 6.8 Acceptance Criteria

- [ ] Note detail page shows "Backlinks" panel listing all notes that link to it
- [ ] Backlinks panel shows note title, excerpt, and date
- [ ] Clicking a backlink navigates to that note
- [ ] Link graph button opens a modal/panel with force-directed graph
- [ ] Graph shows the current note as center, outgoing links, and incoming backlinks
- [ ] Clicking a node in the graph navigates to that note
- [ ] Wiki-link hover shows tooltip preview of linked note
- [ ] Broken wiki-links (non-existent target) shown in red
- [ ] Backlinks count shown in note header/metadata

---

## 7. Feature 6: AI Knowledge Distillation

### 7.1 Overview

Two AI-powered transformations:
1. **Book-to-Note**: Convert a book's summary, key ideas, quotes, and learnings into a structured Markdown note
2. **Note-to-Action**: Extract actionable tasks from a note or book

### 7.2 API Design

#### `POST /api/books/:id/ai/distill`

Converts book summary into a structured note.

```typescript
// Response:
{
  success: true,
  data: {
    title: string,       // suggested note title
    contentMd: string,   // structured Markdown note
    suggestedTags: string[]
  }
}
```

The user reviews the generated note content, can edit it, then saves it as a new note (using existing `POST /api/notes`). The note is auto-linked to the book via `NoteLink`.

#### `POST /api/notes/:id/ai/actions`

Extracts action items from a note as task drafts.

```typescript
// Response:
{
  success: true,
  data: {
    tasks: Array<{
      title: string,
      priority: 'critical' | 'high' | 'medium' | 'low',
      reason: string   // why this was extracted
    }>
  }
}
```

#### `POST /api/books/:id/ai/actions`

Same as above but from a book's content.

### 7.3 Prompt Design

```typescript
// src/lib/ai/prompts/distill-book.ts

export const distillBookPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 2048,
  temperature: 0.3,

  systemPrompt: `You are NoBrainy Knowledge Distiller. Convert book summaries into well-structured Markdown notes.

Format the note with:
- # Title (book title + "Notes")
- ## Key Takeaways (numbered list of most important ideas)
- ## Notable Quotes (blockquotes with attribution)
- ## Personal Applications (actionable items from learnings)
- ## Connections (how this relates to other knowledge areas)

Return JSON: { "title": "...", "contentMd": "...", "suggestedTags": [...] }`,

  userPrompt: (book: { title: string; author: string; summaryMd: string; keyIdeas: any[]; quotes: any[]; learningsMd: string; applicationMd: string }) =>
    `Convert this book into a structured note:\n\nTitle: ${book.title}\nAuthor: ${book.author}\nSummary: ${book.summaryMd}\nKey Ideas: ${JSON.stringify(book.keyIdeas)}\nQuotes: ${JSON.stringify(book.quotes)}\nLearnings: ${book.learningsMd}\nApplications: ${book.applicationMd}`
}
```

```typescript
// src/lib/ai/prompts/extract-actions.ts

export const extractActionsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.3,

  systemPrompt: `You are NoBrainy Action Extractor. Given text content, identify concrete actionable tasks the user should do.

Rules:
- Extract 2-8 specific, actionable tasks.
- Each task title should start with a verb (e.g., "Research...", "Set up...", "Practice...").
- Assign priority based on urgency/importance implied by the content.
- Provide a brief reason for why each task was extracted.

Return JSON: { "tasks": [{ "title": "...", "priority": "medium", "reason": "..." }] }`,

  userPrompt: (content: string) => `Extract actionable tasks from this content:\n\n${content}`
}
```

### 7.4 Frontend Components

```
src/components/ai/distill-book-dialog.tsx       -- Book distillation preview + save
src/components/ai/extract-actions-dialog.tsx     -- Action items preview + save as tasks
```

**Distill Book Flow:**
1. User clicks "Distill to Note" on book detail page
2. AI generates structured note content
3. Preview dialog shows Markdown render
4. User can edit title, content, tags
5. "Save as Note" creates the note and links it to the book

**Extract Actions Flow:**
1. User clicks "Extract Actions" on note or book detail page
2. AI generates task drafts
3. Dialog shows task list with checkboxes
4. User selects which tasks to create
5. "Create Tasks" bulk-creates selected tasks

### 7.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/ai/prompts/distill-book.ts` | Create | Book distillation prompt |
| `src/lib/ai/prompts/extract-actions.ts` | Create | Action extraction prompt |
| `src/app/api/books/[id]/ai/distill/route.ts` | Create | Book-to-note endpoint |
| `src/app/api/notes/[id]/ai/actions/route.ts` | Create | Note-to-action endpoint |
| `src/app/api/books/[id]/ai/actions/route.ts` | Create | Book-to-action endpoint |
| `src/components/ai/distill-book-dialog.tsx` | Create | Distillation preview |
| `src/components/ai/extract-actions-dialog.tsx` | Create | Action extraction preview |
| `src/app/(dashboard)/books/[id]/page.tsx` | Modify | Add distill + actions buttons |
| `src/app/(dashboard)/notes/[id]/page.tsx` | Modify | Add "Extract Actions" button |
| `src/lib/ai/prompts/index.ts` | Modify | Re-export new prompts |

### 7.6 Acceptance Criteria

- [ ] "Distill to Note" button on book detail page (AI-gated)
- [ ] Distillation generates a structured Markdown note from book data
- [ ] Preview dialog shows rendered Markdown with edit capability
- [ ] "Save as Note" creates a note linked to the book
- [ ] "Extract Actions" button on both note and book detail pages
- [ ] Action extraction generates 2-8 task drafts with priorities
- [ ] User can select/deselect individual tasks before creating
- [ ] Created tasks are linked to their source note/book

---

## 8. Feature 7: Smart Reminders / Notifications

### 8.1 Overview

In-app notification system with optional web push. Covers:
- Due date reminders for tasks
- Behavior-based nudges ("Task X has been pending for 3 days")
- Habit reminders
- Flashcard review reminders

### 8.2 Schema Changes

```prisma
// prisma/schema.prisma (additions)

model Notification {
  id              String    @id @default(cuid())
  userId          String
  type            String    // task_due | task_stale | habit_reminder | review_reminder | insight
  title           String
  body            String
  relatedEntity   String?   // task | habit | deck
  relatedId       String?
  isRead          Boolean   @default(false)
  readAt          DateTime?
  createdAt       DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

model PushSubscription {
  id              String   @id @default(cuid())
  userId          String
  endpoint        String   @db.Text
  p256dh          String
  auth            String
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint])
  @@map("push_subscriptions")
}
```

Add relations to User model:
```prisma
notifications     Notification[]
pushSubscriptions PushSubscription[]
```

### 8.3 Notification Generation

Notifications are generated on-demand when the user loads the dashboard or notifications page. No background scheduler needed.

```typescript
// src/lib/notifications/generate.ts

export async function generateNotifications(userId: string): Promise<void> {
  const now = new Date()
  const today = startOfDay(now)

  // 1. Task due today (not already notified)
  const dueTasks = await prisma.task.findMany({
    where: {
      userId,
      dueDate: { gte: today, lt: addDays(today, 1) },
      status: { in: ['pending', 'in_progress'] },
    },
  })

  // 2. Stale tasks (pending > 3 days, no existing notification in last 24h)
  const staleTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'pending',
      createdAt: { lt: addDays(now, -3) },
      updatedAt: { lt: addDays(now, -1) }, // not recently updated
    },
  })

  // 3. Habits due today without a log
  // 4. Flashcard decks with cards due today

  // Deduplicate: check existing notifications for same relatedId + type created today
  // Insert new notifications
  // Optionally send web push for each new notification
}
```

### 8.4 API Design

#### `GET /api/notifications`

```typescript
// Query: ?unread=true | ?limit=50
// Response:
{
  success: true,
  data: {
    notifications: Notification[],
    unreadCount: number
  }
}
```

#### `PATCH /api/notifications/:id/read`

Marks a notification as read.

#### `POST /api/notifications/read-all`

Marks all notifications as read.

#### `DELETE /api/notifications/:id`

Deletes a notification.

#### `POST /api/push/subscribe`

Registers a web push subscription.

```typescript
// Request:
{ endpoint: string, keys: { p256dh: string, auth: string } }
```

#### `DELETE /api/push/subscribe`

Removes push subscription.

### 8.5 Web Push Setup

```typescript
// src/lib/notifications/web-push.ts

import webPush from 'web-push'

// VAPID keys from environment:
// NEXT_PUBLIC_VAPID_PUBLIC_KEY
// VAPID_PRIVATE_KEY

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (error) {
      // If subscription expired (410 Gone), delete it
      if ((error as any).statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
    }
  }
}
```

### 8.6 Service Worker

```typescript
// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'NoBrainy', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
```

### 8.7 Frontend Components

```
src/components/notifications/notification-bell.tsx     -- Bell icon in TopBar with unread count
src/components/notifications/notification-panel.tsx    -- Dropdown panel with notification list
src/components/notifications/notification-item.tsx     -- Individual notification
src/components/notifications/notification-settings.tsx -- Push notification toggle in Settings
src/hooks/use-notifications.ts                         -- React Query hooks + polling
```

**Notification Bell:**
- Bell icon in TopBar with red badge showing unread count
- Click opens dropdown panel
- Panel shows notification list with "Mark all read" button
- Each notification: icon (by type), title, body, time ago, click to navigate

**Settings:**
- Toggle: "Enable push notifications"
- When enabled, request browser permission + register service worker + save subscription
- Status indicator: "Push notifications: enabled / disabled / not supported"

### 8.8 Notification Preferences

Store in `User.preferences` JSON field:

```json
{
  "notifications": {
    "taskDue": true,
    "taskStale": true,
    "habitReminder": true,
    "reviewReminder": true,
    "pushEnabled": false
  }
}
```

### 8.9 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add Notification + PushSubscription models |
| `src/lib/notifications/generate.ts` | Create | Notification generation logic |
| `src/lib/notifications/web-push.ts` | Create | Web push sending |
| `src/app/api/notifications/route.ts` | Create | GET notifications |
| `src/app/api/notifications/[id]/read/route.ts` | Create | Mark read |
| `src/app/api/notifications/read-all/route.ts` | Create | Mark all read |
| `src/app/api/notifications/[id]/route.ts` | Create | DELETE notification |
| `src/app/api/push/subscribe/route.ts` | Create | Push subscription |
| `src/lib/validations/notification.ts` | Create | Zod schemas |
| `src/components/notifications/notification-bell.tsx` | Create | Bell icon |
| `src/components/notifications/notification-panel.tsx` | Create | Dropdown panel |
| `src/components/notifications/notification-item.tsx` | Create | Notification row |
| `src/components/notifications/notification-settings.tsx` | Create | Settings UI |
| `src/hooks/use-notifications.ts` | Create | React Query hooks |
| `public/sw.js` | Create | Service worker |
| `src/components/layout/top-bar.tsx` | Modify | Add notification bell |
| `src/app/(dashboard)/settings/page.tsx` | Modify | Add notification prefs |

### 8.10 Acceptance Criteria

- [ ] Notification bell in TopBar shows unread count badge
- [ ] Clicking bell opens notification dropdown panel
- [ ] Notifications generated on dashboard load (due tasks, stale tasks, habits, reviews)
- [ ] Each notification shows type icon, title, body, and timestamp
- [ ] Clicking a notification navigates to the related entity
- [ ] "Mark all read" clears unread badge
- [ ] Individual notifications can be dismissed
- [ ] Push notification toggle in Settings page
- [ ] Enabling push requests browser permission
- [ ] Push notifications delivered for new notifications when app is not focused
- [ ] Notification preferences (per-type toggles) stored in user preferences
- [ ] Stale task nudge: "Task X has been pending for N days"

---

## 9. New Dependencies

| Package | Purpose | Feature |
|---------|---------|---------|
| `d3-force` | Force-directed graph layout | Feature 5 (Link Graph) |
| `d3-drag` | Node dragging in graph | Feature 5 (Link Graph) |
| `d3-zoom` | Pan/zoom in graph | Feature 5 (Link Graph) |
| `web-push` | Server-side push notifications | Feature 7 (Notifications) |

Install:
```bash
pnpm add d3-force d3-drag d3-zoom web-push
pnpm add -D @types/d3-force @types/d3-drag @types/d3-zoom
```

---

## 10. Schema Migration Summary

One migration covering both new models:

```bash
npx prisma migrate dev --name phase3_quiz_notifications
```

Models added:
- `QuizSession` -- quiz results and per-card answers
- `Notification` -- in-app notification log
- `PushSubscription` -- web push subscription storage

Relations added to existing models:
- `User.quizSessions`
- `User.notifications`
- `User.pushSubscriptions`
- `Deck.quizSessions`

No changes to existing columns or indexes.

---

## 11. Parallel Execution Plan

### Stream 1: AI Features (Features 1, 6)

These share AI infrastructure and prompt patterns.

```
Week 1-2: Feature 1 (Insight Engine)
  - Data aggregation logic
  - Insight generation prompt + API
  - Insights page + cards UI
  - Dashboard widget

Week 3: Feature 6 (AI Knowledge Distillation)
  - Distill book prompt + API
  - Extract actions prompt + API
  - Preview dialogs
```

### Stream 2: Core Features (Features 3, 4)

These are self-contained UI features with minimal backend.

```
Week 1: Feature 3 (Focus Mode + Pomodoro)
  - UI store changes
  - Focus mode view + AppShell integration
  - Pomodoro timer component
  - Keyboard shortcuts

Week 2: Feature 4 (Flashcard Quiz Mode)
  - Schema migration
  - Quiz API endpoints
  - Quiz UI (setup, cards, timer, results)
  - Multiple choice generation
```

### Stream 3: Search + Links + Notifications (Features 2, 5, 7)

```
Week 1: Feature 2 (Enhanced Search)
  - Scoring algorithm
  - API enhancements (date filter, sort)
  - Frontend filters + recent searches

Week 2: Feature 5 (Bi-directional Links)
  - Backlinks API + panel
  - Link graph API + d3 visualization
  - Wiki-link tooltip enhancement

Week 3: Feature 7 (Smart Reminders)
  - Schema migration
  - Notification generation + APIs
  - Bell + panel UI
  - Web push setup + service worker
  - Notification preferences
```

### Integration Week (Week 4)

- Cross-feature testing
- Dashboard integration (insights widget + notification bell)
- Performance testing (search scoring with large datasets)
- Mobile responsiveness for focus mode and quiz mode

---

## 12. Environment Variables (New)

```env
# Web Push (Feature 7)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # generated via web-push generate-vapid-keys
VAPID_PRIVATE_KEY=              # keep secret
VAPID_CONTACT_EMAIL=            # mailto: for VAPID
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

---

## 13. Testing Strategy

### Unit Tests

| Area | Test Focus |
|------|-----------|
| `src/lib/search/score.ts` | Scoring algorithm: multi-term, word boundary, field weighting |
| `src/lib/quiz/generate-options.ts` | MC distractor generation, edge cases (< 4 cards) |
| `src/lib/notifications/generate.ts` | Notification deduplication, preference filtering |
| `src/lib/ai/insights/aggregate-user-data.ts` | Data aggregation correctness |
| Pomodoro timer | Timer state transitions, session counting |

### Integration Tests

| Area | Test Focus |
|------|-----------|
| Insight API | Generate -> list -> dismiss flow |
| Quiz API | Start -> answer -> complete flow, score calculation |
| Notification API | Generate -> list -> read -> delete flow |
| Search API | Multi-term queries, date filtering, sorting |
| Backlinks API | Create link -> query backlinks -> verify bidirectionality |

### E2E Tests (Playwright)

| Flow | Steps |
|------|-------|
| Focus Mode | Open task -> Enter focus mode -> Check subtask -> Start timer -> Escape |
| Quiz Mode | Open deck -> Start quiz -> Answer cards -> View results |
| Insights | Navigate to insights -> Generate -> View cards -> Dismiss |
| Search | Search with multiple terms -> Apply filters -> Click result |
| Notifications | Check bell -> Open panel -> Click notification -> Verify navigation |
