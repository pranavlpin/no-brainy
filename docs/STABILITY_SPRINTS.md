# Stability & UI Polish — Sprint Plan

**Date:** 2026-04-09
**Goal:** Make the current version production-stable and visually polished
**Approach:** Frontend and Backend agents work in parallel with no cross-dependencies

---

## Sprint 1: Error Handling & Logging (Backend)  |  Toast Notifications (Frontend)

### Backend Agent — Error Handling & API Logging

**Branch:** `agent/backend/error-handling`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add `console.error` logging to all API catch blocks missing it | `src/app/api/notes/route.ts`, `src/app/api/tasks/route.ts`, `src/app/api/books/route.ts`, `src/app/api/books/[id]/route.ts`, `src/app/api/goals/route.ts`, `src/app/api/decks/route.ts`, `src/app/api/decks/[id]/route.ts`, `src/app/api/habits/route.ts`, `src/app/api/quiz-sessions/[id]/answer/route.ts` | 1h |
| 2 | Fix unsafe `as unknown as any` type cast in quiz-sessions | `src/app/api/quiz-sessions/[id]/answer/route.ts:64` | 0.5h |
| 3 | Add structured error logging helper (route name + method + userId) | Create `src/lib/api-error.ts` with `logApiError(routeName, error)` helper | 1h |
| 4 | Migrate all catch blocks to use the new helper | All API routes under `src/app/api/` | 2h |

**Sprint 1 Backend Total: ~4.5h**

---

### Frontend Agent — Toast Notifications

**Branch:** `agent/frontend/toast-notifications`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add toast on expense create/update/delete success | `src/app/(dashboard)/expenses/page.tsx` | 0.5h |
| 2 | Add toast on task create success | `src/app/(dashboard)/tasks/page.tsx` | 0.5h |
| 3 | Add toast on note create/delete success | `src/app/(dashboard)/notes/page.tsx` | 0.5h |
| 4 | Add toast on book create/update/delete success | `src/app/(dashboard)/books/page.tsx`, `src/app/(dashboard)/books/[id]/page.tsx` | 0.5h |
| 5 | Add toast on goal/habit create/update/delete | `src/app/(dashboard)/goals/page.tsx` | 0.5h |
| 6 | Add toast on bulk expense save and import complete | `src/components/expenses/expense-bulk-entry.tsx`, `src/components/expenses/expense-import-wizard.tsx` | 0.5h |
| 7 | Add toast on category create/update/delete | `src/app/(dashboard)/expenses/categories/page.tsx` | 0.5h |
| 8 | Add error toast on mutation failures (generic `onError` in hooks) | `src/hooks/use-expenses.ts`, `src/hooks/use-tasks.ts`, etc. | 1h |

**Sprint 1 Frontend Total: ~4.5h**

---

## Sprint 2: Loading Skeletons (Frontend)  |  Settings Page Cleanup (Frontend Agent 2)

### Frontend Agent — Loading Skeletons & Empty States

**Branch:** `agent/frontend/loading-states`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Replace "Loading..." text in settings page with skeleton | `src/app/(dashboard)/settings/page.tsx` | 0.5h |
| 2 | Replace "Loading..." in notification panel with skeleton | `src/components/notifications/notification-panel.tsx` | 0.5h |
| 3 | Replace "Loading..." in expense analytics with skeleton | `src/components/analytics/expense-analytics.tsx` | 0.5h |
| 4 | Replace "Loading summary..." in expense matrix with skeleton | `src/components/expenses/expense-matrix.tsx` | 0.5h |
| 5 | Replace "Loading charts..." in expense-charts with skeleton | `src/components/expenses/expense-charts.tsx` | 0.5h |
| 6 | Add loading skeleton to expense bulk entry (categories loading) | `src/components/expenses/expense-bulk-entry.tsx` | 0.5h |
| 7 | Audit and fix any remaining "Loading..." text across all pages | All `src/app/(dashboard)/*/page.tsx` | 1h |

**Sprint 2 Loading Total: ~4h**

---

### Frontend Agent 2 — Settings Page & UI Consistency

**Branch:** `agent/frontend/ui-consistency`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Replace hardcoded `gray-*` colors in settings page with design tokens | `src/app/(dashboard)/settings/page.tsx` | 1.5h |
| 2 | Standardize header patterns across all pages (h1 + optional subtitle) | `src/app/(dashboard)/goals/page.tsx` and others with inconsistent headers | 1h |
| 3 | Replace hardcoded `bg-black/50` in import wizard with theme-aware overlay | `src/components/expenses/expense-import-wizard.tsx` | 0.5h |
| 4 | Ensure all modals/dialogs use consistent backdrop pattern | All dialog/modal components | 0.5h |

**Sprint 2 UI Consistency Total: ~3.5h**

---

## Sprint 3: Error Boundaries (Frontend)  |  API Validation Hardening (Backend)

### Frontend Agent — Error Boundaries & Resilience

**Branch:** `agent/frontend/error-boundaries`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Create a reusable ErrorBoundary component | Create `src/components/ui/error-boundary.tsx` | 1h |
| 2 | Create an error fallback UI (friendly error page with retry) | Create `src/components/ui/error-fallback.tsx` | 0.5h |
| 3 | Add global error boundary in dashboard layout | `src/app/(dashboard)/layout.tsx` | 0.5h |
| 4 | Add per-module error boundaries for chart components (Recharts can crash) | `src/components/expenses/expense-charts.tsx`, `src/components/analytics/expense-analytics.tsx` | 1h |
| 5 | Add `error.tsx` files for Next.js route-level error handling | Create `src/app/(dashboard)/expenses/error.tsx`, `src/app/(dashboard)/analytics/error.tsx`, etc. | 1.5h |

**Sprint 3 Frontend Total: ~4.5h**

---

### Backend Agent — API Validation & Edge Cases

**Branch:** `agent/backend/validation-hardening`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add pagination limits validation (prevent pageSize > 100) to all list endpoints | All `route.ts` with GET list handlers | 1h |
| 2 | Add date validation (reject future dates, invalid ranges) to expense routes | `src/app/api/expenses/route.ts`, `src/app/api/expenses/summary/route.ts` | 1h |
| 3 | Add import deduplication check (skip rows with matching importRef) | `src/app/api/expenses/import/confirm/route.ts` | 1h |
| 4 | Add rate limiting awareness (return 429 if Prisma connection pool exhausted) | `src/lib/prisma.ts` — add connection error handling | 1h |
| 5 | Validate category ownership on expense create/update (prevent cross-user category access) | `src/app/api/expenses/route.ts`, `src/app/api/expenses/[id]/route.ts` — already done, verify bulk route | 0.5h |

**Sprint 3 Backend Total: ~4.5h**

---

## Sprint 4: Visual Polish (Frontend)  |  Performance (Backend)

### Frontend Agent — Visual Polish & Micro-interactions

**Branch:** `agent/frontend/visual-polish`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add smooth transitions to tab switches (fade or slide) | `src/app/(dashboard)/expenses/page.tsx` | 1h |
| 2 | Add hover effects to expense matrix cells (highlight row+column) | `src/components/expenses/expense-matrix.tsx` | 1h |
| 3 | Add number animation to stat cards (count up effect) | `src/components/expenses/expense-charts.tsx` stat cards | 1.5h |
| 4 | Add success animation to bulk entry save (checkmark + row clear) | `src/components/expenses/expense-bulk-entry.tsx` | 1h |
| 5 | Polish the expense category cards (hover lift, shadow transitions) | `src/app/(dashboard)/expenses/categories/page.tsx` | 0.5h |
| 6 | Add keyboard shortcuts hint on bulk entry (Cmd+S to save) | `src/components/expenses/expense-bulk-entry.tsx` | 0.5h |
| 7 | Improve empty chart states (illustration or icon instead of text) | All chart components in `src/components/expenses/charts/` | 1h |

**Sprint 4 Frontend Total: ~6.5h**

---

### Backend Agent — Performance & Caching

**Branch:** `agent/backend/performance`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add database query optimization — select only needed fields in list endpoints | `src/app/api/expenses/route.ts`, `src/app/api/tasks/route.ts`, `src/app/api/notes/route.ts` | 1.5h |
| 2 | Add response caching headers for summary/trends/stats endpoints | `src/app/api/expenses/summary/route.ts`, `src/app/api/expenses/trends/route.ts`, `src/app/api/expenses/stats/route.ts` | 1h |
| 3 | Optimize expense summary query (single raw query instead of groupBy + separate query) | `src/app/api/expenses/summary/route.ts` | 1.5h |
| 4 | Add database indexes for common query patterns if missing | `prisma/schema.prisma` — verify all indexed fields | 1h |
| 5 | Optimize analytics endpoint (parallel queries with Promise.all) | `src/app/api/analytics/route.ts` | 1h |

**Sprint 4 Backend Total: ~6h**

---

## Sprint 5: Homepage & Landing Polish (Frontend)  |  Deploy Script Improvements (Backend)

### Frontend Agent — Homepage & Auth Pages Polish

**Branch:** `agent/frontend/landing-polish`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Add subtle animations to homepage hero (fade in on load) | `src/app/page.tsx` | 1h |
| 2 | Add feature card hover animations (icon bounce or color shift) | `src/app/page.tsx` | 1h |
| 3 | Polish login/register pages (consistent design with homepage) | `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx` | 2h |
| 4 | Add favicon to all pages and social meta tags (og:image, description) | `src/app/layout.tsx` | 1h |
| 5 | Add a simple footer to dashboard pages | `src/app/(dashboard)/layout.tsx` or `src/components/layout/app-shell.tsx` | 0.5h |

**Sprint 5 Frontend Total: ~5.5h**

---

### Backend Agent — Deploy & DevOps

**Branch:** `agent/backend/deploy-improvements`

| # | Task | Files | Est |
|---|------|-------|-----|
| 1 | Fix deploy.sh to handle first-time migration job creation properly | `scripts/deploy.sh` — improve create-or-update logic | 1h |
| 2 | Add health check endpoint | Create `src/app/api/health/route.ts` — returns DB status + version | 1h |
| 3 | Add seed script for development (creates test user + sample data) | Create `prisma/seed.ts` improvements | 2h |
| 4 | Add environment variable validation on startup | Create `src/lib/env.ts` with Zod schema for required env vars | 1h |

**Sprint 5 Backend Total: ~5h**

---

## Summary

| Sprint | Backend | Frontend | Parallel? |
|--------|---------|----------|-----------|
| **1** | Error handling & logging (4.5h) | Toast notifications (4.5h) | Yes |
| **2** | — | Loading skeletons (4h) + UI consistency (3.5h) | Two frontend agents |
| **3** | API validation hardening (4.5h) | Error boundaries (4.5h) | Yes |
| **4** | Performance & caching (6h) | Visual polish & animations (6.5h) | Yes |
| **5** | Deploy & DevOps (5h) | Homepage & auth polish (5.5h) | Yes |

**Total: ~54h across 5 sprints**
**All sprints have zero cross-dependencies between frontend and backend tasks.**

---

## Agent Assignment Rules

- Each agent creates its own feature branch per the naming convention: `agent/<role>/<task-description>`
- Agents must NOT modify files the other agent is modifying in the same sprint
- Both agents run `npx tsc --noEmit` and `npx next lint` before marking tasks done
- Lead (you) reviews and merges after each sprint
