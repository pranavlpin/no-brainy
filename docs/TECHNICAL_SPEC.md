# Technical Specification: NoBrainy

**Version:** 1.0
**Date:** 2026-04-01
\*\*Status:\*\* Implemented
**PRD Reference:** `docs/NoBrainy_PRD.md` v1.0

---

## 1. Overview

NoBrainy is a personal productivity and learning operating system built as a Next.js 14 monorepo. Phase 1 delivers a fully functional core app (Notes, Tasks, Books, Flashcards, Daily Planner) with no AI dependencies. The architecture is designed so that AI features (Phase 2) and scale features (Phase 3) can be added without structural rewrites.

The system uses Next.js App Router for SSR and API routes, PostgreSQL via Prisma ORM for persistence, and a modular frontend with Zustand for client state and React Query (TanStack Query) for server state. The backend API layer lives inside Next.js API route handlers -- no separate Express/Hono server in Phase 1. This simplifies deployment and reduces infrastructure while retaining the option to extract a standalone API server in Phase 3.

**Key Phase 1 deliverables:**
- Authentication (email/password + Google OAuth)
- Notes CRUD with Markdown editor, tags, full-text search
- Tasks CRUD with Eisenhower Matrix, subtasks, recurring tasks
- Book summaries CRUD with reading status tracking
- Flashcard decks with manual card creation and basic review
- Daily Planner (Today view with focus items)
- Global search (full-text, keyword-based)
- Quick Capture (Cmd+K)

---

## 2. Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| API layer | Next.js API Route Handlers (App Router) | Separate Hono server, Express | Eliminates separate server process in Phase 1. Type safety via shared TS types. Can extract to Hono in Phase 3 if needed. Route handlers support streaming for Phase 2 AI. |
| Backend validation | Zod schemas | class-validator, io-ts | Already in dependency tree. Pairs with Prisma for end-to-end type safety. Shared between client and server. |
| Frontend state (client) | Zustand | Redux, Jotai | Minimal boilerplate, works outside React tree, recommended by PRD. |
| Frontend state (server) | TanStack React Query v5 | SWR, manual fetch | Automatic cache invalidation, optimistic updates, infinite scroll support. Zustand only for UI state (sidebar open, modals). |
| Markdown editor | CodeMirror 6 | @uiw/react-md-editor, Monaco | PRD recommends CodeMirror 6. Extensible (custom wiki-link plugin), performant for large documents, mobile-friendly. |
| Markdown rendering | react-markdown + remark-gfm + rehype-highlight | MDX, marked | PRD specifies this stack. Safe (no raw HTML by default), extensible via plugins. |
| Database | PostgreSQL 16 + Prisma ORM | Drizzle, Kysely | PRD specifies Prisma. Mature migration system, type-safe queries, good pgvector support for Phase 2. |
| Auth | NextAuth.js v5 (Auth.js) | Lucia, custom JWT | Handles OAuth providers, session management, JWT rotation. PRD specifies NextAuth. |
| Styling | Tailwind CSS v3 + shadcn/ui | Chakra UI, Radix primitives | PRD specifies this. Copy-paste components, full control, consistent design tokens. |
| ID generation | CUID2 (via Prisma @default(cuid())) | UUID v4, nanoid | URL-safe, sortable, collision-resistant. Prisma has built-in support. |
| Full-text search (Phase 1) | PostgreSQL tsvector + GIN index | Meilisearch, Elasticsearch | No additional infrastructure. Good enough for Phase 1. Semantic search via pgvector added in Phase 2. |
| Monorepo structure | Single Next.js app with `src/` modules | Turborepo, Nx | Simplest for solo/small team. Module boundaries enforced by folder structure. Can extract later. |
| Testing | Vitest + React Testing Library + Playwright | Jest, Cypress | Vitest already in dependencies. Fast, Vite-native. Playwright for E2E. |
| Package manager | pnpm | npm, yarn | Already in use (lockfile present). Fast, disk-efficient. |
| AI API Key Management | BYOK (Bring Your Own Key) | Platform-managed keys, fixed quota | Zero AI infrastructure cost. Users control their own billing. Key encrypted at rest with AES-256-GCM. |

---

## 3. Data Model

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector", schema: "public")]
}

// ============================================================
// AUTH & USER
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  provider      String    @default("email") // email | google
  passwordHash  String?   // null for OAuth users
  timezone      String    @default("UTC")
  preferences   Json      @default("{}")
  createdAt     DateTime  @default(now())
  lastActiveAt  DateTime  @default(now())

  // Relations
  notes         Note[]
  books         Book[]
  tasks         Task[]
  decks         Deck[]
  flashcards    Flashcard[]
  dayPlans      DayPlan[]
  dailyReviews  DailyReview[]
  goals         Goal[]
  habits        Habit[]
  insights      Insight[]
  sessions      UserSession[]
  reviewSessions ReviewSession[]

  @@map("users")
}

model UserSession {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

// ============================================================
// NOTES MODULE
// ============================================================

model Note {
  id          String    @id @default(cuid())
  userId      String
  title       String    @default("")
  contentMd   String    @default("") @db.Text
  tags        String[]  @default([])
  isPinned    Boolean   @default(false)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  wordCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Phase 2: embedding  Unsupported("vector(1536)")?

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteLinks   NoteLink[] @relation("SourceNote")
  linkedFrom  NoteLink[] @relation("TargetNote")

  @@index([userId, isDeleted])
  @@index([userId, isPinned])
  @@index([tags], type: Gin)
  @@map("notes")
}

model NoteLink {
  id         String   @id @default(cuid())
  sourceId   String
  targetType String   // note | task | book | deck
  targetId   String
  createdAt  DateTime @default(now())

  sourceNote Note  @relation("SourceNote", fields: [sourceId], references: [id], onDelete: Cascade)
  targetNote Note? @relation("TargetNote", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetType, targetId])
  @@map("note_links")
}

// ============================================================
// BOOKS MODULE
// ============================================================

model Book {
  id            String    @id @default(cuid())
  userId        String
  title         String
  author        String?
  coverUrl      String?
  genre         String[]  @default([])
  status        String    @default("want_to_read") // want_to_read | reading | completed
  rating        Int?      // 1-5
  summaryMd     String    @default("") @db.Text
  keyIdeas      Json      @default("[]") // [{text: string, order: number}]
  quotes        Json      @default("[]") // [{text: string, page?: number}]
  learningsMd   String    @default("") @db.Text
  applicationMd String    @default("") @db.Text
  pagesTotal    Int?
  pagesRead     Int       @default(0)
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Phase 2: embedding  Unsupported("vector(1536)")?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("books")
}

// ============================================================
// TASKS MODULE
// ============================================================

model Task {
  id            String    @id @default(cuid())
  userId        String
  parentTaskId  String?
  goalId        String?
  title         String
  descriptionMd String    @default("") @db.Text
  priority      String    @default("medium") // critical | high | medium | low
  status        String    @default("pending") // pending | in_progress | completed | cancelled
  tags          String[]  @default([])
  dueDate       DateTime? @db.Date
  completedAt   DateTime?
  isRecurring   Boolean   @default(false)
  rrule         String?
  quadrant      String?   // urgent_important | not_urgent_important | urgent_not_important | not_urgent_not_important
  orderIndex    Float     @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentTask Task?   @relation("Subtasks", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subtasks   Task[]  @relation("Subtasks")
  goal       Goal?   @relation(fields: [goalId], references: [id], onDelete: SetNull)
  taskLinks  TaskLink[]

  @@index([userId, status])
  @@index([userId, dueDate])
  @@index([userId, quadrant])
  @@index([parentTaskId])
  @@map("tasks")
}

model TaskLink {
  taskId     String
  linkedType String // note | book
  linkedId   String

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@id([taskId, linkedType, linkedId])
  @@map("task_links")
}

// ============================================================
// DAILY PLANNER MODULE
// ============================================================

model DayPlan {
  id           String   @id @default(cuid())
  userId       String
  planDate     DateTime @db.Date
  focusTaskIds String[] @default([])
  timeBlocks   Json     @default("[]") // [{taskId, startTime, endTime, order}]
  aiBriefMd    String?  @db.Text
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, planDate])
  @@map("day_plans")
}

// ============================================================
// FLASHCARDS MODULE
// ============================================================

model Deck {
  id            String   @id @default(cuid())
  userId        String
  name          String
  descriptionMd String   @default("") @db.Text
  tags          String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user       User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  flashcards Flashcard[]
  reviews    ReviewSession[]

  @@index([userId])
  @@map("decks")
}

model Flashcard {
  id            String    @id @default(cuid())
  deckId        String
  userId        String
  cardType      String    // qa | cloze | definition | reflection | application
  frontMd       String    @db.Text
  backMd        String    @db.Text
  tags          String[]  @default([])
  sourceType    String?   // note | book | manual | custom
  sourceId      String?
  sourceExcerpt String?   @db.Text
  // SM-2 spaced repetition fields
  state         String    @default("new") // new | learning | review | mastered
  easeFactor    Float     @default(2.5)
  interval      Int       @default(0) // days until next review
  nextReviewAt  DateTime  @default(now()) @db.Date
  reviewCount   Int       @default(0)
  lastRating    String?   // easy | medium | hard | forgot
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  deck Deck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([deckId])
  @@index([userId, nextReviewAt])
  @@index([userId, state])
  @@map("flashcards")
}

model ReviewSession {
  id            String    @id @default(cuid())
  userId        String
  deckId        String?
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  cardsReviewed Int       @default(0)
  cardsEasy     Int       @default(0)
  cardsMedium   Int       @default(0)
  cardsHard     Int       @default(0)
  cardsForgot   Int       @default(0)

  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  deck Deck? @relation(fields: [deckId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@map("review_sessions")
}

// ============================================================
// REVIEWS MODULE
// ============================================================

model DailyReview {
  id             String   @id @default(cuid())
  userId         String
  reviewDate     DateTime @db.Date
  tasksCompleted Int      @default(0)
  tasksMissed    Int      @default(0)
  notesCreated   Int      @default(0)
  cardsReviewed  Int      @default(0)
  reflectionMd   String   @default("") @db.Text
  aiSummaryMd    String?  @db.Text
  mood           String?  // great | good | okay | bad
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewDate])
  @@map("daily_reviews")
}

// ============================================================
// GOALS & HABITS MODULE
// ============================================================

model Goal {
  id          String    @id @default(cuid())
  userId      String
  title       String
  description String    @default("") @db.Text
  category    String?   // fitness | learning | work | personal
  targetDate  DateTime? @db.Date
  status      String    @default("active") // active | completed | paused
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks  Task[]
  habits Habit[]

  @@index([userId, status])
  @@map("goals")
}

model Habit {
  id        String   @id @default(cuid())
  userId    String
  goalId    String?
  title     String
  frequency String   // daily | weekdays | weekly
  createdAt DateTime @default(now())

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal Goal?     @relation(fields: [goalId], references: [id], onDelete: SetNull)
  logs HabitLog[]

  @@index([userId])
  @@map("habits")
}

model HabitLog {
  id        String   @id @default(cuid())
  habitId   String
  logDate   DateTime @db.Date
  completed Boolean  @default(false)

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, logDate])
  @@map("habit_logs")
}

// ============================================================
// INSIGHT ENGINE (Phase 2/3, schema defined now)
// ============================================================

model Insight {
  id            String    @id @default(cuid())
  userId        String
  insightType   String    // procrastination | workload | priority | streak | gap | time | topic
  contentMd     String    @db.Text
  severity      String?   // info | warning | positive
  relatedEntity String?   // task | note | book | flashcard
  relatedIds    String[]  @default([])
  isDismissed   Boolean   @default(false)
  generatedAt   DateTime  @default(now())
  validUntil    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isDismissed])
  @@map("insights")
}

// ============================================================
// AI PROMPT TEMPLATES (Phase 2, schema defined now)
// ============================================================

model PromptTemplate {
  id           String  @id @default(cuid())
  module       String  // notes | books | flashcards | insights | coach
  action       String  // summarize | generate_cards | prioritize | ...
  version      Int     @default(1)
  model        String  // gpt-4o | gpt-4o-mini
  systemPrompt String  @db.Text
  userPrompt   String  @db.Text // uses {{variables}} for interpolation
  maxTokens    Int     @default(1024)
  temperature  Float   @default(0.7)
  isActive     Boolean @default(true)

  @@unique([module, action, version])
  @@map("prompt_templates")
}
```

### 3.2 Database Migrations Strategy

- Initial migration creates all Phase 1 tables (User, Note, NoteLink, Book, Task, TaskLink, DayPlan, Deck, Flashcard, ReviewSession, DailyReview)
- Goal, Habit, HabitLog tables are included in initial migration but not exposed in UI until Phase 3
- Insight and PromptTemplate tables included but empty until Phase 2
- pgvector extension enabled in migration but vector columns added in Phase 2 migration
- Full-text search indexes added via raw SQL migration (`CREATE INDEX ... USING gin(to_tsvector(...))`)

---

## 4. API Design

All API endpoints live under `src/app/api/`. Authentication is required for all endpoints (enforced by middleware). Responses follow a consistent envelope format.

### 4.1 Shared TypeScript Interfaces

```typescript
// src/lib/types/api.ts

// Standard API response envelope
interface ApiResponse<T> {
  data: T;
  error: null;
}

interface ApiError {
  data: null;
  error: {
    code: string;      // machine-readable: "NOT_FOUND", "VALIDATION_ERROR"
    message: string;   // human-readable
    details?: Record<string, string[]>; // field-level validation errors
  };
}

// Pagination
interface PaginationParams {
  page?: number;    // default 1
  limit?: number;   // default 20, max 100
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error: null;
}

// Sort
interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### 4.2 Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register with email/password |
| POST | `/api/auth/login` | No | Login, returns JWT tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Invalidate refresh token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/me` | Yes | Update user profile/preferences |
| `NextAuth` | `/api/auth/[...nextauth]` | -- | Google OAuth flow handled by NextAuth |

```typescript
// src/lib/types/auth.ts

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;  // JWT, 15 min expiry
  refreshToken: string; // opaque, 30 day expiry
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
}

interface UserPreferences {
  theme?: "light" | "dark" | "system";
  defaultNoteView?: "split" | "preview";
  dailyReviewTime?: string; // HH:mm
  weekStartsOn?: 0 | 1;    // 0=Sunday, 1=Monday
}
```

### 4.3 Notes Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notes` | Yes | List notes (paginated, filterable) |
| POST | `/api/notes` | Yes | Create note |
| GET | `/api/notes/:id` | Yes | Get note with links |
| PUT | `/api/notes/:id` | Yes | Update note (auto-save target) |
| DELETE | `/api/notes/:id` | Yes | Soft delete |
| POST | `/api/notes/:id/restore` | Yes | Restore soft-deleted note |
| GET | `/api/notes/trash` | Yes | List soft-deleted notes |
| GET | `/api/notes/tags` | Yes | List all unique tags |
| GET | `/api/notes/search` | Yes | Full-text search |

```typescript
// src/lib/types/notes.ts

interface CreateNoteRequest {
  title?: string;
  contentMd?: string;
  tags?: string[];
  isPinned?: boolean;
}

interface UpdateNoteRequest {
  title?: string;
  contentMd?: string;
  tags?: string[];
  isPinned?: boolean;
}

interface NoteListParams extends PaginationParams, SortParams {
  tags?: string[];        // filter: notes containing ALL these tags
  isPinned?: boolean;
  search?: string;        // full-text search query
}

interface NoteResponse {
  id: string;
  title: string;
  contentMd: string;
  tags: string[];
  isPinned: boolean;
  isDeleted: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  links?: NoteLinkResponse[];
}

interface NoteLinkResponse {
  id: string;
  targetType: "note" | "task" | "book" | "deck";
  targetId: string;
  targetTitle: string;  // resolved title of linked entity
}
```

### 4.4 Tasks Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | Yes | List tasks (filterable by status, priority, quadrant, due date) |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/:id` | Yes | Get task with subtasks and links |
| PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Hard delete task |
| POST | `/api/tasks/:id/complete` | Yes | Mark task completed |
| POST | `/api/tasks/reorder` | Yes | Batch update orderIndex for drag-and-drop |
| GET | `/api/tasks/today` | Yes | Tasks due today + overdue |

```typescript
// src/lib/types/tasks.ts

type TaskPriority = "critical" | "high" | "medium" | "low";
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
type TaskQuadrant =
  | "urgent_important"
  | "not_urgent_important"
  | "urgent_not_important"
  | "not_urgent_not_important";

interface CreateTaskRequest {
  title: string;
  descriptionMd?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  dueDate?: string;        // ISO date YYYY-MM-DD
  parentTaskId?: string;
  goalId?: string;
  quadrant?: TaskQuadrant;
  isRecurring?: boolean;
  rrule?: string;
}

interface UpdateTaskRequest {
  title?: string;
  descriptionMd?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  dueDate?: string | null;
  quadrant?: TaskQuadrant;
  orderIndex?: number;
}

interface TaskListParams extends PaginationParams, SortParams {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  quadrant?: TaskQuadrant;
  tags?: string[];
  dueBefore?: string;       // ISO date
  dueAfter?: string;        // ISO date
  parentTaskId?: string | null; // null = top-level only
  goalId?: string;
}

interface ReorderRequest {
  items: { id: string; orderIndex: number }[];
}

interface TaskResponse {
  id: string;
  title: string;
  descriptionMd: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  dueDate: string | null;
  completedAt: string | null;
  isRecurring: boolean;
  rrule: string | null;
  quadrant: string | null;
  orderIndex: number;
  parentTaskId: string | null;
  goalId: string | null;
  subtasks?: TaskResponse[];
  createdAt: string;
  updatedAt: string;
}
```

### 4.5 Books Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books` | Yes | List books (filter by status, genre) |
| POST | `/api/books` | Yes | Create book |
| GET | `/api/books/:id` | Yes | Get book details |
| PUT | `/api/books/:id` | Yes | Update book |
| DELETE | `/api/books/:id` | Yes | Delete book |

```typescript
// src/lib/types/books.ts

type BookStatus = "want_to_read" | "reading" | "completed";

interface CreateBookRequest {
  title: string;
  author?: string;
  coverUrl?: string;
  genre?: string[];
  status?: BookStatus;
  pagesTotal?: number;
}

interface UpdateBookRequest {
  title?: string;
  author?: string;
  coverUrl?: string;
  genre?: string[];
  status?: BookStatus;
  rating?: number;         // 1-5
  summaryMd?: string;
  keyIdeas?: { text: string; order: number }[];
  quotes?: { text: string; page?: number }[];
  learningsMd?: string;
  applicationMd?: string;
  pagesTotal?: number;
  pagesRead?: number;
  completedAt?: string;
}

interface BookListParams extends PaginationParams, SortParams {
  status?: BookStatus;
  genre?: string[];
}

interface BookResponse {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  genre: string[];
  status: BookStatus;
  rating: number | null;
  summaryMd: string;
  keyIdeas: { text: string; order: number }[];
  quotes: { text: string; page?: number }[];
  learningsMd: string;
  applicationMd: string;
  pagesTotal: number | null;
  pagesRead: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 4.6 Flashcards Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/decks` | Yes | List decks with card counts |
| POST | `/api/decks` | Yes | Create deck |
| GET | `/api/decks/:id` | Yes | Get deck with cards |
| PUT | `/api/decks/:id` | Yes | Update deck metadata |
| DELETE | `/api/decks/:id` | Yes | Delete deck and all cards |
| POST | `/api/decks/:id/cards` | Yes | Add card to deck |
| PUT | `/api/cards/:id` | Yes | Update card content |
| DELETE | `/api/cards/:id` | Yes | Delete card |
| GET | `/api/review/due` | Yes | Get cards due for review today |
| POST | `/api/review/start` | Yes | Start a review session |
| POST | `/api/review/:sessionId/rate` | Yes | Submit rating for a card in session |
| POST | `/api/review/:sessionId/complete` | Yes | Complete a review session |

```typescript
// src/lib/types/flashcards.ts

type CardType = "qa" | "cloze" | "definition" | "reflection" | "application";
type CardState = "new" | "learning" | "review" | "mastered";
type CardRating = "easy" | "medium" | "hard" | "forgot";

interface CreateDeckRequest {
  name: string;
  descriptionMd?: string;
  tags?: string[];
}

interface CreateCardRequest {
  cardType: CardType;
  frontMd: string;
  backMd: string;
  tags?: string[];
  sourceType?: string;
  sourceId?: string;
  sourceExcerpt?: string;
}

interface UpdateCardRequest {
  frontMd?: string;
  backMd?: string;
  tags?: string[];
  cardType?: CardType;
}

interface RateCardRequest {
  cardId: string;
  rating: CardRating;
}

interface DeckResponse {
  id: string;
  name: string;
  descriptionMd: string;
  tags: string[];
  cardCount: number;
  dueCount: number;       // cards due today
  newCount: number;        // cards never reviewed
  createdAt: string;
  updatedAt: string;
}

interface FlashcardResponse {
  id: string;
  deckId: string;
  cardType: CardType;
  frontMd: string;
  backMd: string;
  tags: string[];
  state: CardState;
  nextReviewAt: string;
  reviewCount: number;
  lastRating: CardRating | null;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
}

interface ReviewSessionResponse {
  id: string;
  deckId: string | null;
  cards: FlashcardResponse[];
  startedAt: string;
  cardsReviewed: number;
  cardsTotal: number;
}

interface ReviewDueResponse {
  totalDue: number;
  byDeck: { deckId: string; deckName: string; dueCount: number }[];
}
```

### 4.7 Daily Planner Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/planner/today` | Yes | Get or create today's plan |
| PUT | `/api/planner/:date` | Yes | Update plan for a date |
| GET | `/api/planner/:date` | Yes | Get plan for specific date |

```typescript
// src/lib/types/planner.ts

interface DayPlanResponse {
  id: string;
  planDate: string;
  focusTasks: TaskResponse[];        // resolved task objects
  timeBlocks: TimeBlock[];
  aiBriefMd: string | null;
  todayTasks: TaskResponse[];        // all tasks due today
  overdueTasks: TaskResponse[];      // carried forward
  completedToday: number;
  totalToday: number;
}

interface TimeBlock {
  taskId: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  order: number;
}

interface UpdateDayPlanRequest {
  focusTaskIds?: string[];
  timeBlocks?: TimeBlock[];
}
```

### 4.8 Reviews Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/daily/:date` | Yes | Get daily review for date |
| PUT | `/api/reviews/daily/:date` | Yes | Create/update daily review |
| GET | `/api/reviews/weekly/:weekStart` | Yes | Get weekly review data |

```typescript
// src/lib/types/reviews.ts

type Mood = "great" | "good" | "okay" | "bad";

interface DailyReviewResponse {
  id: string;
  reviewDate: string;
  tasksCompleted: number;
  tasksMissed: number;
  notesCreated: number;
  cardsReviewed: number;
  reflectionMd: string;
  aiSummaryMd: string | null;
  mood: Mood | null;
}

interface UpdateDailyReviewRequest {
  reflectionMd?: string;
  mood?: Mood;
}

interface WeeklyReviewResponse {
  weekStart: string;
  weekEnd: string;
  dailyReviews: DailyReviewResponse[];
  totals: {
    tasksCompleted: number;
    tasksMissed: number;
    notesCreated: number;
    cardsReviewed: number;
    completionRate: number; // 0-100
  };
}
```

### 4.9 Global Search Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search` | Yes | Search across all entity types |

```typescript
// src/lib/types/search.ts

type SearchEntityType = "note" | "task" | "book" | "flashcard";

interface SearchParams {
  q: string;                        // search query
  types?: SearchEntityType[];       // filter by entity type
  tags?: string[];
  limit?: number;                   // default 20
}

interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  preview: string;                  // first 200 chars of content
  tags: string[];
  matchScore: number;               // relevance score
  updatedAt: string;
}

interface SearchResponse {
  data: SearchResult[];
  query: string;
  total: number;
}
```

### 4.10 Goals & Habits Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/goals` | Yes | List goals |
| POST | `/api/goals` | Yes | Create goal |
| GET | `/api/goals/:id` | Yes | Get goal with linked tasks and progress |
| PUT | `/api/goals/:id` | Yes | Update goal |
| DELETE | `/api/goals/:id` | Yes | Delete goal |
| GET | `/api/habits` | Yes | List habits with streaks |
| POST | `/api/habits` | Yes | Create habit |
| PUT | `/api/habits/:id` | Yes | Update habit |
| DELETE | `/api/habits/:id` | Yes | Delete habit |
| POST | `/api/habits/:id/log` | Yes | Log habit completion for today |
| GET | `/api/habits/:id/logs` | Yes | Get habit log history |

---

## 5. Component Tree

### 5.1 Application Shell

```
RootLayout (src/app/layout.tsx)
├── Providers (src/components/providers.tsx)
│   ├── QueryClientProvider (TanStack)
│   ├── SessionProvider (NextAuth)
│   └── ThemeProvider
├── AppShell (src/components/layout/app-shell.tsx)
│   ├── Sidebar (src/components/layout/sidebar.tsx)
│   │   ├── SidebarLogo
│   │   ├── SidebarNav
│   │   │   ├── NavItem (Notes)
│   │   │   ├── NavItem (Tasks)
│   │   │   ├── NavItem (Books)
│   │   │   ├── NavItem (Flashcards)
│   │   │   ├── NavItem (Planner)
│   │   │   ├── NavItem (Reviews)
│   │   │   ├── NavItem (Goals)
│   │   │   └── NavItem (Search)
│   │   ├── SidebarQuickCapture
│   │   └── SidebarUserMenu
│   ├── TopBar (src/components/layout/top-bar.tsx)
│   │   ├── Breadcrumbs
│   │   ├── GlobalSearch (Cmd+K trigger)
│   │   └── UserAvatar
│   └── MainContent (children)
└── QuickCaptureModal (src/components/quick-capture/modal.tsx)
    ├── QuickCaptureInput
    └── QuickCaptureTypeSelector
```

### 5.2 Notes Module

```
NotesPage (src/app/(dashboard)/notes/page.tsx)
├── NotesHeader
│   ├── SearchInput
│   ├── TagFilter (multi-select)
│   ├── SortDropdown
│   └── CreateNoteButton
├── NotesList (src/components/notes/notes-list.tsx)
│   └── NoteCard (src/components/notes/note-card.tsx)
│       ├── NoteTitle
│       ├── NotePreview (truncated)
│       ├── NoteTags
│       ├── PinIndicator
│       └── NoteTimestamp
└── EmptyState

NoteDetailPage (src/app/(dashboard)/notes/[id]/page.tsx)
├── NoteDetailHeader
│   ├── BackButton
│   ├── NoteTitle (editable)
│   ├── TagEditor (src/components/shared/tag-editor.tsx)
│   ├── PinToggle
│   ├── LinkButton
│   └── DeleteButton
├── MarkdownEditor (src/components/editor/markdown-editor.tsx)
│   ├── EditorToolbar
│   │   ├── FormatButtons (bold, italic, heading, list, code, link, table)
│   │   └── ViewModeToggle (split | preview | edit)
│   ├── CodeMirrorEditor (src/components/editor/codemirror-editor.tsx)
│   └── MarkdownPreview (src/components/editor/markdown-preview.tsx)
│       ├── react-markdown
│       ├── MermaidDiagram (src/components/editor/mermaid-diagram.tsx)
│       └── WikiLink (src/components/editor/wiki-link.tsx)
└── NoteLinksPanel (src/components/notes/note-links-panel.tsx)
    └── LinkedEntityCard

NotesTrashPage (src/app/(dashboard)/notes/trash/page.tsx)
├── TrashHeader
└── TrashNotesList
    └── TrashNoteCard (with restore/permanent delete)
```

### 5.3 Tasks Module

```
TasksPage (src/app/(dashboard)/tasks/page.tsx)
├── TasksHeader
│   ├── ViewToggle (list | eisenhower)
│   ├── FilterBar
│   │   ├── StatusFilter
│   │   ├── PriorityFilter
│   │   └── TagFilter
│   └── CreateTaskButton
├── TaskListView (src/components/tasks/task-list-view.tsx)
│   └── TaskRow (src/components/tasks/task-row.tsx)
│       ├── CompletionCheckbox
│       ├── TaskTitle
│       ├── PriorityBadge
│       ├── DueDateBadge
│       ├── TagChips
│       └── SubtaskProgress (2/5)
├── EisenhowerView (src/components/tasks/eisenhower-view.tsx)
│   ├── Quadrant (urgent_important)
│   │   └── TaskCard (draggable)
│   ├── Quadrant (not_urgent_important)
│   ├── Quadrant (urgent_not_important)
│   └── Quadrant (not_urgent_not_important)
└── EmptyState

TaskDetailSheet (src/components/tasks/task-detail-sheet.tsx)  -- slide-over panel
├── TaskTitleInput
├── TaskDescriptionEditor (MarkdownEditor, compact)
├── TaskMetadata
│   ├── PrioritySelect
│   ├── StatusSelect
│   ├── DueDatePicker
│   ├── QuadrantSelect
│   └── GoalSelect
├── SubtaskList (src/components/tasks/subtask-list.tsx)
│   └── SubtaskRow (inline editable)
├── TagEditor
└── TaskLinks
```

### 5.4 Books Module

```
BooksPage (src/app/(dashboard)/books/page.tsx)
├── BooksHeader
│   ├── StatusTabs (All | Want to Read | Reading | Completed)
│   └── AddBookButton
├── BookGrid (src/components/books/book-grid.tsx)
│   └── BookCard (src/components/books/book-card.tsx)
│       ├── BookCover (image or placeholder)
│       ├── BookTitle
│       ├── BookAuthor
│       ├── StatusBadge
│       ├── RatingStars
│       └── ProgressBar (pages)
└── EmptyState

BookDetailPage (src/app/(dashboard)/books/[id]/page.tsx)
├── BookDetailHeader
│   ├── BookCover
│   ├── BookMeta (title, author, genre, status, rating)
│   ├── ProgressTracker (pages read / total)
│   └── ActionButtons (edit, delete)
├── BookTabs
│   ├── Tab: Summary (MarkdownEditor)
│   ├── Tab: Key Ideas (OrderableList)
│   │   └── KeyIdeaItem (draggable, editable)
│   ├── Tab: Quotes (QuotesList)
│   │   └── QuoteCard (text + page number)
│   ├── Tab: Learnings (MarkdownEditor)
│   └── Tab: Application (MarkdownEditor)
└── BookLinksPanel
```

### 5.5 Flashcards Module

```
FlashcardsPage (src/app/(dashboard)/flashcards/page.tsx)
├── FlashcardsHeader
│   ├── ReviewDueBanner ("12 cards due today" + Start Review button)
│   └── CreateDeckButton
├── DeckGrid (src/components/flashcards/deck-grid.tsx)
│   └── DeckCard (src/components/flashcards/deck-card.tsx)
│       ├── DeckName
│       ├── DeckTags
│       ├── CardCountBadge
│       ├── DueCountBadge
│       └── LastReviewedDate
└── EmptyState

DeckDetailPage (src/app/(dashboard)/flashcards/[deckId]/page.tsx)
├── DeckDetailHeader
│   ├── DeckTitle (editable)
│   ├── DeckDescription
│   ├── StartReviewButton
│   └── AddCardButton
├── CardList (src/components/flashcards/card-list.tsx)
│   └── CardPreview (src/components/flashcards/card-preview.tsx)
│       ├── CardFront (truncated)
│       ├── CardType badge
│       ├── CardState badge
│       └── EditButton
└── CardEditorSheet (src/components/flashcards/card-editor-sheet.tsx)
    ├── CardTypeSelector
    ├── FrontEditor (MarkdownEditor, compact)
    ├── BackEditor (MarkdownEditor, compact)
    └── SourceLink

ReviewPage (src/app/(dashboard)/flashcards/review/page.tsx)
├── ReviewProgress (3 / 12 cards)
├── FlashcardDisplay (src/components/flashcards/flashcard-display.tsx)
│   ├── CardFront (MarkdownPreview)
│   ├── RevealButton
│   └── CardBack (MarkdownPreview, revealed)
├── RatingButtons (Easy | Medium | Hard | Forgot)
└── ReviewComplete (src/components/flashcards/review-complete.tsx)
    ├── SessionStats (easy, medium, hard, forgot counts)
    └── ReturnToDeckButton
```

### 5.6 Daily Planner Module

```
PlannerPage (src/app/(dashboard)/planner/page.tsx)
├── PlannerHeader
│   ├── DateDisplay ("Today, April 1")
│   ├── DateNavigation (prev/next day)
│   └── ProgressIndicator (4/7 tasks done)
├── FocusSection (src/components/planner/focus-section.tsx)
│   ├── FocusSectionTitle ("Top 3 Focus")
│   └── FocusTaskSlot (x3, droppable)
│       └── TaskCard (or empty placeholder)
├── TodayTasksList (src/components/planner/today-tasks.tsx)
│   ├── SectionLabel ("Due Today")
│   ├── TaskRow[] (completable inline)
│   ├── SectionLabel ("Overdue")
│   └── TaskRow[] (highlighted red)
└── TimeBlockView (src/components/planner/time-block-view.tsx) -- optional
    └── TimeSlot (draggable tasks into hours)
```

### 5.7 Reviews Module

```
ReviewsPage (src/app/(dashboard)/reviews/page.tsx)
├── ReviewsTabs (Daily | Weekly)
├── DailyReviewView (src/components/reviews/daily-review.tsx)
│   ├── DateSelector
│   ├── MetricCards
│   │   ├── MetricCard (Tasks Completed)
│   │   ├── MetricCard (Tasks Missed)
│   │   ├── MetricCard (Notes Created)
│   │   └── MetricCard (Cards Reviewed)
│   ├── MoodSelector (great | good | okay | bad)
│   └── ReflectionEditor (MarkdownEditor, compact)
└── WeeklyReviewView (src/components/reviews/weekly-review.tsx)
    ├── WeekSelector
    ├── WeeklyMetricsSummary
    ├── DailyBreakdownChart
    └── CompletionRateChart
```

### 5.8 Global Search Module

```
GlobalSearchModal (src/components/search/global-search-modal.tsx)
├── SearchInput (with Cmd+K shortcut)
├── TypeFilter (Notes | Tasks | Books | Flashcards)
├── SearchResults (src/components/search/search-results.tsx)
│   └── SearchResultItem (src/components/search/search-result-item.tsx)
│       ├── EntityTypeIcon
│       ├── ResultTitle (highlighted match)
│       ├── ResultPreview (highlighted match)
│       ├── ResultTags
│       └── ResultTimestamp
└── EmptySearchState ("Start typing to search...")
```

### 5.9 Shared Components

```
src/components/shared/
├── tag-editor.tsx          (autocomplete multi-tag input)
├── markdown-editor.tsx     (reusable editor, used by notes, tasks, books, reviews)
├── markdown-preview.tsx    (reusable renderer)
├── confirmation-dialog.tsx (delete confirmations)
├── empty-state.tsx         (configurable empty state)
├── loading-skeleton.tsx    (shimmer loading)
├── error-boundary.tsx      (error fallback UI)
├── date-picker.tsx         (shadcn date picker wrapper)
├── priority-badge.tsx      (color-coded priority)
├── status-badge.tsx        (color-coded status)
└── rating-stars.tsx        (1-5 star input/display)
```

---

## 6. Task Breakdown

Tasks are ordered by dependency. Each task is assigned to a role: `backend-dev`, `frontend-dev`, `fullstack`, or `qa-engineer`.

### 6.0 Parallel Execution Plan & Dependency Graph

The following waves define which tasks can be executed **in parallel** by multiple agents. All tasks within a wave are independent of each other and can run concurrently. A wave cannot start until all tasks in the previous wave are complete (unless noted otherwise).

```
WAVE 1 — Foundation (Sequential, no parallelism)
┌──────────────────────────────────────────────┐
│  Task 1: Project Scaffolding                 │
│      ↓                                       │
│  Task 2: Database Schema & Migrations        │
│      ↓                                       │
│  Task 3: Authentication API                  │
└──────────────────────────────────────────────┘

WAVE 2 — Shell + All Module APIs (4 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 4: Auth UI          ──┐               │
│  Task 7: Notes API         ─┤ All depend    │
│  Task 9: Tasks API         ─┤ only on       │
│  Task 11: Books API        ─┤ Task 3        │
│  Task 13: Flashcards API   ─┤               │
│  Task 22: Goals & Habits API┘               │
└──────────────────────────────────────────────┘

WAVE 3 — App Shell + Markdown Editor (Sequential gate)
┌──────────────────────────────────────────────┐
│  Task 4 complete → Task 5: App Shell         │
│  Task 5 complete → Task 6: Markdown Editor   │
└──────────────────────────────────────────────┘
Note: Wave 2 backend APIs and Wave 3 can overlap —
backend agents continue API work while frontend
agents build shell + editor.

WAVE 4 — All Module Frontends (4 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 8:  Notes Frontend      (needs 6, 7)  │
│  Task 10: Tasks Frontend      (needs 6, 9)  │
│  Task 12: Books Frontend      (needs 6, 11) │
│  Task 14: Flashcards Frontend (needs 6, 13) │
│  Task 23: Goals & Habits UI   (needs 22)    │
└──────────────────────────────────────────────┘

WAVE 5 — Dependent Modules (2-3 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 15: Daily Planner API   (needs 9)     │
│  Task 17: Reviews API         (needs 7,9,13)│
│  Task 19: Global Search API   (needs 7,9,   │
│                                11,13)        │
│  Task 24: Analytics Dashboard (needs 7,9,   │
│                                13,22)        │
└──────────────────────────────────────────────┘

WAVE 6 — Dependent Frontends (3 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 16: Daily Planner UI    (needs 10,15) │
│  Task 18: Reviews Frontend    (needs 6, 17) │
│  Task 20: Global Search UI    (needs 19)    │
└──────────────────────────────────────────────┘

WAVE 7 — Integration & Cross-Cutting (2 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 21: Quick Capture       (needs 7,9,20)│
│  Task 25: Cross-Module Linking(needs 8,10,  │
│                                12,14)        │
└──────────────────────────────────────────────┘

WAVE 8 — Polish & Testing (2 agents in parallel)
┌──────────────────────────────────────────────┐
│  Task 26: Error Handling & Polish            │
│  Task 28: Unit & Integration Tests           │
│      ↓ (both complete)                       │
│  Task 27: End-to-End Tests                   │
└──────────────────────────────────────────────┘
```

#### Critical Path (longest sequential chain)
```
Task 1 → 2 → 3 → 4 → 5 → 6 → 8 → 25 → 26 → 27
(Scaffolding → DB → Auth API → Auth UI → Shell → Editor → Notes UI → Linking → Polish → E2E)
```

#### Parallelism Summary

| Wave | Tasks | Max Parallel Agents | Bottleneck |
|------|-------|-------------------|------------|
| 1 | 1, 2, 3 | 1 (sequential) | Foundation must be serial |
| 2 | 4, 7, 9, 11, 13, 22 | **6** | All APIs are independent after auth |
| 3 | 5, 6 | 1 (sequential) | Frontend gate — editor blocks all UI |
| 4 | 8, 10, 12, 14, 23 | **5** | All module UIs are independent |
| 5 | 15, 17, 19, 24 | **4** | Dependent APIs can parallelize |
| 6 | 16, 18, 20 | **3** | Dependent UIs |
| 7 | 21, 25 | **2** | Cross-cutting integration |
| 8 | 26, 27, 28 | **2** then 1 | E2E tests must be last |

#### Key Scheduling Notes
- **Waves 2 and 3 overlap**: Backend agents work on APIs (Wave 2) while frontend agents build Shell + Editor (Wave 3). This means the 6 API tasks and 2 shell tasks can run simultaneously across agents.
- **The Markdown Editor (Task 6) is the frontend bottleneck** — all module UIs depend on it. Prioritize this.
- **Backend agents become free after Wave 2** — they can start Wave 5 APIs as soon as their Wave 2 API + the required dependency APIs are done (e.g., Task 15 only needs Task 9, not all of Wave 2).
- **QA agents** should begin writing test plans during Waves 4-6, then execute in Wave 8.

---

### Task 1: Project Scaffolding & Configuration --> fullstack
- **Description**: Initialize the Next.js 14 project with App Router, configure TypeScript, Tailwind CSS, shadcn/ui, Prisma, and the development environment. Set up the folder structure that all subsequent tasks build on.
- **Files**:
  - `src/app/layout.tsx` -- root layout
  - `src/app/page.tsx` -- landing/redirect
  - `src/lib/prisma.ts` -- Prisma client singleton
  - `src/lib/types/api.ts` -- shared API types (ApiResponse, ApiError, PaginatedResponse)
  - `src/lib/types/auth.ts` -- auth types
  - `src/lib/types/notes.ts` -- note types
  - `src/lib/types/tasks.ts` -- task types
  - `src/lib/types/books.ts` -- book types
  - `src/lib/types/flashcards.ts` -- flashcard types
  - `src/lib/types/planner.ts` -- planner types
  - `src/lib/types/reviews.ts` -- review types
  - `src/lib/types/search.ts` -- search types
  - `src/lib/utils.ts` -- cn() utility, date helpers
  - `prisma/schema.prisma` -- full schema from Section 3
  - `tailwind.config.ts`
  - `tsconfig.json`
  - `.env.example`
  - `next.config.js`
  - `vitest.config.ts`
- **Depends on**: Nothing
- **Acceptance criteria**:
  - `pnpm dev` starts the app without errors
  - `pnpm prisma generate` produces the Prisma client
  - `pnpm prisma migrate dev` creates all tables in a local PostgreSQL
  - All shared TypeScript types compile without errors
  - shadcn/ui components can be imported (button, input, dialog installed)
  - Tailwind classes apply correctly
  - Vitest runs with a passing placeholder test

---

### Task 2: Database Schema & Migrations --> backend-dev
- **Description**: Write the Prisma schema (Section 3.1) and create the initial migration. Add full-text search indexes via raw SQL migration for notes, tasks, and books.
- **Files**:
  - `prisma/schema.prisma` (finalized)
  - `prisma/migrations/00001_initial/migration.sql` (auto-generated)
  - `prisma/migrations/00002_fulltext_indexes/migration.sql` (manual)
  - `src/lib/prisma.ts`
- **Depends on**: Task 1
- **Acceptance criteria**:
  - All models from Section 3 exist in PostgreSQL after migration
  - Full-text search GIN indexes exist on: `notes(title, content_md)`, `tasks(title, description_md)`, `books(title, author, summary_md)`
  - `@@unique` constraints enforced (e.g., `[userId, planDate]` on DayPlan)
  - Foreign key cascades work correctly (deleting a deck deletes its cards)
  - Prisma Client generates with all typed methods

---

### Task 3: Authentication System --> backend-dev
- **Description**: Implement NextAuth.js v5 with email/password credentials provider and Google OAuth. Add JWT access/refresh token flow. Create auth middleware for protected API routes.
- **Files**:
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/api/auth/register/route.ts`
  - `src/lib/auth/options.ts` -- NextAuth config
  - `src/lib/auth/middleware.ts` -- `getAuthUser(request)` helper
  - `src/lib/auth/password.ts` -- bcrypt hash/compare
  - `src/lib/auth/session.ts` -- JWT token helpers
  - `src/middleware.ts` -- Next.js middleware for route protection
- **Depends on**: Task 2
- **Acceptance criteria**:
  - POST `/api/auth/register` creates a user with hashed password, returns tokens
  - POST `/api/auth/login` validates credentials, returns JWT tokens
  - Google OAuth flow completes and creates/links user
  - `getAuthUser(request)` extracts and validates user from Authorization header
  - Protected routes return 401 without valid token
  - Passwords are hashed with bcrypt (cost factor 12)
  - Refresh token rotation works (old token invalidated on use)

---

### Task 4: Auth UI (Login/Register Pages) --> frontend-dev
- **Description**: Build login and registration pages with form validation, error handling, and Google OAuth button. Redirect authenticated users to dashboard.
- **Files**:
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
  - `src/app/(auth)/layout.tsx` -- centered card layout
  - `src/components/auth/login-form.tsx`
  - `src/components/auth/register-form.tsx`
  - `src/components/auth/google-button.tsx`
  - `src/hooks/use-auth.ts` -- auth state hook (login, logout, register functions)
  - `src/lib/api-client.ts` -- fetch wrapper with auth header injection
- **Depends on**: Task 3
- **Acceptance criteria**:
  - Login form validates email format and required password
  - Registration form validates email, password strength (8+ chars), name
  - Form shows server-side errors (e.g., "Email already registered")
  - Google OAuth button triggers OAuth flow
  - Successful login redirects to `/notes`
  - Loading states shown during API calls
  - Unauthenticated users redirected to `/login`

---

### Task 5: Application Shell & Layout --> frontend-dev
- **Description**: Build the authenticated app shell with sidebar navigation, top bar, and responsive layout. This is the container for all dashboard pages.
- **Files**:
  - `src/app/(dashboard)/layout.tsx`
  - `src/components/layout/app-shell.tsx`
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/sidebar-nav.tsx`
  - `src/components/layout/top-bar.tsx`
  - `src/components/layout/breadcrumbs.tsx`
  - `src/components/layout/user-menu.tsx`
  - `src/components/providers.tsx` -- QueryClient, Session, Theme providers
  - `src/stores/ui-store.ts` -- Zustand store (sidebar collapsed, theme)
- **Depends on**: Task 4
- **Acceptance criteria**:
  - Sidebar shows all module nav items with icons
  - Active route is highlighted in sidebar
  - Sidebar collapses on mobile (hamburger toggle)
  - Sidebar can be collapsed/expanded on desktop
  - Top bar shows breadcrumbs for current route
  - User menu shows name, avatar, logout option
  - Layout is responsive: sidebar overlay on mobile, persistent on desktop
  - `(dashboard)` route group redirects unauthenticated users

---

### Task 6: Markdown Editor Component --> frontend-dev
- **Description**: Build the reusable Markdown editor with CodeMirror 6, split-pane preview, and the rendering pipeline (react-markdown + remark-gfm + rehype-highlight + Mermaid). This component is used by Notes, Tasks, Books, and Reviews.
- **Files**:
  - `src/components/editor/markdown-editor.tsx` -- main component with toolbar + split view
  - `src/components/editor/codemirror-editor.tsx` -- CodeMirror 6 wrapper
  - `src/components/editor/markdown-preview.tsx` -- rendering pipeline
  - `src/components/editor/editor-toolbar.tsx` -- format buttons
  - `src/components/editor/mermaid-diagram.tsx` -- Mermaid renderer
  - `src/components/editor/wiki-link.tsx` -- [[WikiLink]] component
  - `src/lib/markdown/plugins.ts` -- custom remark/rehype plugins
  - `src/lib/markdown/sanitize.ts` -- DOMPurify config
- **Depends on**: Task 5
- **Acceptance criteria**:
  - Split view: left editor, right preview, synced scrolling
  - View mode toggle: split | editor-only | preview-only
  - Toolbar inserts Markdown syntax (bold, italic, heading, list, code block, link, table)
  - GFM renders: tables, checkboxes, strikethrough
  - Code blocks have syntax highlighting (rehype-highlight)
  - Mermaid fenced blocks render as diagrams (fallback: raw code on error)
  - `[[NoteTitle]]` renders as internal links
  - HTML is sanitized (no script, no iframe)
  - Auto-save support: onChange callback with debounce (500ms)
  - Responsive: stacks vertically on mobile
  - Editor handles documents up to 50,000 characters without lag

---

### Task 7: Notes API --> backend-dev
- **Description**: Implement all Notes CRUD endpoints with pagination, tag filtering, full-text search, and soft delete/restore.
- **Files**:
  - `src/app/api/notes/route.ts` -- GET (list), POST (create)
  - `src/app/api/notes/[id]/route.ts` -- GET, PUT, DELETE
  - `src/app/api/notes/[id]/restore/route.ts` -- POST
  - `src/app/api/notes/trash/route.ts` -- GET
  - `src/app/api/notes/tags/route.ts` -- GET
  - `src/app/api/notes/search/route.ts` -- GET
  - `src/lib/validators/notes.ts` -- Zod schemas
  - `src/lib/services/notes-service.ts` -- business logic
- **Depends on**: Task 3
- **Acceptance criteria**:
  - CRUD operations work with proper auth checks (user can only access own notes)
  - List endpoint supports: pagination (page, limit), tag filtering, isPinned filter, sortBy (createdAt, updatedAt, title)
  - Full-text search via `to_tsvector` returns ranked results
  - Soft delete sets `isDeleted=true, deletedAt=now()`; note excluded from normal list
  - Restore sets `isDeleted=false, deletedAt=null`
  - Trash endpoint returns only soft-deleted notes
  - Tags endpoint returns unique tags for the user
  - Word count is calculated on save
  - Input validated with Zod; 400 errors include field details
  - 404 returned for non-existent or unauthorized note access

---

### Task 8: Notes Frontend --> frontend-dev
- **Description**: Build the notes list page, note detail/editor page, and trash page. Wire to the Notes API via React Query.
- **Files**:
  - `src/app/(dashboard)/notes/page.tsx`
  - `src/app/(dashboard)/notes/[id]/page.tsx`
  - `src/app/(dashboard)/notes/trash/page.tsx`
  - `src/components/notes/notes-list.tsx`
  - `src/components/notes/note-card.tsx`
  - `src/components/notes/note-detail-header.tsx`
  - `src/components/notes/note-links-panel.tsx`
  - `src/components/shared/tag-editor.tsx`
  - `src/hooks/use-notes.ts` -- React Query hooks (useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote, useRestoreNote)
- **Depends on**: Task 6, Task 7
- **Acceptance criteria**:
  - Notes list shows cards with title, preview (first 150 chars), tags, pin indicator, timestamp
  - Search input filters notes in real-time (debounced 300ms)
  - Tag filter shows all user tags; selecting tags filters the list
  - "New Note" creates a note and navigates to detail page
  - Note detail page has full Markdown editor with auto-save (PUT on 500ms debounce)
  - Tags can be added/removed with autocomplete
  - Pin/unpin toggle works
  - Delete moves to trash; trash page shows deleted notes with restore/permanent-delete
  - Empty states for no notes and no search results
  - Loading skeletons during data fetch
  - Optimistic updates for pin toggle and delete

---

### Task 9: Tasks API --> backend-dev
- **Description**: Implement Tasks CRUD with subtasks, Eisenhower quadrant assignment, filtering, reordering, and the "today" endpoint.
- **Files**:
  - `src/app/api/tasks/route.ts` -- GET (list), POST (create)
  - `src/app/api/tasks/[id]/route.ts` -- GET, PUT, DELETE
  - `src/app/api/tasks/[id]/complete/route.ts` -- POST
  - `src/app/api/tasks/reorder/route.ts` -- POST
  - `src/app/api/tasks/today/route.ts` -- GET
  - `src/lib/validators/tasks.ts` -- Zod schemas
  - `src/lib/services/tasks-service.ts` -- business logic
- **Depends on**: Task 3
- **Acceptance criteria**:
  - CRUD with auth scoping (user sees only own tasks)
  - Subtasks: create with `parentTaskId`, returned nested under parent
  - List supports filters: status, priority, quadrant, tags, dueDate range, parentTaskId
  - Complete endpoint sets `status=completed, completedAt=now()`
  - Reorder endpoint batch-updates `orderIndex` for multiple tasks
  - Today endpoint returns tasks where `dueDate <= today` or `status=pending` with no due date (overdue + today)
  - Recurring tasks: on completion, if `isRecurring=true`, create next occurrence based on `rrule`
  - Input validated with Zod
  - Quadrant assignment validated against enum

---

### Task 10: Tasks Frontend --> frontend-dev
- **Description**: Build the tasks page with list view and Eisenhower matrix view, task detail sheet, and subtask management.
- **Files**:
  - `src/app/(dashboard)/tasks/page.tsx`
  - `src/components/tasks/task-list-view.tsx`
  - `src/components/tasks/task-row.tsx`
  - `src/components/tasks/eisenhower-view.tsx`
  - `src/components/tasks/quadrant.tsx`
  - `src/components/tasks/task-card.tsx`
  - `src/components/tasks/task-detail-sheet.tsx`
  - `src/components/tasks/subtask-list.tsx`
  - `src/components/tasks/create-task-dialog.tsx`
  - `src/components/shared/priority-badge.tsx`
  - `src/components/shared/status-badge.tsx`
  - `src/components/shared/date-picker.tsx`
  - `src/hooks/use-tasks.ts` -- React Query hooks
  - `src/stores/tasks-store.ts` -- Zustand (view mode, filters)
- **Depends on**: Task 6, Task 9
- **Acceptance criteria**:
  - List view shows tasks with checkbox, title, priority badge, due date, tags, subtask progress
  - Clicking checkbox completes/uncompletes task (optimistic update)
  - Eisenhower view shows 4 quadrants with task cards
  - Drag-and-drop between quadrants updates quadrant assignment (using dnd-kit or similar)
  - Drag-and-drop within a list reorders tasks (calls reorder endpoint)
  - Task detail slide-over panel for editing all fields
  - Subtasks can be added inline, checked off, deleted
  - Filter bar: status multi-select, priority multi-select, tag filter
  - View toggle persists in Zustand store
  - Create task dialog with title, priority, due date, quadrant quick-set
  - Empty state for each view

---

### Task 11: Books API --> backend-dev
- **Description**: Implement Books CRUD with status filtering, rating validation, and genre filtering.
- **Files**:
  - `src/app/api/books/route.ts` -- GET (list), POST (create)
  - `src/app/api/books/[id]/route.ts` -- GET, PUT, DELETE
  - `src/lib/validators/books.ts` -- Zod schemas
  - `src/lib/services/books-service.ts`
- **Depends on**: Task 3
- **Acceptance criteria**:
  - CRUD with auth scoping
  - List supports filters: status, genre
  - Rating validated between 1-5
  - `keyIdeas` and `quotes` stored as validated JSON arrays
  - Status transitions: any -> any (no restrictions)
  - When status set to "completed", `completedAt` auto-set if not provided
  - Pagination and sorting (by title, rating, createdAt, updatedAt)

---

### Task 12: Books Frontend --> frontend-dev
- **Description**: Build books grid page and book detail page with tabbed content sections.
- **Files**:
  - `src/app/(dashboard)/books/page.tsx`
  - `src/app/(dashboard)/books/[id]/page.tsx`
  - `src/components/books/book-grid.tsx`
  - `src/components/books/book-card.tsx`
  - `src/components/books/book-detail-header.tsx`
  - `src/components/books/book-tabs.tsx`
  - `src/components/books/key-ideas-list.tsx`
  - `src/components/books/quotes-list.tsx`
  - `src/components/books/create-book-dialog.tsx`
  - `src/components/shared/rating-stars.tsx`
  - `src/hooks/use-books.ts`
- **Depends on**: Task 6, Task 11
- **Acceptance criteria**:
  - Grid view shows book cards with cover (or placeholder), title, author, status badge, rating stars, progress bar
  - Status tabs filter: All, Want to Read, Reading, Completed
  - Book detail page has editable header (title, author, genre, status, rating, progress)
  - Tabbed content: Summary, Key Ideas, Quotes, Learnings, Application
  - Summary, Learnings, Application tabs use MarkdownEditor with auto-save
  - Key Ideas are an orderable list (drag to reorder, add, edit, delete)
  - Quotes are a list with text and optional page number
  - Rating stars clickable (1-5)
  - Progress bar updates on page count change
  - Add book dialog with title, author, cover URL

---

### Task 13: Flashcards & Decks API --> backend-dev
- **Description**: Implement Deck/Card CRUD and the review session flow with SM-2 algorithm.
- **Files**:
  - `src/app/api/decks/route.ts` -- GET, POST
  - `src/app/api/decks/[id]/route.ts` -- GET, PUT, DELETE
  - `src/app/api/decks/[id]/cards/route.ts` -- POST
  - `src/app/api/cards/[id]/route.ts` -- PUT, DELETE
  - `src/app/api/review/due/route.ts` -- GET
  - `src/app/api/review/start/route.ts` -- POST
  - `src/app/api/review/[sessionId]/rate/route.ts` -- POST
  - `src/app/api/review/[sessionId]/complete/route.ts` -- POST
  - `src/lib/validators/flashcards.ts`
  - `src/lib/services/flashcards-service.ts`
  - `src/lib/services/sm2.ts` -- SM-2 algorithm implementation
- **Depends on**: Task 3
- **Acceptance criteria**:
  - Deck CRUD with card count computed on read
  - Card CRUD within a deck
  - Due endpoint returns count of cards where `nextReviewAt <= today`, grouped by deck
  - Start review: creates ReviewSession, returns batch of due cards (up to 20) for a deck (or all decks)
  - Rate card: applies SM-2 algorithm, updates card's `easeFactor`, `interval`, `nextReviewAt`, `state`, `reviewCount`, `lastRating`
  - Complete review: sets `completedAt`, final counts
  - SM-2 implementation matches PRD algorithm exactly
  - Card types validated against enum
  - DueCount and newCount computed per deck

---

### Task 14: Flashcards Frontend --> frontend-dev
- **Description**: Build deck grid, deck detail with card list, card editor, and the review flow UI.
- **Files**:
  - `src/app/(dashboard)/flashcards/page.tsx`
  - `src/app/(dashboard)/flashcards/[deckId]/page.tsx`
  - `src/app/(dashboard)/flashcards/review/page.tsx`
  - `src/components/flashcards/deck-grid.tsx`
  - `src/components/flashcards/deck-card.tsx`
  - `src/components/flashcards/card-list.tsx`
  - `src/components/flashcards/card-preview.tsx`
  - `src/components/flashcards/card-editor-sheet.tsx`
  - `src/components/flashcards/flashcard-display.tsx`
  - `src/components/flashcards/review-complete.tsx`
  - `src/components/flashcards/create-deck-dialog.tsx`
  - `src/hooks/use-flashcards.ts`
  - `src/hooks/use-review.ts`
  - `src/stores/review-store.ts` -- Zustand (current card index, session state)
- **Depends on**: Task 6, Task 13
- **Acceptance criteria**:
  - Deck grid shows cards with name, card count, due count, tags
  - "Due today" banner at top with count and "Start Review" button
  - Deck detail shows all cards with front preview, type badge, state badge
  - Card editor slide-over: card type selector, front/back Markdown editors, source link
  - Review flow: shows card front -> user clicks "Reveal" -> shows back -> rating buttons (Easy/Medium/Hard/Forgot)
  - After rating, next card loads automatically
  - Progress bar shows position in review session
  - Review complete screen shows session stats
  - Keyboard shortcuts: Space = reveal, 1-4 = rating
  - Card flip animation (CSS transform)

---

### Task 15: Daily Planner API --> backend-dev
- **Description**: Implement the planner endpoints that create/retrieve day plans and aggregate today's tasks.
- **Files**:
  - `src/app/api/planner/today/route.ts` -- GET
  - `src/app/api/planner/[date]/route.ts` -- GET, PUT
  - `src/lib/validators/planner.ts`
  - `src/lib/services/planner-service.ts`
- **Depends on**: Task 9 (needs tasks)
- **Acceptance criteria**:
  - GET today: creates DayPlan if not exists, returns it with resolved focus tasks and all tasks due today + overdue
  - PUT updates focusTaskIds and timeBlocks
  - focusTaskIds validated (max 3, must be valid task IDs owned by user)
  - Overdue tasks: tasks with `dueDate < today` and `status != completed/cancelled`
  - CompletedToday count computed from tasks completed today
  - Date parameter validated as ISO date format

---

### Task 16: Daily Planner Frontend --> frontend-dev
- **Description**: Build the Today view with focus tasks, task list, and progress indicator.
- **Files**:
  - `src/app/(dashboard)/planner/page.tsx`
  - `src/components/planner/focus-section.tsx`
  - `src/components/planner/today-tasks.tsx`
  - `src/components/planner/time-block-view.tsx`
  - `src/components/planner/progress-indicator.tsx`
  - `src/hooks/use-planner.ts`
- **Depends on**: Task 10, Task 15
- **Acceptance criteria**:
  - Shows today's date prominently
  - Focus section shows top 3 slots; tasks can be dragged from today's task list into focus slots
  - Today's tasks listed with completion checkboxes
  - Overdue tasks shown in separate section with visual warning
  - Progress indicator: "4 of 7 tasks completed"
  - Completing a task in planner updates it globally (React Query invalidation)
  - Date navigation: prev/next day buttons
  - Empty state when no tasks for today

---

### Task 17: Daily Reviews API --> backend-dev
- **Description**: Implement daily review endpoints that auto-populate metrics and allow user reflection.
- **Files**:
  - `src/app/api/reviews/daily/[date]/route.ts` -- GET, PUT
  - `src/app/api/reviews/weekly/[weekStart]/route.ts` -- GET
  - `src/lib/validators/reviews.ts`
  - `src/lib/services/reviews-service.ts`
- **Depends on**: Task 9, Task 7, Task 13 (aggregates data from these modules)
- **Acceptance criteria**:
  - GET daily review: auto-populates `tasksCompleted`, `tasksMissed`, `notesCreated`, `cardsReviewed` from actual data for that date
  - Creates DailyReview record if not exists
  - PUT updates `reflectionMd` and `mood`
  - Weekly review aggregates daily reviews for the week, computes totals and completion rate
  - Week start date validated (must be a Monday or Sunday depending on user preference)

---

### Task 18: Reviews Frontend --> frontend-dev
- **Description**: Build the daily and weekly review views with metric cards, mood selector, and reflection editor.
- **Files**:
  - `src/app/(dashboard)/reviews/page.tsx`
  - `src/components/reviews/daily-review.tsx`
  - `src/components/reviews/weekly-review.tsx`
  - `src/components/reviews/metric-card.tsx`
  - `src/components/reviews/mood-selector.tsx`
  - `src/hooks/use-reviews.ts`
- **Depends on**: Task 6, Task 17
- **Acceptance criteria**:
  - Daily review shows 4 metric cards (tasks completed, missed, notes created, cards reviewed)
  - Mood selector: 4 emoji-free mood options (Great, Good, Okay, Bad) with visual styling
  - Reflection section uses MarkdownEditor (compact mode)
  - Weekly review shows aggregate metrics and a bar chart of daily completion rates
  - Date navigation for both daily and weekly views
  - Auto-saves reflection on debounce

---

### Task 19: Global Search API --> backend-dev
- **Description**: Implement universal search across notes, tasks, books, and flashcards using PostgreSQL full-text search.
- **Files**:
  - `src/app/api/search/route.ts` -- GET
  - `src/lib/services/search-service.ts`
- **Depends on**: Task 7, Task 9, Task 11, Task 13
- **Acceptance criteria**:
  - Single endpoint searches across all entity types
  - Results include: id, type, title, preview (first 200 chars), tags, relevance score, updatedAt
  - Filter by entity type (multiple allowed)
  - Results ranked by `ts_rank` relevance score
  - Minimum query length: 2 characters
  - Max 50 results per search
  - Performance: < 500ms for typical queries
  - Flashcard search searches both front and back content

---

### Task 20: Global Search Frontend --> frontend-dev
- **Description**: Build the Cmd+K search modal that searches across all entities with type filtering and result navigation.
- **Files**:
  - `src/components/search/global-search-modal.tsx`
  - `src/components/search/search-results.tsx`
  - `src/components/search/search-result-item.tsx`
  - `src/hooks/use-search.ts`
- **Depends on**: Task 19
- **Acceptance criteria**:
  - Cmd+K (Mac) / Ctrl+K (Windows) opens search modal
  - Search input with debounced query (300ms)
  - Type filter chips: Notes, Tasks, Books, Flashcards (toggle on/off)
  - Results show entity icon, title with highlighted match, preview with highlighted match, tags, timestamp
  - Clicking a result navigates to the entity's detail page and closes modal
  - Keyboard navigation: up/down arrows to navigate, Enter to open
  - Escape closes modal
  - Empty state: "Start typing to search across your notes, tasks, books, and flashcards"
  - Loading state while searching

---

### Task 21: Quick Capture --> fullstack
- **Description**: Implement the Quick Capture feature: a floating input triggered by Cmd+K that creates a Note, Task, or Idea with one keystroke.
- **Files**:
  - `src/components/quick-capture/modal.tsx`
  - `src/components/quick-capture/capture-input.tsx`
  - `src/components/quick-capture/type-selector.tsx`
  - `src/hooks/use-quick-capture.ts`
- **Depends on**: Task 7, Task 9, Task 20 (shares Cmd+K -- must coordinate)
- **Acceptance criteria**:
  - Quick Capture is accessible from a sidebar button or keyboard shortcut (separate from search, e.g., Cmd+Shift+K or a dedicated button)
  - Text input for quick content
  - Type selector: Note / Task (default: Note)
  - Selecting Task shows optional priority and due date quick-selectors
  - Submit creates the entity and shows a toast confirmation with a link to it
  - Auto-focus on open, submit on Enter
  - Recent captures shown (last 3) for quick access

---

### Task 22: Goals & Habits API --> backend-dev
- **Description**: Implement Goals and Habits CRUD with streak calculation and progress tracking. While this is a Phase 3 UI feature, the API is built now so tasks can link to goals.
- **Files**:
  - `src/app/api/goals/route.ts` -- GET, POST
  - `src/app/api/goals/[id]/route.ts` -- GET, PUT, DELETE
  - `src/app/api/habits/route.ts` -- GET, POST
  - `src/app/api/habits/[id]/route.ts` -- PUT, DELETE
  - `src/app/api/habits/[id]/log/route.ts` -- POST
  - `src/app/api/habits/[id]/logs/route.ts` -- GET
  - `src/lib/validators/goals.ts`
  - `src/lib/services/goals-service.ts`
  - `src/lib/services/habits-service.ts`
- **Depends on**: Task 3
- **Acceptance criteria**:
  - Goal CRUD with progress calculated from linked task completion percentage
  - Habit CRUD with streak calculation (consecutive days completed)
  - Log endpoint: toggles habit completion for today (or specified date)
  - Logs endpoint: returns habit log history for a date range
  - Streak calculation: current streak and longest streak
  - Goals filterable by status and category

---

### Task 23: Goals & Habits Frontend --> frontend-dev
- **Description**: Build the goals and habits pages with progress bars, streak displays, and habit log calendar.
- **Files**:
  - `src/app/(dashboard)/goals/page.tsx`
  - `src/components/goals/goal-list.tsx`
  - `src/components/goals/goal-card.tsx`
  - `src/components/goals/goal-detail.tsx`
  - `src/components/goals/create-goal-dialog.tsx`
  - `src/components/habits/habit-list.tsx`
  - `src/components/habits/habit-card.tsx`
  - `src/components/habits/habit-calendar.tsx`
  - `src/components/habits/create-habit-dialog.tsx`
  - `src/hooks/use-goals.ts`
  - `src/hooks/use-habits.ts`
- **Depends on**: Task 22
- **Acceptance criteria**:
  - Goals page: list of goals with progress bars (computed from linked tasks)
  - Goal detail: shows linked tasks, progress percentage, target date, status
  - Create goal: title, description, category, target date
  - Habits section: list of habits with current streak display
  - Habit card: title, streak count, today's check-in button
  - Habit calendar: heatmap-style visualization of completion history (last 90 days)
  - Clicking today's check-in toggles completion (optimistic update)

---

### Task 24: Basic Analytics Dashboard --> frontend-dev
- **Description**: Build a simple analytics page showing productivity metrics with charts.
- **Files**:
  - `src/app/(dashboard)/analytics/page.tsx`
  - `src/components/analytics/task-completion-chart.tsx`
  - `src/components/analytics/activity-summary.tsx`
  - `src/components/analytics/streak-display.tsx`
  - `src/app/api/analytics/summary/route.ts` -- GET (aggregated stats)
  - `src/lib/services/analytics-service.ts`
  - `src/hooks/use-analytics.ts`
- **Depends on**: Task 9, Task 7, Task 13, Task 22
- **Acceptance criteria**:
  - Shows task completion rate over last 30 days (line chart)
  - Shows notes created per week (bar chart)
  - Shows flashcard review streak
  - Shows habit completion streaks
  - Summary cards: total notes, total tasks completed, total books, total cards reviewed
  - Charts use a lightweight library (recharts or chart.js)
  - Data fetched from a single analytics summary endpoint
  - Responsive layout

---

### Task 25: Cross-Module Linking --> fullstack
- **Description**: Implement the ability to link entities across modules (note -> task, task -> book, etc.) and display linked entities in context.
- **Files**:
  - `src/app/api/notes/[id]/links/route.ts` -- POST, DELETE
  - `src/app/api/tasks/[id]/links/route.ts` -- POST, DELETE
  - `src/components/shared/link-entity-dialog.tsx` -- search and select entity to link
  - `src/components/shared/linked-entities-list.tsx` -- display linked entities
  - `src/lib/services/link-service.ts`
- **Depends on**: Task 8, Task 10, Task 12, Task 14
- **Acceptance criteria**:
  - From a note, user can link to tasks, books, or decks
  - From a task, user can link to notes or books
  - Link dialog: search across entity types, click to create link
  - Linked entities displayed as chips/cards with entity type icon and title
  - Clicking a linked entity navigates to its detail page
  - Links can be removed
  - Bi-directional display: if Note A links to Task B, Task B shows Note A in its links

---

### Task 26: Error Handling, Loading States & Polish --> fullstack
- **Description**: Add consistent error boundaries, loading skeletons, toast notifications, and empty states across all modules.
- **Files**:
  - `src/components/shared/error-boundary.tsx`
  - `src/components/shared/loading-skeleton.tsx`
  - `src/components/shared/empty-state.tsx`
  - `src/components/shared/toast.tsx` -- or use shadcn/sonner
  - `src/lib/api-client.ts` -- add error interceptor, retry logic
  - All page files (add error.tsx and loading.tsx per route)
- **Depends on**: Task 8, Task 10, Task 12, Task 14, Task 16, Task 18
- **Acceptance criteria**:
  - Every page has a `loading.tsx` with appropriate skeleton
  - Every page has an `error.tsx` with retry button
  - Error boundary catches render errors and shows fallback UI
  - Toast notifications for: create success, delete success, error messages, auto-save confirmation
  - API client retries failed requests once (except 4xx errors)
  - 404 page for unknown routes
  - Confirmation dialogs before destructive actions (delete note, delete deck, etc.)

---

### Task 27: End-to-End Tests --> qa-engineer
- **Description**: Write Playwright E2E tests covering critical user flows.
- **Files**:
  - `e2e/auth.spec.ts` -- register, login, logout
  - `e2e/notes.spec.ts` -- create, edit, search, delete, restore
  - `e2e/tasks.spec.ts` -- create, complete, Eisenhower view, subtasks
  - `e2e/books.spec.ts` -- create, update status, add quotes
  - `e2e/flashcards.spec.ts` -- create deck, add cards, review flow
  - `e2e/planner.spec.ts` -- view today, set focus tasks
  - `e2e/search.spec.ts` -- global search across types
  - `playwright.config.ts`
  - `e2e/fixtures/test-user.ts` -- test user setup/teardown
- **Depends on**: Task 8, Task 10, Task 12, Task 14, Task 16, Task 18, Task 20
- **Acceptance criteria**:
  - Auth flow: register -> login -> see dashboard -> logout
  - Notes flow: create note -> edit title + content -> add tags -> search -> find note -> delete -> find in trash -> restore
  - Tasks flow: create task -> assign quadrant -> complete -> verify in Eisenhower view
  - Books flow: create book -> set status to reading -> add summary -> rate -> set to completed
  - Flashcards flow: create deck -> add 3 cards -> start review -> rate all -> see completion stats
  - Planner flow: create task with today's due date -> open planner -> see task -> set as focus -> complete
  - Search flow: create note + task -> search by keyword -> see both in results -> click to navigate
  - All tests use test user fixtures with proper cleanup
  - Tests run in CI (GitHub Actions compatible)

---

### Task 28: Unit & Integration Tests --> qa-engineer
- **Description**: Write Vitest unit tests for business logic and API integration tests for all endpoints.
- **Files**:
  - `src/lib/services/__tests__/sm2.test.ts`
  - `src/lib/services/__tests__/notes-service.test.ts`
  - `src/lib/services/__tests__/tasks-service.test.ts`
  - `src/lib/services/__tests__/search-service.test.ts`
  - `src/lib/validators/__tests__/notes.test.ts`
  - `src/lib/validators/__tests__/tasks.test.ts`
  - `src/lib/auth/__tests__/password.test.ts`
  - `src/lib/markdown/__tests__/sanitize.test.ts`
  - `src/components/__tests__/markdown-preview.test.tsx`
- **Depends on**: Task 7, Task 9, Task 11, Task 13, Task 19
- **Acceptance criteria**:
  - SM-2 algorithm: unit tests for all rating outcomes (Easy/Medium/Hard/Forgot), interval progression, ease factor bounds
  - Zod validators: test valid and invalid inputs for each endpoint
  - Password hashing: hash and compare round-trip
  - Markdown sanitize: XSS payloads are stripped, safe HTML preserved
  - API integration: test full request/response cycle with mocked Prisma
  - Minimum 80% coverage on `src/lib/services/` and `src/lib/validators/`

---

## 7. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CodeMirror 6 integration complexity | Medium (editor is core UX) | Medium | Spike task first. If blockers, fall back to textarea + markdown-it for Phase 1, upgrade to CM6 later. |
| Full-text search performance at scale | Low (Phase 1 is single user) | Low | GIN indexes added upfront. Phase 2 adds pgvector for semantic search. If > 10k notes, add materialized search views. |
| Mermaid.js rendering XSS | High (security) | Low | Render Mermaid in sandboxed container. DOMPurify on all output. CSP headers to block inline scripts. |
| Auto-save data loss (race conditions) | Medium | Medium | Debounce at 500ms. Use `updatedAt` optimistic locking -- PUT rejected if server version is newer. Client shows conflict resolution. |
| SM-2 algorithm edge cases | Low | Medium | Comprehensive unit tests. Match exact PRD algorithm. Cap `easeFactor` at min 1.3 and `interval` at max 365 days. |
| Scope creep across 28 tasks | High | High | Strict Phase 1 boundary: no AI, no semantic search, no mobile. Phase 2/3 schemas are defined but not implemented. |
| Drag-and-drop complexity (Eisenhower, Planner) | Medium | Medium | Use @dnd-kit/core (lightweight, accessible). Keep interaction simple: no nested drag zones in Phase 1. |
| PostgreSQL JSONB schema evolution | Low | Low | Validate JSON shape with Zod on write. Add migration scripts for schema changes. Avoid deeply nested JSON. |
| NextAuth.js v5 breaking changes | Medium | Low | Pin version. Auth is isolated in `src/lib/auth/` -- can swap provider without affecting rest of app. |
| Large Prisma schema migrations | Medium | Medium | Run `prisma migrate dev` frequently. Never edit migration files after they run. Use `prisma db push` only in dev. |

---

## 8. Open Questions (for Lead)

- [ ] **Quick Capture vs Search shortcut conflict**: Both PRD and convention use Cmd+K. Should Quick Capture use Cmd+Shift+K, or should we combine them into one modal (search + capture in same UI)?
- [ ] **Note permanent delete**: Should permanently deleting a note from trash require a confirmation? Or is the 30-day auto-purge sufficient (no manual permanent delete)?
- [ ] **Eisenhower quadrant assignment**: Should tasks without an explicit quadrant be auto-assigned based on priority + due date? Or should quadrant always be manual?
- [ ] **Recurring task UX**: The PRD specifies RRULE-based recurrence. For Phase 1, should we support the full RRULE spec or limit to simple presets (daily, weekly, monthly)?
- [ ] **Book cover images**: Should we support file upload for covers in Phase 1, or only URL input? URL-only avoids the need for S3/R2 storage in Phase 1.
- [ ] **Review sessions scope**: When starting a review, can users review cards across ALL decks (mixed), or only one deck at a time?
- [ ] **Time blocking in Planner**: This is listed as "optional" in the PRD. Should we include it in Phase 1 or defer to Phase 2? It adds significant drag-and-drop complexity.
- [ ] **Analytics chart library**: Recharts (React-native, larger bundle) vs Chart.js (canvas-based, smaller) vs Nivo (D3-based, pretty but heavy). Recommendation: Recharts for consistency with React ecosystem.
- [ ] **Dark mode**: Should dark mode be a Phase 1 deliverable? The theme infrastructure (CSS variables + Tailwind dark:) can be set up in Task 1, but full dark mode testing across all components adds effort.
- [ ] **Goal categories**: The PRD lists fitness, learning, work, personal. Should these be fixed or user-customizable?
- [ ] **Mobile responsiveness target**: Should Phase 1 be fully responsive (usable on phone) or just "not broken" on tablet? Full mobile responsiveness adds testing scope to every task.

---

## Appendix A: Project Directory Structure

```
nobrainy/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing / redirect
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # App shell with sidebar
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── trash/page.tsx
│   │   │   ├── tasks/page.tsx
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── flashcards/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [deckId]/page.tsx
│   │   │   │   └── review/page.tsx
│   │   │   ├── planner/page.tsx
│   │   │   ├── reviews/page.tsx
│   │   │   ├── goals/page.tsx
│   │   │   └── analytics/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts
│   │       ├── notes/
│   │       ├── tasks/
│   │       ├── books/
│   │       ├── decks/
│   │       ├── cards/
│   │       ├── review/
│   │       ├── planner/
│   │       ├── reviews/
│   │       ├── goals/
│   │       ├── habits/
│   │       ├── search/
│   │       └── analytics/
│   ├── components/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── editor/
│   │   ├── notes/
│   │   ├── tasks/
│   │   ├── books/
│   │   ├── flashcards/
│   │   ├── planner/
│   │   ├── reviews/
│   │   ├── goals/
│   │   ├── habits/
│   │   ├── analytics/
│   │   ├── search/
│   │   ├── quick-capture/
│   │   └── shared/
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-notes.ts
│   │   ├── use-tasks.ts
│   │   ├── use-books.ts
│   │   ├── use-flashcards.ts
│   │   ├── use-review.ts
│   │   ├── use-planner.ts
│   │   ├── use-reviews.ts
│   │   ├── use-goals.ts
│   │   ├── use-habits.ts
│   │   ├── use-search.ts
│   │   ├── use-analytics.ts
│   │   └── use-quick-capture.ts
│   ├── stores/
│   │   ├── ui-store.ts
│   │   ├── tasks-store.ts
│   │   └── review-store.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   ├── api-client.ts
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── notes.ts
│   │   │   ├── tasks.ts
│   │   │   ├── books.ts
│   │   │   ├── flashcards.ts
│   │   │   ├── planner.ts
│   │   │   ├── reviews.ts
│   │   │   └── search.ts
│   │   ├── validators/
│   │   │   ├── notes.ts
│   │   │   ├── tasks.ts
│   │   │   ├── books.ts
│   │   │   ├── flashcards.ts
│   │   │   ├── planner.ts
│   │   │   ├── reviews.ts
│   │   │   └── goals.ts
│   │   ├── services/
│   │   │   ├── notes-service.ts
│   │   │   ├── tasks-service.ts
│   │   │   ├── books-service.ts
│   │   │   ├── flashcards-service.ts
│   │   │   ├── sm2.ts
│   │   │   ├── planner-service.ts
│   │   │   ├── reviews-service.ts
│   │   │   ├── goals-service.ts
│   │   │   ├── habits-service.ts
│   │   │   ├── search-service.ts
│   │   │   ├── analytics-service.ts
│   │   │   └── link-service.ts
│   │   ├── auth/
│   │   │   ├── options.ts
│   │   │   ├── middleware.ts
│   │   │   ├── password.ts
│   │   │   └── session.ts
│   │   └── markdown/
│   │       ├── plugins.ts
│   │       └── sanitize.ts
│   └── middleware.ts
├── e2e/
│   ├── auth.spec.ts
│   ├── notes.spec.ts
│   ├── tasks.spec.ts
│   ├── books.spec.ts
│   ├── flashcards.spec.ts
│   ├── planner.spec.ts
│   └── search.spec.ts
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## Appendix B: BYOK API Key System

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/api-key` | Yes | Check if user has an API key configured (returns hasKey boolean) |
| PUT | `/api/settings/api-key` | Yes | Save encrypted API key (validates sk- prefix) |
| DELETE | `/api/settings/api-key` | Yes | Remove stored API key |

### Encryption

- Algorithm: AES-256-GCM
- Key derivation: SHA-256 hash of NEXTAUTH_SECRET
- Storage: `user.preferences.openaiApiKey` (JSONB field)
- Format: `{iv}:{authTag}:{ciphertext}` (hex-encoded)

### Frontend Gate

- `useAI()` hook returns `{ isEnabled, isLoading }`
- AI action buttons check `isEnabled` before showing
- When disabled: show "Add your OpenAI API key in Settings to unlock AI features"

### Files

- `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt
- `src/lib/ai/get-api-key.ts` — Retrieve and decrypt user's API key
- `src/app/api/settings/api-key/route.ts` — CRUD for API key
- `src/hooks/use-settings.ts` — React Query hooks
- `src/hooks/use-ai.ts` — AI feature gate hook
- `src/app/(dashboard)/settings/page.tsx` — Settings UI

---

## Appendix C: Phase 2 & 3 Architecture Notes

These are not implemented in Phase 1 but the architecture accommodates them:

**Phase 2 (AI features):**
- Add `embedding` vector column to Note, Book, Flashcard via migration
- Add `src/lib/ai/` directory: `openai-client.ts`, `prompt-manager.ts`, `embedding-service.ts`
- Add AI API routes: `POST /api/notes/:id/ai/summarize`, etc.
- Add Redis + BullMQ for async AI job processing
- Add SSE endpoint for streaming AI responses: `GET /api/ai/stream/:jobId`
- pgvector cosine similarity search in `search-service.ts`
- PromptTemplate CRUD for prompt versioning

**Phase 3 (Scale):**
- React Native app sharing `src/lib/types/` and `src/lib/validators/`
- Extract API routes to standalone Hono server if needed
- Add S3/R2 for file uploads
- WebSocket for real-time collaboration
- Service worker for offline support
