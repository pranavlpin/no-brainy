# MyFocusHub - Personal Productivity & Learning Operating System
## Product Requirements Document | v1.0

**Status:** Draft
**Version:** 1.0
**Date:** 2025
**Audience:** Engineering / Product

This document defines the complete product requirements for MyFocusHub. It is intended as the source of truth for architectural decisions, technical planning, and implementation priorities.

---

## 1. Product Vision & Strategy

MyFocusHub is a personal operating system for thinking, learning, and execution — a unified platform that helps individuals capture knowledge, organize information, plan their work, retain what they learn, and continuously improve their behavior through AI-powered insights.

### 1.1 Core Philosophy

The system is built around a single continuous loop:
**Capture → Organize → Plan → Execute → Learn → Reflect → Improve**

**Design Principles:**
- Minimal friction: fast capture is more important than perfect structure
- AI assists thinking — it does not replace it
- Everything is connected: notes link to tasks, tasks link to goals, goals link to insights
- Store raw data, render intelligently — never lock users into a proprietary format
- Markdown-first: all notes stored as raw Markdown, rendered on the frontend

### 1.2 Target User
Primary: Developers, product thinkers, and knowledge workers who want a single system for notes, tasks, and learning — not multiple disconnected tools.

### 1.3 Success Metrics

| Metric | Target (6 months) | Measurement |
|--------|-------------------|-------------|
| Daily Active Usage | 5+ sessions/week per user | Event tracking |
| Tasks completed/day | 3+ per active user | Task completion events |
| Notes created/week | 5+ per active user | Note creation events |
| Flashcards reviewed/week | 10+ per active user | Review session events |
| AI feature usage | >40% of sessions | AI action triggers |
| 7-day retention | >60% | Cohort analysis |
| 30-day retention | >35% | Cohort analysis |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

Architecture Decision: The system follows a modular monorepo structure in Phase 1, with clear module boundaries to enable microservice extraction in Phase 3 without a rewrite.

```
┌─────────────────────────────────────────────────────────┐
│                    MyFocusHub Platform                  │
├───────────────────────┬─────────────────────────────────┤
│     Frontend Layer    │         API Layer               │
│  Next.js (Web)        │  Node.js / FastAPI              │
│  React Native (later) │  REST + GraphQL (future)        │
├───────────────────────┼─────────────────────────────────┤
│     Data Layer        │      AI / ML Layer              │
│  PostgreSQL (primary) │  OpenAI APIs                    │
│  pgvector (AI search) │  Prompt templates per module    │
│  Redis (cache/queue)  │  Vector embeddings              │
├───────────────────────┴─────────────────────────────────┤
│                  Infrastructure Layer                    │
│  Auth (JWT + OAuth)  |  Cloud Storage  |  CDN           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Decisions

| Layer | Technology | Rationale | Phase |
|-------|-----------|-----------|-------|
| Frontend | Next.js 14 (App Router) | SSR, routing, API routes in one framework | 1 |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, low overhead | 1 |
| Mobile | React Native (Expo) | Code sharing with web | 3 |
| Backend | Node.js (Express/Hono) | Same language as frontend, fast iteration | 1 |
| Database | PostgreSQL 16 | ACID, full-text search, pgvector extension | 1 |
| Vector DB | pgvector (PostgreSQL ext) | No separate DB needed for semantic search | 2 |
| Cache | Redis | Session store, job queues, rate limiting | 2 |
| AI | OpenAI GPT-4o / GPT-4o-mini | GPT-4o-mini for cost-sensitive operations | 1 |
| Auth | NextAuth.js + JWT | Session management, OAuth providers | 1 |
| Storage | AWS S3 / Cloudflare R2 | File uploads, media storage | 2 |
| Background Jobs | Bull (Redis-backed) | Async AI tasks, spaced repetition scheduler | 2 |
| Markdown Render | react-markdown + remark | Markdown + GFM + code highlighting | 1 |
| Diagrams | Mermaid.js | In-note diagram rendering | 1 |
| ORM | Prisma | Type-safe queries, migration management | 1 |

---

## 3. Module Specifications

### 3.1 Notes Module

#### 3.1.1 Features
- Create, edit, delete notes with auto-save (debounced, 500ms)
- Markdown-first editor with live split-pane preview
- Full Markdown support: headings, lists, checkboxes, code blocks, tables, blockquotes, links
- Mermaid.js diagram rendering inside fenced code blocks
- Syntax highlighting for code blocks (rehype-highlight)
- Tags: multi-tag support, tag autocomplete, tag-based filtering
- Full-text search within notes
- Bi-directional linking: [[NoteTitle]] wiki-style links
- Link notes to: Tasks, Books, Flashcard Decks
- Pin important notes
- Soft delete with 30-day recovery

#### 3.1.2 AI Features

| AI Action | Behaviour |
|-----------|-----------|
| Summarize Note | Generates a 3–5 bullet point summary of note content |
| Extract Key Insights | Identifies the 3–7 most important ideas from the note |
| Generate Flashcards | Creates a draft flashcard deck from the note content |
| Auto-tag Suggestion | Suggests relevant tags based on note content |
| Link Suggestions | Suggests related notes/books based on semantic similarity |

#### 3.1.3 Data Model

```sql
Note {
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID NOT NULL REFERENCES users(id)
  title         TEXT NOT NULL DEFAULT ''
  content_md    TEXT NOT NULL DEFAULT ''   -- raw Markdown stored always
  tags          TEXT[]         DEFAULT '{}'
  is_pinned     BOOLEAN        DEFAULT false
  is_deleted    BOOLEAN        DEFAULT false
  deleted_at    TIMESTAMPTZ
  embedding     vector(1536)   -- pgvector for semantic search
  word_count    INTEGER        GENERATED ALWAYS AS (...) STORED
  created_at    TIMESTAMPTZ    DEFAULT now()
  updated_at    TIMESTAMPTZ    DEFAULT now()
}

NoteLink {
  id            UUID PRIMARY KEY
  source_id     UUID REFERENCES notes(id) ON DELETE CASCADE
  target_type   TEXT  -- 'note' | 'task' | 'book' | 'deck'
  target_id     UUID
  created_at    TIMESTAMPTZ DEFAULT now()
}
```

#### 3.1.4 API Endpoints

| Method + Path | Description |
|---------------|-------------|
| GET /api/notes | List all notes (filter by tags, search query, pinned) |
| POST /api/notes | Create new note (title, content_md, tags) |
| GET /api/notes/:id | Get single note with linked entities |
| PUT /api/notes/:id | Update note content or metadata |
| DELETE /api/notes/:id | Soft delete (sets is_deleted=true) |
| POST /api/notes/:id/ai/summarize | AI: generate note summary |
| POST /api/notes/:id/ai/insights | AI: extract key insights |
| POST /api/notes/:id/ai/flashcards | AI: generate flashcard draft |
| GET /api/notes/search?q= | Full-text + semantic search across notes |

#### 3.1.5 Rendering Pipeline

```
Input (raw Markdown string)
  → react-markdown parser
  → remark-gfm plugin       (GFM: tables, checkboxes, strikethrough)
  → rehype-highlight plugin  (code syntax highlighting)
  → custom rehype plugin:    detect lang === "mermaid" → replace <pre> with <MermaidDiagram>
  → sanitize HTML (DOMPurify, whitelist tags)
  → React render to DOM
```

**XSS Prevention:**
- Sanitize all HTML before render
- Disable raw HTML in react-markdown by default
- Whitelist safe tags only (no `<script>`, no `<iframe>`)

---

### 3.2 Book Summary Module

#### 3.2.1 Features
- Add books manually (title, author, cover image URL, genre, status)
- Reading status: Want to Read / Reading / Completed
- Structured fields: Summary, Key Ideas (list), Favourite Quotes (list), Personal Learnings, How I Will Apply This
- All fields support Markdown formatting
- Rating (1–5 stars)
- Link book to: Notes, Flashcard Decks, Tasks (action items)
- Progress tracking: pages read, completion date

#### 3.2.2 AI Features

| AI Action | Behaviour |
|-----------|-----------|
| Generate Summary | User pastes raw chapter/content → AI produces structured summary |
| Extract Key Takeaways | Identifies 5–10 actionable insights from the book |
| Generate Flashcards | Creates revision deck from key ideas and quotes |
| Suggest Action Items | Converts learnings into concrete tasks to apply |
| Book-to-Note Distillation | Converts book summary into a linked Markdown note |

#### 3.2.3 Data Model

```sql
Book {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  title           TEXT NOT NULL
  author          TEXT
  cover_url       TEXT
  genre           TEXT[]    DEFAULT '{}'
  status          TEXT      DEFAULT 'want_to_read'  -- want_to_read | reading | completed
  rating          SMALLINT  CHECK (rating BETWEEN 1 AND 5)
  summary_md      TEXT      DEFAULT ''
  key_ideas       JSONB     DEFAULT '[]'   -- [{text, order}]
  quotes          JSONB     DEFAULT '[]'   -- [{text, page}]
  learnings_md    TEXT      DEFAULT ''
  application_md  TEXT      DEFAULT ''
  pages_total     INTEGER
  pages_read      INTEGER   DEFAULT 0
  completed_at    TIMESTAMPTZ
  embedding       vector(1536)
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
}
```

---

### 3.3 Task & Todo Management Module

#### 3.3.1 Features
- Create, edit, delete tasks with title, description (Markdown), due date, priority, status
- Priority levels: Critical / High / Medium / Low
- Status: Pending / In Progress / Completed / Cancelled
- Tags: multi-tag support
- Eisenhower Matrix view: 4-quadrant layout
- Subtasks: nested checklist under any task
- Recurring tasks: daily, weekly, monthly (RRULE-based)
- Link tasks to: Notes, Books, Goals
- Bulk actions: complete, delete, reprioritize
- Keyboard shortcuts for fast entry

#### 3.3.2 AI Features

| AI Action | Behaviour |
|-----------|-----------|
| Auto-Prioritize | Analyzes task list and suggests priority reordering |
| Suggest Daily Plan | Picks top 3–5 tasks for today based on urgency + due dates |
| Detect Procrastination | Flags tasks overdue by >3 days repeatedly |
| Break Down Task | Decomposes vague task into specific subtasks |
| Estimate Time | Suggests rough time estimates per task |

#### 3.3.3 Data Model

```sql
Task {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  parent_task_id  UUID REFERENCES tasks(id)  -- for subtasks
  goal_id         UUID REFERENCES goals(id)
  title           TEXT NOT NULL
  description_md  TEXT DEFAULT ''
  priority        TEXT DEFAULT 'medium'  -- critical | high | medium | low
  status          TEXT DEFAULT 'pending'  -- pending | in_progress | completed | cancelled
  tags            TEXT[]       DEFAULT '{}'
  due_date        DATE
  completed_at    TIMESTAMPTZ
  is_recurring    BOOLEAN      DEFAULT false
  rrule           TEXT         -- RRULE string for recurring tasks
  quadrant        TEXT         -- urgent_important | not_urgent_important | ...
  order_index     FLOAT        DEFAULT 0  -- for drag-and-drop ordering
  created_at      TIMESTAMPTZ  DEFAULT now()
  updated_at      TIMESTAMPTZ  DEFAULT now()
}

TaskLink {
  task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE
  linked_type     TEXT   -- 'note' | 'book'
  linked_id       UUID
  PRIMARY KEY (task_id, linked_type, linked_id)
}
```

---

### 3.4 Daily Planner Module

#### 3.4.1 Features
- "Today" view: shows tasks due today + AI-suggested priorities
- Top 3 daily focus items (user-selected or AI-suggested)
- Optional time blocking: drag tasks into time slots
- Daily task carry-forward: incomplete tasks auto-surfaced next day
- Progress indicator: X of Y tasks completed today
- Morning brief: AI-generated plan for the day (on-demand)

#### 3.4.2 Data Model

```sql
DayPlan {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  plan_date       DATE NOT NULL
  focus_task_ids  UUID[]   DEFAULT '{}'  -- top 3
  time_blocks     JSONB    DEFAULT '[]'  -- [{task_id, start_time, end_time, order}]
  ai_brief_md     TEXT
  created_at      TIMESTAMPTZ DEFAULT now()
  UNIQUE (user_id, plan_date)
}
```

---

### 3.5 Flashcard & Spaced Repetition Module

#### 3.5.1 Features
- Create and manage Decks (groups of flashcards)
- Card types: Q&A / Cloze / Definition / Reflection / Application
- Sources: manual creation / generated from Note / generated from Book / custom pasted content
- AI-generated flashcard draft → user edits before saving
- Difficulty ratings per session: Easy / Medium / Hard / Forgot
- Spaced repetition scheduling: SM-2 algorithm
- Daily review queue: Due Today / Weak Cards / New Cards
- Review streak tracking
- Source linking: every card links back to its source note/book/paragraph
- Tags on cards and decks
- Quiz mode: show front → user rates recall → show back

#### 3.5.2 Spaced Repetition Algorithm (SM-2)

```javascript
function nextReview(card, rating) {
  // rating: 0=Forgot, 1=Hard, 2=Medium, 3=Easy
  const easinessFactor = Math.max(1.3, card.ease_factor + (0.1 - (3-rating) * 0.08))

  if (rating === 0) {
    return { interval: 1, ease_factor: easinessFactor, state: 'learning' }
  }
  if (card.interval === 0) return { interval: 1, ease_factor: easinessFactor, state: 'learning' }
  if (card.interval === 1) return { interval: 6, ease_factor: easinessFactor, state: 'review' }

  const newInterval = Math.round(card.interval * easinessFactor)
  return {
    interval: newInterval,
    ease_factor: easinessFactor,
    state: newInterval >= 21 ? 'mastered' : 'review'
  }
}
```

#### 3.5.3 AI Features

| AI Action | Behaviour |
|-----------|-----------|
| Generate from Note | Creates Q&A and cloze cards from note headings + content |
| Generate from Book | Creates cards from key ideas, quotes, learnings |
| Difficulty Level Control | Beginner / Standard / Deep / Interview-style variants |
| Deduplication | Detects and removes near-duplicate cards before saving |
| AI Explain (on forgot) | If card forgotten, AI provides simple explanation |
| Identify Weak Areas | Analyzes review history to find consistently failed topics |

#### 3.5.4 Data Model

```sql
Deck {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  name            TEXT NOT NULL
  description_md  TEXT DEFAULT ''
  tags            TEXT[] DEFAULT '{}'
  card_count      INTEGER GENERATED ALWAYS AS (...) STORED
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
}

Flashcard {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  deck_id         UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE
  user_id         UUID NOT NULL REFERENCES users(id)
  card_type       TEXT NOT NULL  -- qa | cloze | definition | reflection | application
  front_md        TEXT NOT NULL
  back_md         TEXT NOT NULL
  tags            TEXT[] DEFAULT '{}'
  source_type     TEXT    -- note | book | manual | custom
  source_id       UUID
  source_excerpt  TEXT    -- quote from source for context
  -- SM-2 fields
  state           TEXT DEFAULT 'new'  -- new | learning | review | mastered
  ease_factor     FLOAT DEFAULT 2.5
  interval        INTEGER DEFAULT 0  -- days until next review
  next_review_at  DATE DEFAULT CURRENT_DATE
  review_count    INTEGER DEFAULT 0
  last_rating     TEXT    -- easy | medium | hard | forgot
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()
}

ReviewSession {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  deck_id         UUID REFERENCES decks(id)
  started_at      TIMESTAMPTZ DEFAULT now()
  completed_at    TIMESTAMPTZ
  cards_reviewed  INTEGER DEFAULT 0
  cards_easy      INTEGER DEFAULT 0
  cards_hard      INTEGER DEFAULT 0
  cards_forgot    INTEGER DEFAULT 0
}
```

---

### 3.6 Review System Module

#### 3.6.1 Daily Review
- Triggered at end of day (or manually)
- Shows: tasks completed, tasks missed, notes created, flashcards reviewed
- Guided reflection prompts: What did I complete? What got delayed? Why?
- AI summary: generates brief natural-language recap of the day

#### 3.6.2 Weekly Review
- Triggered on Sunday (or manually)
- Shows: week-at-a-glance metrics, completion rate, streak
- Guided questions: What worked? What didn't? What will I improve?
- AI pattern detection: surfaces recurring themes from review answers

#### 3.6.3 Data Model

```sql
DailyReview {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  review_date     DATE NOT NULL
  tasks_completed INTEGER DEFAULT 0
  tasks_missed    INTEGER DEFAULT 0
  notes_created   INTEGER DEFAULT 0
  cards_reviewed  INTEGER DEFAULT 0
  reflection_md   TEXT    DEFAULT ''
  ai_summary_md   TEXT
  mood            TEXT    -- great | good | okay | bad
  created_at      TIMESTAMPTZ DEFAULT now()
  UNIQUE (user_id, review_date)
}
```

---

### 3.7 Insight Engine (AI Differentiator)

#### 3.7.1 Input Sources
- Task completion history
- Daily review responses
- Flashcard review performance
- Note creation frequency and topic clusters
- Activity logs

#### 3.7.2 Insight Types

| Insight Type | Example Output |
|-------------|----------------|
| Procrastination Pattern | "You have delayed fitness-related tasks 4 times this week" |
| Workload Imbalance | "You are overloading Mondays — 70% of tasks fall on that day" |
| Priority Mismatch | "Your High priority tasks have a 30% completion rate vs 80% for Medium" |
| Consistency Streak | "You have reviewed flashcards 7 days in a row — keep it up" |
| Knowledge Gap | "You frequently forget cards related to System Design" |
| Time Patterns | "Your most productive window is 9–11am" |
| Topic Clusters | "Most of your notes this month relate to 'Productivity' and 'Android Development'" |

#### 3.7.3 AI Coach Interface
Users can directly query the AI coach:
- "What should I focus on today?"
- "Why am I not completing my tasks?"
- "Summarize my week for me"
- "What topics should I revise in my flashcards?"
- "What patterns do you notice in my behavior?"

#### 3.7.4 Data Model

```sql
Insight {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES users(id)
  insight_type    TEXT NOT NULL  -- procrastination | workload | priority | streak | gap | time | topic
  content_md      TEXT NOT NULL
  severity        TEXT    -- info | warning | positive
  related_entity  TEXT    -- task | note | book | flashcard
  related_ids     UUID[]  DEFAULT '{}'
  is_dismissed    BOOLEAN DEFAULT false
  generated_at    TIMESTAMPTZ DEFAULT now()
  valid_until     TIMESTAMPTZ  -- insights expire
}
```

---

### 3.8 Goals & Habit Layer

#### 3.8.1 Features
- Define goals with title, description, target date, and category
- Link tasks, notes, and books to goals
- Progress tracking: percentage based on linked task completion
- Habit tracking: binary daily check-ins
- Streak display per habit

#### 3.8.2 Data Model

```sql
Goal {
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL REFERENCES users(id)
  title         TEXT NOT NULL
  description   TEXT DEFAULT ''
  category      TEXT   -- fitness | learning | work | personal
  target_date   DATE
  status        TEXT DEFAULT 'active'  -- active | completed | paused
  created_at    TIMESTAMPTZ DEFAULT now()
}

Habit {
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL REFERENCES users(id)
  goal_id       UUID REFERENCES goals(id)
  title         TEXT NOT NULL
  frequency     TEXT  -- daily | weekdays | weekly
  created_at    TIMESTAMPTZ DEFAULT now()
}

HabitLog {
  id            UUID PRIMARY KEY
  habit_id      UUID REFERENCES habits(id) ON DELETE CASCADE
  log_date      DATE NOT NULL
  completed     BOOLEAN DEFAULT false
  UNIQUE (habit_id, log_date)
}
```

---

### 3.9 Global Search — Second Brain

#### 3.9.1 Features
- Universal search across: Notes / Tasks / Books / Flashcards / Reviews
- Full-text search (PostgreSQL tsvector + GIN index)
- Semantic / natural language search (pgvector + OpenAI embeddings)
- Hybrid mode: combine keyword + semantic results, re-rank by relevance
- Filter by entity type, tags, date range
- Search results preview with source link

#### 3.9.2 Embedding Strategy
- Model: text-embedding-ada-002 (1536 dims)
- Stored in: vector(1536) column on each entity table
- Triggered: on create/update (async via background job)
- Fallback: if embedding unavailable, use full-text search only

**Search query flow:**
1. User types query
2. Generate embedding for query (OpenAI API call)
3. Vector similarity search (pgvector cosine distance)
4. Full-text search (tsvector)
5. Merge + re-rank results (reciprocal rank fusion)
6. Return top 20 results with entity type + preview

---

## 4. AI System Architecture

### 4.1 AI Principles
- Assist thinking, never replace it
- Cost-aware: route to GPT-4o-mini for bulk/cheap operations, GPT-4o for insight/coach tasks
- Async-first: all AI tasks run in background via queue, results pushed to UI
- Prompt versioning: store prompt templates with version IDs
- Graceful degradation: if AI unavailable, all core features still work

### 4.2 Prompt Template Architecture

```sql
PromptTemplate {
  id          UUID
  module      TEXT    -- notes | books | flashcards | insights | coach
  action      TEXT    -- summarize | generate_cards | prioritize | ...
  version     INTEGER
  model       TEXT    -- gpt-4o | gpt-4o-mini
  system_prompt TEXT
  user_prompt   TEXT  -- uses {{variables}} for interpolation
  max_tokens  INTEGER
  temperature FLOAT
  is_active   BOOLEAN
}
```

### 4.3 AI Cost Management

| Operation | Model Strategy |
|-----------|---------------|
| Note summarization | GPT-4o-mini |
| Flashcard generation | GPT-4o-mini with structured output |
| Book takeaway extraction | GPT-4o-mini |
| Task prioritization | GPT-4o-mini |
| Insight Engine analysis | GPT-4o (complex reasoning) |
| AI Coach conversations | GPT-4o (quality matters most) |
| Semantic search embeddings | text-embedding-ada-002 |
| Daily/Weekly summaries | GPT-4o-mini |

### 4.4 AI Job Queue Design

- Queue: Redis + Bull
- Job types: embed_entity, generate_summary, generate_cards, run_insight, daily_brief
- Retry policy: 3 attempts, exponential backoff (1s, 4s, 16s)
- Result delivery: WebSocket push or polling endpoint
- Rate limiting: Per user max 20 AI requests/hour, max 5/minute

---

## 5. Markdown & Diagram Rendering

### 5.1 Editor Modes
- **Split View (Default):** Left: raw Markdown editor, Right: live preview (debounced 300ms)
- **Focus Mode (Phase 2):** Full-width Markdown editor, toggle preview on demand
- **Preview Only:** Read-only rendered view

### 5.2 Supported Markdown Features
- Headings, Lists, Task Checkboxes, Bold/Italic/Strikethrough
- Inline Code + Code Blocks with syntax highlighting
- Tables, Blockquotes, Links, Images (whitelisted domains)
- [[Wiki Links]] — custom plugin resolves to internal note links
- Mermaid Diagrams — custom rehype plugin

### 5.3 Security & Performance
- Sanitize all rendered HTML using DOMPurify
- Disable raw HTML in react-markdown config
- Mermaid renders in isolated container
- Lazy render for notes > 10,000 characters
- Debounce live preview: 300ms
- Cache rendered HTML in memory per session

---

## 6. Supporting Features

### 6.1 Quick Capture
- Global floating input (Cmd+K / Ctrl+K)
- AI auto-classifies input into: Task / Note / Idea
- User can override classification before saving

### 6.2 Personal Analytics Dashboard
- Task completion rate (line chart, 30 days)
- Productivity by day of week
- Habit streaks (heatmap calendar)
- Flashcard review streak
- Note creation volume
- Most active hours (heatmap)
- Procrastination score

### 6.3 Focus Mode
- Activated per-task: hides sidebar, navigation
- Shows only: current task + linked notes + optional timer
- Exit with Escape key

### 6.4 Smart Reminders
- Time-based: due date notifications
- Behavior-based: "This task has been pending 3 days"
- Habit nudge
- Flashcard reminder

---

## 7. Authentication & User Management

### 7.1 Auth Strategy
- Phase 1: Email + password with JWT sessions
- Phase 1: Google OAuth (NextAuth.js provider)
- Phase 2: Magic link (passwordless)
- JWT: access token (15 min) + refresh token (30 days, rotated)

### 7.2 User Data Model

```sql
User {
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  email           TEXT UNIQUE NOT NULL
  name            TEXT
  avatar_url      TEXT
  provider        TEXT DEFAULT 'email'  -- email | google
  password_hash   TEXT    -- null for OAuth users
  timezone        TEXT DEFAULT 'UTC'
  preferences     JSONB DEFAULT '{}'
  created_at      TIMESTAMPTZ DEFAULT now()
  last_active_at  TIMESTAMPTZ DEFAULT now()
}

UserSession {
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE
  refresh_token   TEXT UNIQUE NOT NULL
  expires_at      TIMESTAMPTZ NOT NULL
  created_at      TIMESTAMPTZ DEFAULT now()
}
```

---

## 8. Implementation Roadmap

### Phase 1 — Foundation (Months 1–2)
Goal: Working core app with no AI.

| Feature | Module | Priority |
|---------|--------|----------|
| User auth (email + Google) | Auth | P0 |
| Notes CRUD + Markdown editor | Notes | P0 |
| Tags + search (full-text) | Notes | P0 |
| Tasks CRUD + Eisenhower | Tasks | P0 |
| Book summary CRUD | Books | P0 |
| Flashcard manual creation | Flashcards | P0 |
| Basic daily planner (Today view) | Planner | P1 |
| Soft delete + recovery | Notes/Tasks | P1 |
| Quick Capture | Global | P1 |
| Basic analytics | Analytics | P1 |

### Phase 2 — Intelligence (Months 3–4)
Goal: AI-powered features.

| Feature | Module | Priority |
|---------|--------|----------|
| AI note summarization | Notes | P0 |
| AI flashcard generation | Flashcards | P0 |
| Spaced repetition (SM-2) | Flashcards | P0 |
| AI task prioritization | Tasks | P0 |
| AI daily planner suggestion | Planner | P0 |
| Semantic search (pgvector) | Search | P1 |
| Daily review system | Reviews | P1 |
| Weekly review + AI summary | Reviews | P1 |
| AI coach (basic) | Insights | P1 |
| Smart reminders | Notifications | P2 |

### Phase 3 — Scale (Months 5–6)
Goal: Advanced behaviors, mobile, personalization.

| Feature | Module | Priority |
|---------|--------|----------|
| Insight engine (full) | Insights | P0 |
| Goals + Habit tracker | Goals | P0 |
| Full analytics dashboard | Analytics | P0 |
| Focus mode | Global | P1 |
| AI knowledge distillation | Books/Notes | P1 |
| Flashcard quiz mode | Flashcards | P1 |
| Note bi-directional linking | Notes | P1 |
| React Native mobile app | Mobile | P2 |
| Collaboration / sharing | Global | P3 |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Feature bloat / scope creep | High | High | Strict phase gating; P0/P1/P2 tagging |
| AI API cost overruns | Medium | High | Route to mini models; rate limiting |
| Spaced repetition complexity | Medium | Medium | Use SM-2 (proven); no custom algorithm |
| Low retention / engagement | Medium | High | Focus daily use loop; habit + streak mechanics |
| Search quality (semantic) | Low | Medium | Fall back to full-text if pgvector unavailable |
| Mermaid rendering edge cases | Medium | Low | Fallback: show raw code block on render error |
| Mobile complexity (Phase 3) | High | Medium | Start with mobile-responsive web before native |

---

## 10. Open Architectural Decisions

| Decision Area | Options & Recommendation |
|---------------|-------------------------|
| Backend framework | Express (simpler) vs Hono (faster, type-safe). Recommend: Hono |
| Frontend state management | Zustand (lightweight) vs React Query (server state). Recommend: Zustand + React Query |
| Real-time updates (AI results) | WebSocket vs SSE vs polling. Recommend: SSE for Phase 2 |
| AI response streaming | Stream tokens to UI vs return complete. Recommend: stream for coach, complete for generation |
| Offline support | Not in Phase 1. Phase 2: service worker + IndexedDB |
| Markdown editor library | @uiw/react-md-editor vs custom CodeMirror. Recommend: CodeMirror 6 |
| Email notifications | Resend vs SendGrid. Recommend: Resend |
| Background jobs | Bull vs BullMQ. Recommend: BullMQ |
