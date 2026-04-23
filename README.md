# NoBrainy

> Personal Productivity & Learning Operating System

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE)

NoBrainy is a unified platform for thinking, learning, and execution. It combines notes, tasks, book summaries, flashcards, expense tracking, daily planning, goal tracking, and reviews into a single connected system built around the loop: **Capture, Organize, Plan, Execute, Learn, Reflect, Improve.**

Designed for developers, product thinkers, and knowledge workers who want one coherent system instead of multiple disconnected tools. Everything is Markdown-first, cross-linked, and designed for minimal friction.

## Features

### Notes
Full Markdown editor with live split-pane preview (resizable divider), syntax-highlighted code blocks, Mermaid.js diagram rendering, GFM support (tables, checkboxes, strikethrough), `[[wiki-links]]` for bi-directional linking with graph view, multi-tag filtering, full-text search, pinning, and soft delete with recovery. Additional features:
- **Slash commands** — type `/` for 20+ commands: headings, lists, code blocks, tables, links, color blocks, dates
- **`/link`** — search and link to other notes (creates graph connections)
- **`/url`** — insert external website links
- **Color blocks** — `:::blue ... :::` for colored background sections (7 colors)
- **Inline colors** — `{red}text{/red}` for colored text
- **Keyboard shortcuts** — Cmd+B/I/U for bold/italic/underline, Cmd+F/H for find/replace
- **Fullscreen mode** — distraction-free writing
- **Scroll sync** — lock editor and preview scroll together
- **Print / Export** — print with optional color toggle, export as .doc

### Tasks
Eisenhower Matrix four-quadrant view, nested subtasks, recurring tasks (RRULE-based), priority levels (Urgent / High / Medium / Low), status tracking, due dates, tag filtering, bulk actions (complete, delete, reprioritize), drag-and-drop reordering, and goal linking. Completed tasks hidden by default with toggle. Sort by priority, due date, or creation date.

### Books
Reading tracker with status management (Want to Read / Reading / Completed), structured fields for summaries, key ideas, favourite quotes, personal learnings, and application notes. Star ratings (1-5), page progress tracking, and Markdown formatting throughout.

### Flashcards
Deck-based flashcard management with SM-2 spaced repetition algorithm. Card types include Q&A, Cloze, Definition, Reflection, and Application. Review mode with difficulty rating (Easy / Medium / Hard / Forgot), automatic scheduling, review session tracking, quiz mode with scoring, and source linking back to notes and books.

### Expense Manager
Full expense tracking with 23+ preset categories (Shopping, Food, EMI, Travel, etc.) plus custom categories with icon and color picker. Features include:
- **Bulk entry** — spreadsheet-style UI with auto-growing rows for fast data entry
- **CSV/TXT import** — import bank statements or SMS transaction exports with auto-categorization (150+ keyword rules)
- **Monthly summary matrix** — category-by-month grid with totals
- **Interactive charts** — monthly bar chart (clickable), category donut, trend lines, top categories
- **AI analysis** — GPT-powered spending insights on the Charts tab
- **Bulk category change** — select multiple transactions and reassign categories
- **Indian Rupee formatting** — ₹1,23,456 number system
- **Filters & sorting** — by date range, category, tags, amount, name

### Daily Planner
Today view with focus task selection (top 3), time blocking, daily task carry-forward for incomplete items, and progress indicators.

### Reviews
Daily and weekly reflection system with guided prompts. Auto-aggregated statistics for tasks completed, tasks missed, notes created, and cards reviewed. Mood tracking and weekly summary views.

### Goals
Goal creation with categories (fitness, learning, work, personal), target dates, and status tracking. Goals link to tasks — progress tracked as completed tasks / total tasks. Auto-completion when all linked tasks are done.

### Bookmarks
Save and organize web links with tags, descriptions, and favicons. Features include:
- **Preview panel** — click a bookmark to preview the site in a side panel (iframe)
- **Search & filter** — by title, tags
- **Pin** important bookmarks
- **Edit inline** — update title, URL, description, tags

### Watchlist (Movies & Shows)
Track movies and TV shows with genre, rating, platform, and status. Features include:
- **IMDB/Google CSV import** — import your existing watchlist with auto-categorization
- **OMDB metadata fetch** — auto-fill posters, genres, directors, plots from OMDB API
- **Star ratings** — 1-5 clickable stars
- **Tabs** — All / Movies / Shows with genre and status filters
- **Bulk metadata update** — fetch details for all new items at once

### Analytics
Dashboard with completion rate charts, productivity breakdowns, activity heatmap, stat cards, and integrated expense analytics (category donut + monthly spending bars).

### AI Features (BYOK — Bring Your Own Key)
Connect your OpenAI API key to unlock:
- **Flashcard generation** from notes and books
- **Note summarization** and key insight extraction
- **Task prioritization** and daily plan suggestions
- **Expense analysis** with spending pattern detection
- **Smart insights** across all modules with selectable date range and module picker
- **Daily review summaries** with mood analysis
- **Auto-categorization** of imported expenses

### Global Search
Universal full-text search across notes, tasks, books, flashcards, and all other modules. Keyword-based search powered by PostgreSQL tsvector with GIN indexes.

### Quick Capture
Global `Cmd+K` / `Ctrl+K` modal for fast input. Quickly create notes, tasks, or ideas without navigating away from the current view.

### Cross-Module Linking
Connect notes to tasks, books to flashcard decks, tasks to goals, and more. Link picker modal for easy cross-referencing.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS 3, shadcn/ui |
| Design | Space Grotesk + Space Mono + Inter fonts, retro design system |
| Charts | Recharts |
| Editor | CodeMirror 6, react-markdown, remark-gfm, rehype-highlight, Mermaid.js |
| State | Zustand (client UI state), TanStack React Query v5 (server state) |
| Backend | Next.js API Route Handlers |
| Database | PostgreSQL 16, Prisma ORM 5 |
| Auth | NextAuth.js v5 (email/password + Google OAuth) |
| AI | OpenAI API (GPT-4o-mini / GPT-4o) — user's own key |
| Validation | Zod |
| Testing | Vitest, React Testing Library |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16+

### Installation

```bash
git clone https://github.com/pranavlpin/no-brainy.git
cd no-brainy
pnpm install
```

### Quick Start

```bash
cp .env.example .env
# Edit .env with your database URL and secrets

npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npx prisma db seed             # Seed test data (optional)
pnpm dev                       # Start dev server at localhost:3000
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL (e.g., `http://localhost:3000`) | Yes |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Optional |
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID | Optional |
| `OMDB_API_KEY` | OMDB API key for movie/show metadata ([free](https://www.omdbapi.com/apikey.aspx)) | Optional |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (dashboard)/         # All authenticated module pages
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── books/           # Book list and detail
│   │   ├── expenses/        # Expense manager (create, list, summary, charts, categories)
│   │   ├── flashcards/      # Deck list, detail, and review mode
│   │   ├── bookmarks/       # Bookmark manager with preview panel
│   │   ├── goals/           # Goals with task-driven progress
│   │   ├── insights/        # AI-powered insights with module selector
│   │   ├── notes/           # Note list and detail
│   │   ├── planner/         # Daily planner
│   │   ├── reviews/         # Daily and weekly reviews
│   │   ├── search/          # Global search
│   │   ├── settings/        # User settings (API key, sidebar order, preferences)
│   │   ├── tasks/           # Task list and detail
│   │   └── watchlist/       # Movies & shows tracker with IMDB import
│   └── api/                 # API route handlers
├── components/
│   ├── expenses/            # Expense UI (form, list, matrix, charts, import wizard, AI panel)
│   ├── ui/                  # Shared primitives (button, input, select, dialog)
│   └── [module]/            # Module-specific components
├── hooks/                   # React Query hooks per module
├── lib/
│   ├── ai/                  # OpenAI integration, prompts, middleware
│   ├── expenses/            # CSV/TXT parser, category matcher, formatters
│   ├── types/               # TypeScript interfaces per module
│   └── validations/         # Zod schemas per module
└── stores/                  # Zustand stores
```

## Database Schema

PostgreSQL 16 with Prisma ORM. 18 models total.

| Model | Description |
|-------|-------------|
| `User` | Accounts with email, OAuth, timezone, encrypted preferences |
| `Note` / `NoteLink` | Markdown notes with tags, pinning, bi-directional links, graph view |
| `Task` / `TaskLink` | Tasks with priority, Eisenhower quadrant, subtasks, recurrence |
| `Book` | Reading tracker with summaries, quotes, ratings, progress |
| `Deck` / `Flashcard` | Flashcard decks with SM-2 spaced repetition |
| `DayPlan` | Daily plans with focus tasks and time blocks |
| `DailyReview` | Daily reflections with auto-aggregated stats and mood |
| `Goal` | Goal tracking with task-driven progress |
| `Bookmark` | Saved web links with tags, favicon, pin support |
| `WatchlistItem` | Movies/shows with genre, rating, status, OMDB metadata |
| `ExpenseCategory` / `Expense` | Expense tracking with categories, import, charts |
| `Insight` | AI-generated insights with type, severity, expiration |
| `Notification` / `PushSubscription` | In-app and push notifications |

## Deployment

NoBrainy deploys to **GCP Cloud Run** with automated CI/CD via GitHub Actions.

### First-Time GCP Setup

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
./scripts/setup-gcp.sh
```

### Deploy

```bash
# Manual deploy
NEXT_PUBLIC_GA_ID=G-XXXXX ./scripts/deploy.sh production

# Or via GitHub Actions (push to main)
git push origin main
```

### Self-Hosted (Docker)

```bash
docker build -t nobrainy .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/nobrainy" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  nobrainy
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR guidelines.

## TODO

- [ ] Dark mode support (CSS variables defined, `dark:` classes in components — needs `next-themes` + toggle)
- [ ] Multi-theme support (retro, modern, business — [assessment](docs/MODULAR_ARCHITECTURE_SPEC.md))
- [ ] Localisation / i18n (extract strings, Crowdin for community translations)
- [ ] Modular plugin architecture ([spec](docs/MODULAR_ARCHITECTURE_SPEC.md))
- [ ] Stability & UI polish ([sprint plan](docs/STABILITY_SPRINTS.md))

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

You are free to fork, modify, and distribute this software under the same license. Attribution to the original project is required.
