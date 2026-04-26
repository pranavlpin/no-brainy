# Phase 2 Technical Specification: Intelligence (AI-Powered Features)

**Version:** 1.0
**Date:** 2026-03-31
\*\*Status:\*\* Partially Implemented
**PRD Reference:** `docs/MyFocusHub_PRD.md` v1.0 -- Sections 3.1.2, 3.2.2, 3.3.2, 3.5.3, 4.x
**Phase 1 Spec:** `docs/TECHNICAL_SPEC.md` v1.0

---

## 1. Architecture Overview

### 1.1 AI Call Flow

Every AI request follows the same synchronous path:

```
User clicks AI button
  --> Frontend checks useAI().isEnabled (has API key?)
    --> If no key: show "Add your OpenAI API key in Settings" prompt, stop
    --> If key exists: POST /api/.../ai/<action>
      --> withAI middleware: authenticate user + decrypt API key
        --> If key missing/invalid: return 403 { code: "AI_NOT_CONFIGURED" }
        --> If key present: create OpenAI client with user's key
          --> Build prompt from template + user data
          --> Call OpenAI API (gpt-4o-mini or gpt-4o)
          --> Parse response, return structured JSON to frontend
```

### 1.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| OpenAI SDK | `openai` npm package (v4+) | Official SDK, typed, supports streaming. One client instance per request using user's decrypted API key. |
| Job queue | None (Phase 2) | All AI calls are synchronous request/response. No Redis, no BullMQ. Background jobs deferred to Phase 3. |
| Streaming | SSE for AI Coach only | Coach responses stream tokens to the UI for perceived speed. All other actions return complete JSON responses. |
| Prompt storage | TypeScript objects in `src/lib/ai/prompts/` | No DB lookups for prompts in Phase 2. The existing `PromptTemplate` Prisma model stays empty until Phase 3 A/B testing. |
| Model routing | `gpt-4o-mini` default, `gpt-4o` for Coach | Cost management per PRD Section 4.3. Mini is sufficient for summarization, generation, prioritization. |
| Rate limiting | None in Phase 2 | Users pay for their own API calls via BYOK. Rate limiting deferred to Phase 3 (Redis-based). |
| Error handling | Surface OpenAI errors as user-friendly messages | Map OpenAI error codes (401, 429, 500) to actionable messages ("Invalid API key", "Rate limited by OpenAI", etc.). |

### 1.3 No Schema Changes

Phase 2 requires **no new Prisma models and no migrations**. All AI results are returned to the frontend and only persisted when the user explicitly accepts them (e.g., saving generated flashcards uses the existing Flashcard create API, saving an AI summary writes to the existing `DailyReview.aiSummaryMd` field). The existing schema already has:

- `DayPlan.aiBriefMd` -- stores accepted daily plan suggestions
- `DailyReview.aiSummaryMd` -- stores accepted review summaries
- `Flashcard.sourceType` / `Flashcard.sourceId` -- links AI-generated cards back to source note/book

---

## 2. Shared AI Infrastructure

### 2.1 New Dependency

```bash
pnpm add openai
```

### 2.2 Files to Create

#### `src/lib/ai/openai-client.ts` -- OpenAI client factory

```typescript
import OpenAI from 'openai'

/**
 * Creates a per-request OpenAI client using the user's decrypted API key.
 * Never cache this -- a new instance per request ensures key isolation.
 */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey })
}

export type AIModel = 'gpt-4o-mini' | 'gpt-4o'

export const AI_MODELS = {
  FAST: 'gpt-4o-mini' as const,   // summarization, generation, prioritization
  SMART: 'gpt-4o' as const,        // coach, complex reasoning
}
```

#### `src/lib/ai/middleware.ts` -- AI auth middleware (extends withAuth)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { getUserApiKey } from '@/lib/ai/get-api-key'
import type { AuthUser } from '@/lib/types/auth'

export interface AIContext {
  user: AuthUser
  apiKey: string
}

/**
 * Wrapper for AI API routes. Authenticates user AND ensures they have
 * a valid OpenAI API key. Returns 401 for no session, 403 for no key.
 */
export function withAI(
  handler: (req: NextRequest, ctx: AIContext) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest) => {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const apiKey = await getUserApiKey(user.id)
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_NOT_CONFIGURED',
            message: 'OpenAI API key not configured. Add your key in Settings to use AI features.',
          },
        },
        { status: 403 }
      )
    }

    return handler(req, { user, apiKey })
  }
}
```

#### `src/lib/ai/types.ts` -- Shared AI response types

```typescript
// All AI endpoints return this envelope
export interface AIActionResponse<T> {
  success: true
  data: T
  model: string        // which model was used
  tokensUsed?: number  // optional: total_tokens from usage
}

// Note AI
export interface NoteSummary {
  bullets: string[]   // 3-5 bullet points
}

export interface NoteInsights {
  insights: Array<{
    title: string      // short label
    description: string // 1-2 sentence explanation
  }>
}

export interface TagSuggestions {
  tags: string[]       // 3-8 suggested tags
}

// Flashcard AI
export interface GeneratedFlashcard {
  cardType: 'qa' | 'cloze' | 'definition'
  frontMd: string
  backMd: string
  sourceExcerpt?: string
}

export interface FlashcardGenerationResult {
  cards: GeneratedFlashcard[]
  sourceType: 'note' | 'book'
  sourceId: string
}

// Task AI
export interface PrioritySuggestion {
  taskId: string
  currentPriority: string
  suggestedPriority: string
  reason: string
}

export interface TaskPrioritizationResult {
  suggestions: PrioritySuggestion[]
  reasoning: string   // overall explanation
}

// Daily Plan AI
export interface DailyPlanSuggestion {
  suggestedTaskIds: string[]
  reasoning: string
  briefMd: string     // markdown morning brief
}

// Review AI
export interface ReviewSummary {
  summaryMd: string   // natural language recap
}

// Coach AI (streamed -- individual messages, not a typed response)
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}
```

#### `src/lib/ai/prompts/` -- Prompt templates directory

Each file exports a prompt template object. See Section 5 for full prompt definitions.

```
src/lib/ai/prompts/
  index.ts              -- re-exports all prompts
  note-summarize.ts
  note-insights.ts
  note-tags.ts
  flashcard-generate.ts
  task-prioritize.ts
  daily-plan-suggest.ts
  review-summary.ts
  coach.ts
```

#### `src/lib/ai/call-ai.ts` -- Shared AI call utility

```typescript
import OpenAI from 'openai'
import { createOpenAIClient, type AIModel } from './openai-client'
import type { AIActionResponse } from './types'

interface CallAIOptions {
  apiKey: string
  model: AIModel
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  responseFormat?: 'json'
}

/**
 * Single function for all non-streaming AI calls.
 * Handles client creation, API call, JSON parsing, and error mapping.
 */
export async function callAI<T>(options: CallAIOptions): Promise<AIActionResponse<T>> {
  const client = createOpenAIClient(options.apiKey)

  const response = await client.chat.completions.create({
    model: options.model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ],
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    response_format: options.responseFormat === 'json'
      ? { type: 'json_object' }
      : undefined,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new AIError('Empty response from AI model', 'AI_EMPTY_RESPONSE')
  }

  const parsed = options.responseFormat === 'json'
    ? JSON.parse(content) as T
    : content as unknown as T

  return {
    success: true,
    data: parsed,
    model: options.model,
    tokensUsed: response.usage?.total_tokens,
  }
}

export class AIError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
    this.name = 'AIError'
  }
}
```

#### `src/lib/ai/error-handler.ts` -- Map OpenAI errors to user-friendly responses

```typescript
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Catches OpenAI SDK errors and returns appropriate HTTP responses.
 * Use in catch blocks of AI route handlers.
 */
export function handleAIError(error: unknown): NextResponse {
  if (error instanceof OpenAI.AuthenticationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_AUTH_ERROR',
          message: 'Your OpenAI API key is invalid or expired. Please update it in Settings.',
        },
      },
      { status: 401 }
    )
  }

  if (error instanceof OpenAI.RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'OpenAI rate limit reached. Please wait a moment and try again.',
        },
      },
      { status: 429 }
    )
  }

  if (error instanceof OpenAI.BadRequestError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_BAD_REQUEST',
          message: 'The content could not be processed. It may be too long or contain unsupported content.',
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof SyntaxError) {
    // JSON parse failure from AI response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AI_PARSE_ERROR',
          message: 'Failed to parse AI response. Please try again.',
        },
      },
      { status: 502 }
    )
  }

  // Generic fallback
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AI_ERROR',
        message: 'An error occurred while processing your AI request.',
      },
    },
    { status: 500 }
  )
}
```

### 2.3 Frontend: AI Action Button Component

```typescript
// src/components/ai/ai-action-button.tsx

'use client'

import { useAI } from '@/hooks/use-ai'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AIActionButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
}

export function AIActionButton({
  onClick,
  loading,
  disabled,
  children,
  variant = 'outline',
  size = 'sm',
}: AIActionButtonProps) {
  const { isEnabled, isLoading: isCheckingKey } = useAI()

  if (isCheckingKey) return null

  if (!isEnabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size={size} disabled>
            <Sparkles className="h-4 w-4 mr-1 opacity-50" />
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Add your OpenAI API key in Settings to unlock AI features
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <Sparkles className="h-4 w-4 mr-1" />
      {loading ? 'Processing...' : children}
    </Button>
  )
}
```

---

## 3. Task Breakdown

Tasks are ordered by dependency. Each task includes files, dependencies, acceptance criteria, and the agent role that should implement it.

---

### Task P2-1: AI Infrastructure (Shared) --> backend-dev

**Description**: Install the OpenAI SDK, create the shared AI infrastructure layer used by all subsequent tasks. This is the foundation -- nothing else can start until this is done.

**Files to create:**
- `src/lib/ai/openai-client.ts` -- client factory (see Section 2.2)
- `src/lib/ai/middleware.ts` -- `withAI` middleware (see Section 2.2)
- `src/lib/ai/types.ts` -- all shared AI types (see Section 2.2)
- `src/lib/ai/call-ai.ts` -- shared AI call utility (see Section 2.2)
- `src/lib/ai/error-handler.ts` -- OpenAI error mapper (see Section 2.2)
- `src/lib/ai/prompts/index.ts` -- prompt barrel export
- `src/lib/ai/prompts/note-summarize.ts`
- `src/lib/ai/prompts/note-insights.ts`
- `src/lib/ai/prompts/note-tags.ts`
- `src/lib/ai/prompts/flashcard-generate.ts`
- `src/lib/ai/prompts/task-prioritize.ts`
- `src/lib/ai/prompts/daily-plan-suggest.ts`
- `src/lib/ai/prompts/review-summary.ts`
- `src/lib/ai/prompts/coach.ts`
- `src/components/ai/ai-action-button.tsx` -- reusable AI button (see Section 2.3)

**Files to modify:**
- `package.json` -- add `openai` dependency

**Depends on:** Nothing (Phase 1 complete)

**Acceptance criteria:**
- `pnpm add openai` installs without errors
- `createOpenAIClient(key)` returns an `OpenAI` instance
- `withAI` returns 401 for unauthenticated requests, 403 for users without API key, and passes `{ user, apiKey }` to handler for valid users
- `callAI<T>()` makes an OpenAI chat completion call and returns typed `AIActionResponse<T>`
- `handleAIError()` maps `OpenAI.AuthenticationError` to 401, `RateLimitError` to 429, etc.
- All prompt templates export `{ systemPrompt, userPrompt(vars), model, maxTokens, temperature }`
- `AIActionButton` renders disabled with tooltip when `useAI().isEnabled` is false, renders active when true
- All types compile with `tsc --noEmit`

---

### Task P2-2: Note AI Actions (Summarize, Insights, Auto-tag) --> backend-dev + frontend-dev

**Description**: Add three AI endpoints for notes and wire them to the note detail page UI.

**API Routes:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/notes/[id]/ai/summarize/route.ts` | gpt-4o-mini | Generate 3-5 bullet summary |
| POST | `/api/notes/[id]/ai/insights/route.ts` | gpt-4o-mini | Extract key insights |
| POST | `/api/notes/[id]/ai/tags/route.ts` | gpt-4o-mini | Suggest tags |

**Backend files to create:**
- `src/app/api/notes/[id]/ai/summarize/route.ts`
- `src/app/api/notes/[id]/ai/insights/route.ts`
- `src/app/api/notes/[id]/ai/tags/route.ts`

**Route handler pattern** (same for all three, shown for summarize):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAI } from '@/lib/ai/middleware'
import { callAI } from '@/lib/ai/call-ai'
import { handleAIError } from '@/lib/ai/error-handler'
import { noteSummarizePrompt } from '@/lib/ai/prompts'
import type { NoteSummary } from '@/lib/ai/types'

export const POST = withAI(async (req: NextRequest, { user, apiKey }) => {
  const noteId = req.nextUrl.pathname.split('/')[3] // /api/notes/[id]/ai/summarize

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id, isDeleted: false },
  })

  if (!note) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } },
      { status: 404 }
    )
  }

  if (note.contentMd.trim().length < 50) {
    return NextResponse.json(
      { success: false, error: { code: 'CONTENT_TOO_SHORT', message: 'Note content is too short to summarize. Add more content first.' } },
      { status: 400 }
    )
  }

  try {
    const result = await callAI<NoteSummary>({
      apiKey,
      model: noteSummarizePrompt.model,
      systemPrompt: noteSummarizePrompt.systemPrompt,
      userPrompt: noteSummarizePrompt.userPrompt({ title: note.title, content: note.contentMd }),
      maxTokens: noteSummarizePrompt.maxTokens,
      temperature: noteSummarizePrompt.temperature,
      responseFormat: 'json',
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleAIError(error)
  }
})
```

**Frontend files to create:**
- `src/hooks/use-note-ai.ts` -- React Query mutations for note AI actions
- `src/components/notes/note-ai-panel.tsx` -- AI results display panel on note detail page

**Frontend hook pattern:**

```typescript
// src/hooks/use-note-ai.ts
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AIActionResponse, NoteSummary, NoteInsights, TagSuggestions } from '@/lib/ai/types'

export function useNoteSummarize(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<NoteSummary>>(`/api/notes/${noteId}/ai/summarize`, { method: 'POST' }),
  })
}

export function useNoteInsights(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<NoteInsights>>(`/api/notes/${noteId}/ai/insights`, { method: 'POST' }),
  })
}

export function useNoteTagSuggestions(noteId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<AIActionResponse<TagSuggestions>>(`/api/notes/${noteId}/ai/tags`, { method: 'POST' }),
  })
}
```

**Frontend files to modify:**
- `src/app/(dashboard)/notes/[id]/page.tsx` -- add AI action buttons and results panel

**Depends on:** P2-1

**Acceptance criteria:**
- POST to summarize returns `{ success: true, data: { bullets: ["...", "...", ...] }, model: "gpt-4o-mini" }`
- POST to insights returns `{ success: true, data: { insights: [{ title, description }] } }`
- POST to tags returns `{ success: true, data: { tags: ["tag1", "tag2", ...] } }`
- All endpoints return 404 if note not found or belongs to another user
- All endpoints return 400 if note content is too short (< 50 chars)
- All endpoints return 403 if no API key configured
- AI buttons appear on note detail page only when `useAI().isEnabled` is true
- Clicking "Summarize" shows loading state, then displays bullets in a panel below the editor
- Clicking "Suggest Tags" shows suggestions the user can accept (adds to note tags) or dismiss
- Errors from OpenAI (bad key, rate limit) show user-friendly toast messages

---

### Task P2-3: Flashcard AI Generation --> backend-dev + frontend-dev

**Description**: Generate flashcards from note or book content. Returns draft cards for user review before saving.

**API Routes:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/notes/[id]/ai/flashcards/route.ts` | gpt-4o-mini | Generate cards from note |
| POST | `/api/books/[id]/ai/flashcards/route.ts` | gpt-4o-mini | Generate cards from book |

**Backend files to create:**
- `src/app/api/notes/[id]/ai/flashcards/route.ts`
- `src/app/api/books/[id]/ai/flashcards/route.ts`

**Route handler logic:**
1. Fetch note/book, verify ownership
2. Build prompt with content (for books: combine summaryMd + keyIdeas + quotes + learningsMd)
3. Call OpenAI with `flashcardGeneratePrompt`, response format JSON
4. Return array of `GeneratedFlashcard` objects

**Frontend files to create:**
- `src/hooks/use-flashcard-ai.ts` -- mutations for flashcard generation
- `src/components/ai/flashcard-review-dialog.tsx` -- modal to review/edit/accept generated cards

**Frontend UX flow:**
1. User clicks "Generate Flashcards" on note or book detail page
2. Loading spinner while AI processes
3. Dialog opens showing generated cards in editable list
4. User can: edit front/back text, delete individual cards, add more manually
5. User selects target deck (or creates new one) and clicks "Save to Deck"
6. Frontend calls existing `POST /api/flashcards` for each accepted card with `sourceType` and `sourceId` set

**Frontend files to modify:**
- `src/app/(dashboard)/notes/[id]/page.tsx` -- add "Generate Flashcards" button
- `src/app/(dashboard)/books/[id]/page.tsx` -- add "Generate Flashcards" button

**Depends on:** P2-1

**Acceptance criteria:**
- POST to notes flashcards endpoint returns 5-15 cards with `cardType`, `frontMd`, `backMd`, `sourceExcerpt`
- POST to books flashcards endpoint generates cards from book summary + key ideas + quotes
- Cards include a mix of `qa`, `cloze`, and `definition` types
- Review dialog shows all generated cards in editable form
- User can delete individual cards before saving
- "Save to Deck" creates flashcards via existing API with correct `sourceType`/`sourceId`
- 404 if entity not found, 400 if content too short, 403 if no key

---

### Task P2-4: Task AI Prioritization --> backend-dev + frontend-dev

**Description**: Analyze the user's current tasks and suggest priority reordering based on due dates, current priority, and task descriptions.

**API Route:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/tasks/ai/prioritize/route.ts` | gpt-4o-mini | Suggest priority changes |

**Backend files to create:**
- `src/app/api/tasks/ai/prioritize/route.ts`

**Route handler logic:**
1. Fetch all non-completed, non-cancelled tasks for user (limit 50, ordered by `orderIndex`)
2. Build prompt with task list (id, title, description excerpt, priority, dueDate, status, tags)
3. Call OpenAI, get back array of suggestions
4. Return `TaskPrioritizationResult`

**Frontend files to create:**
- `src/hooks/use-task-ai.ts` -- mutation for task prioritization
- `src/components/tasks/task-prioritize-dialog.tsx` -- dialog showing suggestions

**Frontend UX flow:**
1. User clicks "AI Prioritize" button on tasks page
2. Loading while AI analyzes
3. Dialog shows list of suggested changes: "Task X: medium -> high (reason: due tomorrow)"
4. User can accept individual suggestions or "Accept All"
5. Accepting calls existing `PUT /api/tasks/:id` for each changed task

**Frontend files to modify:**
- `src/app/(dashboard)/tasks/page.tsx` -- add "AI Prioritize" button in header

**Depends on:** P2-1

**Acceptance criteria:**
- Endpoint sends up to 50 active tasks to AI
- Response includes `suggestions[]` with `taskId`, `currentPriority`, `suggestedPriority`, `reason`
- Response includes overall `reasoning` string explaining the analysis
- Dialog shows each suggestion with accept/reject per item
- "Accept All" bulk-updates all suggested tasks
- Returns empty suggestions array if no changes recommended
- Returns 400 if user has no active tasks

---

### Task P2-5: Daily Plan AI Suggestion --> backend-dev + frontend-dev

**Description**: AI picks the top 3-5 tasks the user should focus on today, with a brief explanation.

**API Route:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/planner/ai/suggest/route.ts` | gpt-4o-mini | Suggest today's focus tasks |

**Backend files to create:**
- `src/app/api/planner/ai/suggest/route.ts`

**Route handler logic:**
1. Fetch active tasks for user (pending + in_progress, limit 50)
2. Fetch today's DayPlan if exists (to avoid re-suggesting already planned tasks)
3. Build prompt with tasks + today's date + any existing plan context
4. Call OpenAI, get `DailyPlanSuggestion`
5. Return suggested task IDs, reasoning, and a morning brief markdown

**Frontend files to create:**
- `src/hooks/use-planner-ai.ts` -- mutation for daily plan suggestion
- `src/components/planner/ai-suggest-panel.tsx` -- panel showing AI suggestion

**Frontend UX flow:**
1. User clicks "AI Suggest" on planner page
2. Loading state
3. Panel shows: morning brief markdown + list of suggested focus tasks (3-5)
4. User can "Accept Plan" which sets `DayPlan.focusTaskIds` and `DayPlan.aiBriefMd` via existing planner API

**Frontend files to modify:**
- `src/app/(dashboard)/planner/page.tsx` -- add "AI Suggest" button

**Depends on:** P2-1

**Acceptance criteria:**
- Returns 3-5 `suggestedTaskIds` that exist and belong to the user
- Returns `briefMd` with a 2-3 sentence morning brief
- Returns `reasoning` explaining why these tasks were chosen
- "Accept Plan" updates DayPlan via existing `PUT /api/planner/:date` endpoint
- Works even if user has no existing DayPlan for today
- Returns helpful message if user has fewer than 3 active tasks

---

### Task P2-6: Review AI Summary --> backend-dev + frontend-dev

**Description**: Generate a natural language summary of the user's day or week.

**API Route:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/reviews/daily/[date]/ai/summary/route.ts` | gpt-4o-mini | Generate daily recap |

**Backend files to create:**
- `src/app/api/reviews/daily/[date]/ai/summary/route.ts`

**Route handler logic:**
1. Fetch DailyReview for the date (or auto-populate metrics if not exists)
2. Fetch additional context: tasks completed that day, notes created, flashcards reviewed
3. Fetch the user's reflection text if they wrote one
4. Build prompt with all metrics + reflection
5. Call OpenAI, get `ReviewSummary`
6. Return the summary markdown

**Frontend files to create:**
- `src/hooks/use-review-ai.ts` -- mutation for review summary
- Update existing review components to show AI summary

**Frontend UX flow:**
1. User opens daily review page, clicks "Generate Summary"
2. Loading state
3. AI summary appears in the review view
4. User can "Save Summary" which updates `DailyReview.aiSummaryMd` via existing review API

**Frontend files to modify:**
- `src/components/reviews/daily-review.tsx` -- add "Generate Summary" button and summary display

**Depends on:** P2-1

**Acceptance criteria:**
- Returns a 3-5 sentence natural language recap of the day
- Incorporates metrics (tasks done, notes created, cards reviewed)
- Incorporates user's reflection text if present
- "Save Summary" persists to `DailyReview.aiSummaryMd`
- Returns 400 if date is in the future
- Works for dates with no activity (summary acknowledges light day)

---

### Task P2-7: AI Coach (Basic) --> backend-dev + frontend-dev

**Description**: Chat-like interface where users can ask the AI about their productivity, get advice, and request analysis of their data. Uses SSE streaming.

**API Route:**

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| POST | `/api/ai/coach/route.ts` | gpt-4o (streaming SSE) | AI coach conversation |

**Backend files to create:**
- `src/app/api/ai/coach/route.ts`

**Route handler logic (streaming):**

```typescript
import { withAI } from '@/lib/ai/middleware'
import { createOpenAIClient, AI_MODELS } from '@/lib/ai/openai-client'
import { coachPrompt } from '@/lib/ai/prompts'
import { handleAIError } from '@/lib/ai/error-handler'
import { prisma } from '@/lib/prisma'

export const POST = withAI(async (req, { user, apiKey }) => {
  const { messages } = await req.json() // Array of { role, content }

  // Gather user context for system prompt
  const [recentTasks, recentNotes, habits] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, status: { in: ['pending', 'in_progress'] } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { title: true, priority: true, status: true, dueDate: true },
    }),
    prisma.note.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: { title: true, tags: true, updatedAt: true },
    }),
    prisma.habit.findMany({
      where: { userId: user.id },
      take: 10,
      select: { title: true, frequency: true },
    }),
  ])

  const systemPrompt = coachPrompt.systemPrompt({
    userName: user.name || 'there',
    tasks: recentTasks,
    notes: recentNotes,
    habits,
    timezone: user.timezone,
  })

  try {
    const client = createOpenAIClient(apiKey)
    const stream = await client.chat.completions.create({
      model: AI_MODELS.SMART,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: coachPrompt.maxTokens,
      temperature: coachPrompt.temperature,
      stream: true,
    })

    // Return SSE stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return handleAIError(error)
  }
})
```

**Frontend files to create:**
- `src/app/(dashboard)/ai/page.tsx` -- AI Coach page
- `src/components/ai/coach-chat.tsx` -- chat interface component
- `src/components/ai/coach-message.tsx` -- individual message bubble
- `src/hooks/use-coach.ts` -- streaming hook

**Frontend streaming hook:**

```typescript
// src/hooks/use-coach.ts
import { useState, useCallback } from 'react'
import type { CoachMessage } from '@/lib/ai/types'

export function useCoach() {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: CoachMessage = { role: 'user', content }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || 'Failed to get response')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6) // remove "data: "
          if (data === '[DONE]') break

          const parsed = JSON.parse(data)
          assistantContent += parsed.content
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
            return updated
          })
        }
      }
    } catch (error) {
      // Handle error -- add error message or toast
    } finally {
      setIsStreaming(false)
    }
  }, [messages])

  const clearChat = useCallback(() => setMessages([]), [])

  return { messages, sendMessage, isStreaming, clearChat }
}
```

**Frontend files to modify:**
- Sidebar navigation -- add "AI Coach" link to `/ai`

**Depends on:** P2-1

**Acceptance criteria:**
- POST to `/api/ai/coach` returns SSE stream
- System prompt includes user's recent tasks, notes, and habits as context
- Tokens stream to the UI incrementally (user sees text appearing)
- Chat interface shows message history (user messages right-aligned, AI left-aligned)
- AI responses render as Markdown (code blocks, lists, bold)
- "New Chat" button clears conversation
- Error states: invalid key shows toast, rate limit shows retry message
- Conversation is client-side only (not persisted to DB in Phase 2)

---

### Task P2-8: Auto-tag Suggestions --> frontend-dev

**Description**: This is a UI-only task since the API endpoint is already created in P2-2 (`POST /api/notes/:id/ai/tags`). Wire the tag suggestions into the note editor's tag input area.

**Frontend files to modify:**
- `src/app/(dashboard)/notes/[id]/page.tsx` -- add "Suggest Tags" button near tag input
- Reuse `useNoteTagSuggestions` hook from P2-2

**Frontend UX flow:**
1. User clicks "Suggest Tags" button near the tag input on note detail page
2. Loading state on button
3. Suggested tags appear as clickable chips below the tag input
4. Clicking a chip adds it to the note's tags (calls existing `PUT /api/notes/:id`)
5. Dismissed suggestions fade out

**Depends on:** P2-2

**Acceptance criteria:**
- "Suggest Tags" button appears next to tag input area
- Suggested tags render as clickable chips/badges
- Clicking a suggested tag adds it to the note (optimistic update)
- Already-applied tags are not shown in suggestions
- Button is hidden when `useAI().isEnabled` is false

---

## 4. Parallel Execution Plan

```
Week 1:
  P2-1: AI Infrastructure (GATE -- must complete first)
  ===================================================

Week 2-3 (all parallel after P2-1):
  P2-2: Note AI Actions ─────────────────┐
  P2-3: Flashcard AI Generation ─────────┤
  P2-4: Task AI Prioritization ──────────┤  (all independent)
  P2-5: Daily Plan AI Suggestion ────────┤
  P2-6: Review AI Summary ──────────────┘

Week 2-3 (independent track):
  P2-7: AI Coach ─────────────────────────  (can run in parallel with P2-2 through P2-6)

Week 3-4 (depends on P2-2):
  P2-8: Auto-tag Suggestions UI ──────────  (needs P2-2 API)
```

**Maximum parallelism:** After P2-1 completes, tasks P2-2 through P2-7 can all run simultaneously across multiple agents. P2-8 is a small frontend task that depends only on P2-2's API being available.

**Critical path:** P2-1 --> P2-7 (Coach is the most complex single task)

**Estimated total effort:** ~2-3 weeks with 2 developers working in parallel

---

## 5. Prompt Templates

All prompts are stored as TypeScript objects. Each exports: `systemPrompt`, `userPrompt(vars)`, `model`, `maxTokens`, `temperature`.

---

### 5.1 Note Summarize (`src/lib/ai/prompts/note-summarize.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const noteSummarizePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 512,
  temperature: 0.3,

  systemPrompt: `You are a concise note summarizer. Given a note's title and content, produce a summary as 3-5 bullet points. Each bullet should be one clear sentence capturing a key point. Focus on actionable information and main ideas. Do not include filler or meta-commentary.

Respond with valid JSON in this exact format:
{
  "bullets": ["First key point.", "Second key point.", "Third key point."]
}`,

  userPrompt: (vars: { title: string; content: string }) =>
    `Note title: ${vars.title}\n\nNote content:\n${vars.content}`,
}
```

### 5.2 Note Insights (`src/lib/ai/prompts/note-insights.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const noteInsightsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.4,

  systemPrompt: `You are an insight extractor. Given a note's title and content, identify the 3-7 most important ideas. For each insight, provide a short title (3-6 words) and a 1-2 sentence description explaining why it matters or how it connects to broader concepts.

Respond with valid JSON in this exact format:
{
  "insights": [
    { "title": "Short insight title", "description": "Why this matters and how it connects." }
  ]
}`,

  userPrompt: (vars: { title: string; content: string }) =>
    `Note title: ${vars.title}\n\nNote content:\n${vars.content}`,
}
```

### 5.3 Note Tags (`src/lib/ai/prompts/note-tags.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const noteTagsPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 256,
  temperature: 0.3,

  systemPrompt: `You are a tag suggestion engine. Given a note's title, content, and existing tags, suggest 3-8 relevant tags. Tags should be lowercase, use hyphens for multi-word tags (e.g., "machine-learning"), and be specific enough to be useful for filtering. Do not repeat any of the existing tags.

Respond with valid JSON in this exact format:
{
  "tags": ["tag-one", "tag-two", "tag-three"]
}`,

  userPrompt: (vars: { title: string; content: string; existingTags: string[] }) =>
    `Note title: ${vars.title}\nExisting tags: ${vars.existingTags.length > 0 ? vars.existingTags.join(', ') : 'none'}\n\nNote content:\n${vars.content}`,
}
```

### 5.4 Flashcard Generate (`src/lib/ai/prompts/flashcard-generate.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const flashcardGeneratePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 2048,
  temperature: 0.5,

  systemPrompt: `You are a flashcard generator for a spaced repetition learning system. Given source content (from a note or book), create 5-15 high-quality flashcards.

Card type rules:
- "qa": Standard question on front, answer on back. Use for factual knowledge and concepts.
- "cloze": Front has a sentence with a blank (use "___" for the blank). Back has the complete sentence with the answer. Use for definitions and key terms.
- "definition": Front has a term/concept. Back has a clear definition. Use for vocabulary and terminology.

Guidelines:
- Each card should test one specific concept
- Questions should be clear and unambiguous
- Answers should be concise but complete
- Include sourceExcerpt: the relevant quote or passage the card is based on
- Use Markdown formatting in frontMd and backMd where helpful (bold key terms, use code blocks for code)
- Mix card types for variety
- Avoid trivial or overly obvious cards

Respond with valid JSON in this exact format:
{
  "cards": [
    {
      "cardType": "qa",
      "frontMd": "What is...?",
      "backMd": "It is...",
      "sourceExcerpt": "The relevant passage from the source."
    }
  ]
}`,

  userPrompt: (vars: { sourceType: 'note' | 'book'; title: string; content: string }) =>
    `Source type: ${vars.sourceType}\nTitle: ${vars.title}\n\nContent:\n${vars.content}`,
}
```

### 5.5 Task Prioritize (`src/lib/ai/prompts/task-prioritize.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const taskPrioritizePrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.3,

  systemPrompt: `You are a task prioritization assistant. Given a list of tasks with their current priority, status, due date, and description, suggest priority changes that would help the user focus on what matters most.

Consider these factors:
1. Due date urgency (overdue and due-soon tasks should be higher priority)
2. Current status (in-progress tasks may need maintained priority)
3. Task description (vague tasks may need lower priority until clarified)
4. Overall balance (not everything can be critical)

Only suggest changes where the priority should actually differ from what it currently is. If the current priorities are reasonable, return an empty suggestions array.

Priority levels: critical, high, medium, low

Respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "taskId": "the-task-id",
      "currentPriority": "medium",
      "suggestedPriority": "high",
      "reason": "Due tomorrow and currently blocked."
    }
  ],
  "reasoning": "Overall explanation of the analysis."
}`,

  userPrompt: (vars: { tasks: Array<{ id: string; title: string; priority: string; status: string; dueDate: string | null; description: string }> ; today: string }) =>
    `Today's date: ${vars.today}\n\nTasks:\n${vars.tasks.map(t => `- [${t.id}] "${t.title}" | priority: ${t.priority} | status: ${t.status} | due: ${t.dueDate || 'none'} | description: ${t.description.slice(0, 100)}`).join('\n')}`,
}
```

### 5.6 Daily Plan Suggest (`src/lib/ai/prompts/daily-plan-suggest.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const dailyPlanSuggestPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 1024,
  temperature: 0.4,

  systemPrompt: `You are a daily planning assistant. Given a user's task list, pick the top 3-5 tasks they should focus on today. Provide a brief morning plan (2-3 sentences, Markdown formatted) and explain your reasoning.

Selection criteria:
1. Tasks due today or overdue get top priority
2. High/critical priority tasks come next
3. In-progress tasks that need completion
4. Balance between urgent and important (avoid only picking urgent tasks)
5. Aim for a realistic daily workload (3-5 tasks, not 15)

Return task IDs from the provided list only. Never invent task IDs.

Respond with valid JSON in this exact format:
{
  "suggestedTaskIds": ["id1", "id2", "id3"],
  "reasoning": "Why these tasks were chosen.",
  "briefMd": "**Good morning!** Here is your focus for today..."
}`,

  userPrompt: (vars: { tasks: Array<{ id: string; title: string; priority: string; status: string; dueDate: string | null }>; today: string; existingPlanTaskIds: string[] }) =>
    `Today: ${vars.today}\nAlready planned: ${vars.existingPlanTaskIds.length > 0 ? vars.existingPlanTaskIds.join(', ') : 'none'}\n\nAvailable tasks:\n${vars.tasks.map(t => `- [${t.id}] "${t.title}" | priority: ${t.priority} | status: ${t.status} | due: ${t.dueDate || 'none'}`).join('\n')}`,
}
```

### 5.7 Review Summary (`src/lib/ai/prompts/review-summary.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const reviewSummaryPrompt = {
  model: AI_MODELS.FAST,
  maxTokens: 512,
  temperature: 0.5,

  systemPrompt: `You are a productivity coach writing a brief end-of-day summary. Given the user's daily metrics and optional reflection, write a natural language recap in 3-5 sentences. Be encouraging but honest. Use Markdown formatting.

Tone: supportive, concise, action-oriented. Mention specific numbers. If the user wrote a reflection, reference their own words. End with one forward-looking sentence about tomorrow.

Respond with valid JSON in this exact format:
{
  "summaryMd": "Your markdown summary here..."
}`,

  userPrompt: (vars: {
    date: string
    tasksCompleted: number
    tasksMissed: number
    notesCreated: number
    cardsReviewed: number
    reflection: string | null
    mood: string | null
  }) =>
    `Date: ${vars.date}\nTasks completed: ${vars.tasksCompleted}\nTasks missed: ${vars.tasksMissed}\nNotes created: ${vars.notesCreated}\nFlashcards reviewed: ${vars.cardsReviewed}\nMood: ${vars.mood || 'not set'}\nUser reflection: ${vars.reflection || 'No reflection written.'}`,
}
```

### 5.8 Coach (`src/lib/ai/prompts/coach.ts`)

```typescript
import { AI_MODELS } from '../openai-client'

export const coachPrompt = {
  model: AI_MODELS.SMART,
  maxTokens: 1024,
  temperature: 0.7,

  systemPrompt: (vars: {
    userName: string
    tasks: Array<{ title: string; priority: string; status: string; dueDate: Date | null }>
    notes: Array<{ title: string; tags: string[]; updatedAt: Date }>
    habits: Array<{ title: string; frequency: string }>
    timezone: string
  }) =>
    `You are NoBrainy Coach, a supportive personal productivity assistant for ${vars.userName}. You help users understand their productivity patterns, suggest focus areas, and provide actionable advice.

You have access to the user's current data:

**Active Tasks (${vars.tasks.length}):**
${vars.tasks.map(t => `- "${t.title}" [${t.priority}] ${t.status}${t.dueDate ? ` due: ${t.dueDate.toISOString().split('T')[0]}` : ''}`).join('\n')}

**Recent Notes (${vars.notes.length}):**
${vars.notes.map(n => `- "${n.title}" tags: [${n.tags.join(', ')}] updated: ${n.updatedAt.toISOString().split('T')[0]}`).join('\n')}

**Habits (${vars.habits.length}):**
${vars.habits.map(h => `- "${h.title}" (${h.frequency})`).join('\n')}

**User timezone:** ${vars.timezone}

Guidelines:
- Be concise and actionable. Avoid long monologues.
- Reference the user's actual data when answering questions.
- If asked "what should I focus on", use their task priorities and due dates.
- If asked about patterns, analyze their task/note data honestly.
- Use Markdown formatting for structure (bold, lists, headers).
- If you do not have enough data to answer, say so honestly.
- Never make up tasks, notes, or data the user does not have.`,

  // No userPrompt -- conversation messages are passed directly
  userPrompt: undefined,
}
```

### 5.9 Prompt Barrel Export (`src/lib/ai/prompts/index.ts`)

```typescript
export { noteSummarizePrompt } from './note-summarize'
export { noteInsightsPrompt } from './note-insights'
export { noteTagsPrompt } from './note-tags'
export { flashcardGeneratePrompt } from './flashcard-generate'
export { taskPrioritizePrompt } from './task-prioritize'
export { dailyPlanSuggestPrompt } from './daily-plan-suggest'
export { reviewSummaryPrompt } from './review-summary'
export { coachPrompt } from './coach'
```

---

## 6. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OpenAI API latency (2-10s per call) | Medium -- poor UX | High | Show clear loading states with skeleton UI. Coach uses streaming for perceived speed. Add timeout (30s) to all AI calls. |
| Invalid/expired user API keys | Medium -- broken feature | Medium | `withAI` middleware validates key exists. `handleAIError` maps 401 from OpenAI to "update your key" message. |
| JSON parse failures from AI responses | Medium -- broken feature | Low | All prompts explicitly request JSON format. `response_format: { type: 'json_object' }` enforced. `handleAIError` catches `SyntaxError`. |
| Token limit exceeded for long notes | Medium -- truncated results | Medium | Truncate note content to first 8000 characters in user prompts. Add note in prompt: "Content may be truncated." |
| Cost surprise for users (BYOK) | Low -- user issue | Low | Show model name in AI response. Future: add estimated cost per action. |
| Prompt injection via user content | High (security) | Low | System prompts are hardcoded (not user-editable). User content is always in the `user` message role, never interpolated into system prompts unsafely. Response format is enforced as JSON. |

---

## 7. Open Questions (for Lead)

- [ ] **Content truncation limit**: Should we truncate note/book content at 8000 chars for AI calls, or allow longer content (higher cost)? Recommendation: 8000 chars (~2000 words) covers most notes.
- [ ] **AI Coach persistence**: Should coach conversations be saved to DB in Phase 2, or is client-side-only acceptable? Recommendation: client-side only for Phase 2, DB persistence in Phase 3.
- [ ] **Weekly review summary**: The PRD mentions weekly review AI summary. Should this be a separate endpoint (`POST /api/reviews/weekly/:weekStart/ai/summary`) in Phase 2, or defer to Phase 3? Recommendation: defer -- daily summary covers the core need.
- [ ] **Flashcard count control**: Should users be able to specify how many flashcards to generate (e.g., "generate 5 cards" vs "generate 15 cards")? Recommendation: let AI decide (5-15) for Phase 2, add user control in Phase 3.
