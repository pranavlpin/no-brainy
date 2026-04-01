# 🏢 AI Software Agency — Project Guidelines

## Overview
This is a multi-agent software development workspace. A human **Project Lead** (you) manages a team of specialized AI agents through Claude Code. All agents must follow these guidelines.

---

## 🏗️ Architecture & Tech Stack
<!-- Customize this section per project -->
- **Frontend**: React 18+ / Next.js 14 (App Router) / TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Backend**: Next.js API Routes / Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Package Manager**: pnpm

---

## 📐 Coding Standards

### TypeScript
- Strict mode enabled — no `any` types
- All functions must have explicit return types
- Interfaces preferred over type aliases for object shapes
- Use `const` assertions and discriminated unions where appropriate

### React
- Functional components only
- Custom hooks for shared logic (prefix with `use`)
- Co-locate component, styles, tests, and types
- Props interfaces named `{ComponentName}Props`

### Naming Conventions
- **Files**: `kebab-case.ts` / `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Database tables**: `snake_case`

### Git Conventions
- Branch naming: `agent/<agent-name>/<task-short-description>`
- Commit messages: `<type>(<scope>): <description>` (conventional commits)
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Each agent works on its own branch — **never push directly to main**

---

## 🔒 Agent Rules (ALL AGENTS MUST FOLLOW)

1. **Never merge to main** — only the Project Lead merges
2. **Create a feature branch** before making any changes
3. **Write tests** for all new functionality
4. **Document your changes** — update relevant docs or add JSDoc
5. **Post a summary** when your task is complete (what changed, what to review)
6. **Ask the Lead** before modifying shared modules (`lib/`, `utils/`, `config/`)
7. **Run linting and type checks** before marking a task done
8. **Keep changes focused** — one task per branch, no scope creep

---

## 📁 Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth-related routes
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Reusable UI primitives (shadcn)
│   └── features/           # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Shared utilities (⚠️ needs Lead approval)
├── stores/                 # Zustand stores
├── types/                  # Shared TypeScript types
└── tests/
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── e2e/                # Playwright E2E tests
```

---

## 🔔 Notifications
Agents should notify the Lead via Slack webhook when:
- ✅ A task is completed
- 🚫 A blocker is encountered
- 📋 A plan is ready for approval
- ⚠️ An architectural decision needs input

Use the `notify-slack.sh` script: `./scripts/notify-slack.sh "Your message here" "emoji"`

---

## 📝 Task Workflow
1. Lead creates a task with requirements
2. Agent claims the task
3. Agent submits a **plan** (for non-trivial tasks)
4. Lead **approves** the plan
5. Agent implements on a feature branch
6. Agent runs tests + linting
7. Agent posts a completion summary
8. Lead reviews and merges
