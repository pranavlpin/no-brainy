# NoBrainy

> Personal Productivity & Learning Operating System

NoBrainy is a unified platform for thinking, learning, and execution. It combines notes, tasks, book summaries, flashcards, daily planning, goal tracking, and reviews into a single connected system built around the loop: **Capture, Organize, Plan, Execute, Learn, Reflect, Improve.**

Designed for developers, product thinkers, and knowledge workers who want one coherent system instead of multiple disconnected tools. Everything is Markdown-first, cross-linked, and designed for minimal friction.

## Features

### Notes
Full Markdown editor with live split-pane preview, syntax-highlighted code blocks, Mermaid.js diagram rendering, GFM support (tables, checkboxes, strikethrough), `[[wiki-links]]` for bi-directional linking, multi-tag filtering, full-text search, pinning, and soft delete with recovery.

### Tasks
Eisenhower Matrix four-quadrant view, nested subtasks, recurring tasks (RRULE-based), priority levels (Critical / High / Medium / Low), status tracking, due dates, tag filtering, bulk actions (complete, delete, reprioritize), drag-and-drop reordering, and goal linking.

### Books
Reading tracker with status management (Want to Read / Reading / Completed), structured fields for summaries, key ideas, favourite quotes, personal learnings, and application notes. Star ratings (1-5), page progress tracking, and Markdown formatting throughout.

### Flashcards
Deck-based flashcard management with SM-2 spaced repetition algorithm. Card types include Q&A, Cloze, Definition, Reflection, and Application. Review mode with difficulty rating (Easy / Medium / Hard / Forgot), automatic scheduling, review session tracking, and source linking back to notes and books.

### Daily Planner
Today view with focus task selection (top 3), time blocking, daily task carry-forward for incomplete items, and progress indicators.

### Reviews
Daily and weekly reflection system with guided prompts. Auto-aggregated statistics for tasks completed, tasks missed, notes created, and cards reviewed. Mood tracking and weekly summary views.

### Goals & Habits
Goal creation with categories (fitness, learning, work, personal), target dates, and status tracking. Habit tracking with daily check-ins, streak display, and calendar heatmap visualization. Goals link to tasks for progress tracking.

### Analytics
Dashboard with completion rate charts, productivity breakdowns, activity heatmap, and stat cards for key metrics across all modules.

### Global Search
Universal full-text search across notes, tasks, books, flashcards, and all other modules. Keyword-based search powered by PostgreSQL tsvector with GIN indexes. Results include entity type and preview with source linking.

### Quick Capture
Global `Cmd+K` / `Ctrl+K` modal for fast input. Quickly create notes, tasks, or ideas without navigating away from the current view.

### Cross-Module Linking
Connect notes to tasks, books to flashcard decks, tasks to goals, and more. Link picker modal for easy cross-referencing. Linked items are displayed in context on each entity's detail page.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3, shadcn/ui |
| Editor | CodeMirror 6, react-markdown, remark-gfm, rehype-highlight, Mermaid.js |
| State | Zustand (client UI state), TanStack React Query v5 (server state) |
| Backend | Next.js API Route Handlers |
| Database | PostgreSQL 16, Prisma ORM 5 |
| Auth | NextAuth.js v5 (email/password + Google OAuth) |
| Validation | Zod |
| Testing | Vitest, React Testing Library |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+ (recommend 20 LTS)
- pnpm 8+
- PostgreSQL 16+

### Installation

```bash
git clone git@github.com:pranavlpin/nobrainy.git
cd nobrainy
pnpm install
```

### Quick Start (Docker)

The fastest way to get running locally with PostgreSQL via Docker:

```bash
docker-compose up -d          # Start PostgreSQL + Redis
cp .env.example .env          # Configure env vars
pnpm db:generate              # Generate Prisma client
pnpm db:migrate               # Run database migrations
pnpm dev                      # Start dev server at localhost:3000
```

### Quick Start (Manual PostgreSQL)

If you already have PostgreSQL running locally:

```bash
cp .env.example .env
# Edit .env with your database URL and auth secrets (see Environment Variables below)
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file based on `.env.example`. The following variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://postgres:password@localhost:5432/nobrainy`) | Yes |
| `NEXTAUTH_URL` | Base URL of the application (e.g., `http://localhost:3000`) | Yes |
| `NEXTAUTH_SECRET` | Random secret string for NextAuth.js session encryption. Generate with `openssl rand -base64 32` | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID from Google Cloud Console | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret from Google Cloud Console | Optional |
| `OPENAI_API_KEY` | OpenAI API key for Phase 2 AI features | Optional |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (dashboard)/         # All authenticated module pages
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── books/           # Book list, detail, and creation
│   │   ├── flashcards/      # Deck list, detail, and review mode
│   │   ├── goals/           # Goal list and detail with habits
│   │   ├── notes/           # Note list, detail, and creation
│   │   ├── planner/         # Daily planner view
│   │   ├── reviews/         # Daily and weekly reviews
│   │   ├── search/          # Global search page
│   │   ├── settings/        # User settings
│   │   └── tasks/           # Task list and detail
│   └── api/                 # API route handlers (see API Reference)
├── components/
│   ├── analytics/           # Stat cards, bar charts, activity heatmap
│   ├── auth/                # Login form, register form, Google button
│   ├── books/               # Star rating, reading progress, key ideas/quotes editors
│   ├── editor/              # CodeMirror editor, Markdown preview, toolbar, Mermaid, wiki-links
│   ├── flashcards/          # Deck card, review card, rating buttons, review summary
│   ├── goals/               # Goal card, goal form
│   ├── habits/              # Habit list, habit form, calendar heatmap, streak display
│   ├── layout/              # App shell, sidebar, top bar, breadcrumbs, user menu
│   ├── linking/             # Link picker modal, link manager, linked item display
│   ├── notes/               # Note card, tag input, note filters
│   ├── planner/             # Focus tasks, task schedule, carry-forward banner
│   ├── quick-capture/       # Cmd+K modal and provider
│   ├── reviews/             # Mood selector, stats grid, review card, weekly summary
│   ├── search/              # Search result item, search highlight
│   ├── tasks/               # Task list, task form, Eisenhower matrix, subtask list, priority badge
│   └── ui/                  # Shared components: button, input, label, badge, select, dialog, skeleton, toast
├── hooks/                   # React Query hooks (one per module: use-notes, use-tasks, use-books, etc.)
├── lib/
│   ├── auth/                # Auth config, options, session helpers, middleware
│   ├── db/                  # Database helpers (full-text search)
│   ├── flashcards/          # SM-2 spaced repetition algorithm
│   ├── markdown/            # Markdown plugins and sanitization
│   ├── types/               # TypeScript interfaces per module
│   ├── utils/               # Utility functions (relative time, etc.)
│   └── validations/         # Zod schemas per module
└── stores/                  # Zustand stores (UI state)
```

## API Reference

All API endpoints require authentication unless noted. Routes are grouped by module.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user with email and password |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth.js handler (login, OAuth, session) |

### Notes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List notes with filtering (tags, search, pinned, deleted) |
| POST | `/api/notes` | Create a new note |
| GET | `/api/notes/:id` | Get a single note by ID |
| PUT | `/api/notes/:id` | Update note content or metadata |
| DELETE | `/api/notes/:id` | Soft delete a note |
| POST | `/api/notes/:id/restore` | Restore a soft-deleted note |
| GET | `/api/notes/search` | Full-text search across notes |
| GET | `/api/notes/:id/links` | Get all links from a note |
| POST | `/api/notes/:id/links` | Create a link from a note to another entity |
| DELETE | `/api/notes/:id/links` | Remove a link from a note |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List tasks with filtering (status, priority, quadrant, tags) |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get a single task with subtasks |
| PUT | `/api/tasks/:id` | Update task fields |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/bulk` | Bulk actions on multiple tasks |
| POST | `/api/tasks/reorder` | Reorder tasks (drag-and-drop) |
| GET | `/api/tasks/:id/links` | Get all links from a task |
| POST | `/api/tasks/:id/links` | Create a link from a task to another entity |
| DELETE | `/api/tasks/:id/links` | Remove a link from a task |

### Books

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/books` | List books with filtering by status |
| POST | `/api/books` | Create a new book entry |
| GET | `/api/books/:id` | Get a single book with all fields |
| PUT | `/api/books/:id` | Update book details or reading progress |
| DELETE | `/api/books/:id` | Delete a book |

### Flashcards & Decks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/decks` | List all decks |
| POST | `/api/decks` | Create a new deck |
| GET | `/api/decks/:id` | Get a deck with card count |
| PUT | `/api/decks/:id` | Update deck name, description, or tags |
| DELETE | `/api/decks/:id` | Delete a deck and all its cards |
| GET | `/api/decks/:id/cards` | List cards in a deck |
| POST | `/api/decks/:id/cards` | Add a new card to a deck |
| POST | `/api/decks/:id/review` | Start a review session for a deck |
| GET | `/api/flashcards/:id` | Get a single flashcard |
| PUT | `/api/flashcards/:id` | Update a flashcard |
| DELETE | `/api/flashcards/:id` | Delete a flashcard |
| POST | `/api/flashcards/:id/rate` | Submit a rating and update SM-2 schedule |
| POST | `/api/review-sessions/:id/complete` | Complete a review session with stats |

### Goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List goals with status filtering |
| POST | `/api/goals` | Create a new goal |
| GET | `/api/goals/:id` | Get a goal with linked tasks and habits |
| PUT | `/api/goals/:id` | Update goal fields |
| DELETE | `/api/goals/:id` | Delete a goal |

### Habits

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/habits` | List habits for the user |
| POST | `/api/habits` | Create a new habit |
| GET | `/api/habits/:id` | Get a single habit |
| PUT | `/api/habits/:id` | Update habit details |
| DELETE | `/api/habits/:id` | Delete a habit |
| POST | `/api/habits/:id/log` | Log a habit completion for a date |
| GET | `/api/habits/:id/log` | Get habit logs (for calendar display) |
| GET | `/api/habits/:id/streak` | Get current and longest streak |

### Daily Planner

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/planner/today` | Get today's plan with focus tasks and schedule |
| PUT | `/api/planner/today` | Update today's focus tasks or time blocks |
| GET | `/api/planner/:date` | Get plan for a specific date |
| POST | `/api/planner/carry-forward` | Carry forward incomplete tasks to today |

### Reviews

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reviews/daily` | List daily reviews |
| POST | `/api/reviews/daily` | Create a daily review |
| GET | `/api/reviews/daily/:date` | Get daily review for a specific date |
| PUT | `/api/reviews/daily/:date` | Update a daily review |
| GET | `/api/reviews/weekly` | Get weekly review summary with aggregated stats |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics` | Get aggregated analytics data across all modules |

### Search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search` | Universal search across all entity types |

## Database Schema

The database uses PostgreSQL 16 with Prisma ORM. The full schema is defined in `prisma/schema.prisma`.

### Models (16 total)

| Model | Description |
|-------|-------------|
| `User` | User accounts with email, OAuth provider, timezone, and preferences |
| `UserSession` | Refresh token sessions for authenticated users |
| `Note` | Markdown notes with tags, pinning, soft delete, and word count |
| `NoteLink` | Cross-entity links originating from notes (to notes, tasks, books, decks) |
| `Book` | Book entries with reading status, summary, key ideas, quotes, and ratings |
| `Task` | Tasks with priority, status, Eisenhower quadrant, subtasks, and recurrence |
| `TaskLink` | Cross-entity links originating from tasks (to notes, books) |
| `DayPlan` | Daily plans with focus task IDs and time blocks |
| `Deck` | Flashcard deck containers with tags and descriptions |
| `Flashcard` | Individual cards with SM-2 scheduling fields (ease factor, interval, next review) |
| `ReviewSession` | Flashcard review session tracking with per-rating counts |
| `DailyReview` | Daily reflection entries with auto-aggregated stats and mood |
| `Goal` | Goals with categories, target dates, and status tracking |
| `Habit` | Habits linked to goals with frequency settings |
| `HabitLog` | Daily habit check-in records |
| `Insight` | AI-generated insights with type, severity, and expiration (Phase 2) |
| `PromptTemplate` | Versioned AI prompt templates per module and action (Phase 2) |

## Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `pnpm dev` | Start Next.js development server |
| `build` | `pnpm build` | Build for production |
| `start` | `pnpm start` | Start production server |
| `lint` | `pnpm lint` | Run ESLint |
| `test` | `pnpm test` | Run tests with Vitest |
| `db:generate` | `pnpm db:generate` | Generate Prisma client from schema |
| `db:migrate` | `pnpm db:migrate` | Run Prisma migrations in development |
| `db:push` | `pnpm db:push` | Push schema changes directly (no migration file) |
| `db:studio` | `pnpm db:studio` | Open Prisma Studio (visual database editor) |

### Database Seeding

```bash
pnpm prisma db seed
```

The seed script is located at `prisma/seed.ts`.

## Architecture

NoBrainy follows a modular monolith architecture within a single Next.js application. Module boundaries are enforced by folder structure to enable extraction in later phases.

```
┌─────────────────────────────────────────────────────────┐
│                    NoBrainy Platform                   │
├───────────────────────┬─────────────────────────────────┤
│     Frontend Layer    │         API Layer               │
│  Next.js 14 (Web)     │  Next.js API Route Handlers     │
│  React 18 + Tailwind  │  Zod validation + Prisma        │
├───────────────────────┼─────────────────────────────────┤
│     Data Layer        │      AI / ML Layer (Phase 2)    │
│  PostgreSQL 16        │  OpenAI APIs                    │
│  Prisma ORM           │  pgvector embeddings            │
├───────────────────────┴─────────────────────────────────┤
│                  Infrastructure Layer                    │
│  NextAuth.js (Auth)  |  Vercel / Node.js hosting        │
└─────────────────────────────────────────────────────────┘
```

Key architectural decisions:

- **No separate backend server in Phase 1.** API routes live inside Next.js, simplifying deployment and reducing infrastructure. Can extract to a standalone Hono server in Phase 3 if needed.
- **Zustand for UI state, React Query for server state.** Clear separation between ephemeral client state (sidebar open, modals) and cached server data (notes, tasks).
- **Markdown-first storage.** All content is stored as raw Markdown and rendered on the frontend. No proprietary formats.
- **CUID2 IDs.** URL-safe, sortable, collision-resistant identifiers via Prisma's `@default(cuid())`.
- **Full-text search via PostgreSQL.** tsvector with GIN indexes in Phase 1, pgvector semantic search added in Phase 2.

## Roadmap

### Phase 1 (Current) -- Foundation

Core CRUD for all modules with no AI dependencies. Fully functional notes, tasks, books, flashcards, daily planner, reviews, goals, habits, analytics, global search, quick capture, and cross-module linking.

### Phase 2 -- Intelligence

- AI note summarization and key insight extraction
- AI flashcard generation from notes and books
- Semantic search with pgvector embeddings
- AI task prioritization and daily plan suggestions
- AI coach for personalized productivity insights
- Daily and weekly AI-generated summaries
- Smart reminders (behavior-based)

### Phase 3 -- Scale

- React Native mobile app (Expo) with code sharing
- Collaboration and sharing features
- Advanced insight engine with pattern detection
- Focus mode (distraction-free task execution)
- Redis caching and background job queues (BullMQ)
- Offline support with service worker and IndexedDB

## Deployment

NoBrainy deploys as a Docker container. GCP Cloud Run is the recommended production deployment.

### Option 1: GCP Cloud Run (Recommended)

Full CI/CD pipeline with GitHub Actions, Cloud SQL, and Artifact Registry. Scales to zero when idle, handles SSL and custom domains automatically.

**Quick start:**

```bash
# One-time GCP infrastructure setup
export GCP_PROJECT_ID=your-project
./scripts/setup-gcp.sh

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

**CI/CD (GitHub Actions):**
- `ci.yml` — Lint, type-check, test on every push/PR
- `deploy-staging.yml` — Auto-deploy to staging on push to `develop`
- `deploy-production.yml` — Auto-deploy to production on push to `main` (with approval gate)

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Federation provider |
| `GCP_SERVICE_ACCOUNT` | Service account email for deployments |

**Resources used:**
- Cloud Run (app hosting, scales to zero)
- Cloud SQL PostgreSQL 16 (managed database)
- Artifact Registry (Docker images)
- Secret Manager (env vars)

**Estimated cost:** ~$15-30/month (staging at scale-to-zero is nearly free)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the complete step-by-step guide including Workload Identity Federation setup, Cloud SQL configuration, and secret management.

### Option 2: Docker (Self-hosted / Any Cloud)

A production-ready multi-stage Dockerfile is included. Deploy to any platform that runs Docker containers (AWS ECS, Azure Container Apps, DigitalOcean App Platform, etc).

```bash
# Build the image
docker build -t nobrainy .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/nobrainy" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  nobrainy
```

Or use `docker-compose.prod.yml` for a full stack (app + PostgreSQL):

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Railway

Simple alternative with managed PostgreSQL:

1. Go to [railway.app](https://railway.app), create a project
2. Add PostgreSQL service + GitHub repo
3. Set environment variables, deploy

### Database

All options require PostgreSQL 16+. For GCP, use Cloud SQL (set up by `setup-gcp.sh`). For other deployments:

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [Neon](https://neon.tech) | 0.5 GB | Serverless Postgres |
| [Supabase](https://supabase.com) | 500 MB | Postgres + extras |
| [Railway](https://railway.app) | $5 credit | Simple, integrated |

After connecting your database:

```bash
pnpm db:migrate
```

## License

Private / TBD
