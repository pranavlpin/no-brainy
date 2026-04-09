# Future Plan: Modular Plugin Architecture for NoBrainy

**Version:** 1.0
**Date:** 2026-04-09
**Status:** Planned (Future)
**Priority:** After stabilization and UI polish

---

## Context

NoBrainy has grown into a hub of 12+ "mini apps" (Tasks, Notes, Expenses, Habits, etc.) that are already well-isolated at the component/API level but have hardcoded integration points (sidebar, search, quick capture, analytics, AI insights). The goal is to introduce a **module registry system** so that a developer can create a new module by following a standard structure and registering a manifest — the module then automatically integrates with the sidebar, search, analytics, and other platform features.

This is NOT dynamic plugin loading — it's config-driven modularity using static imports, which works naturally with Next.js App Router and tree-shaking.

---

## Current State (as of April 2026)

### Already Modular
- **Components**: Zero cross-module imports between mini-apps
- **API routes**: All follow the same pattern (withAuth middleware, Zod validation, Prisma)
- **Types/validations**: Isolated per module (`lib/types/X.ts`, `lib/validations/X.ts`)
- **Layout/Providers**: Generic wrapping (SessionProvider, QueryClientProvider)
- **DB schema**: Flexible linking via `targetType` + `targetId` strings

### Needs Refactoring
- Sidebar nav: hardcoded array in `sidebar.tsx`
- Quick Capture modal: hardcoded `useCreateNote` + `useCreateTask`
- Search: hardcoded `Promise.all` across entities in `/api/search/route.ts`
- AI Insights: hardcoded aggregation in `lib/ai/insights/aggregate-user-data.ts`
- Link types: hardcoded `VALID_LINKED_TYPES`
- Analytics page: hardcoded module sections

---

## Architecture Overview

```
src/lib/modules/types.ts           ← ModuleManifest interface (the contract)
src/lib/modules/registry.ts        ← Central registry (array of manifests + accessor fns)
src/modules/<module>/manifest.ts   ← Each module's registration
```

Platform features (sidebar, search, etc.) read from the registry instead of hardcoding module knowledge.

---

## Module Manifest Interface

```typescript
interface ModuleManifest {
  id: string              // unique slug: 'expenses', 'tasks', etc.
  name: string            // display name: 'Expenses', 'Tasks'
  description?: string

  // Optional capabilities — a module only implements what it needs
  nav?: {
    label: string
    href: string
    icon: LucideIcon
    order?: number        // lower = higher in sidebar
  }

  search?: {
    entityType: string
    search(params: {
      prisma: PrismaClient
      userId: string
      query: string
      limit: number
    }): Promise<Array<{ id: string; title: string; content: string; tags: string[]; updatedAt: Date }>>
  }

  quickCapture?: {
    type: string
    label: string
    color: string
    FieldsComponent?: React.ComponentType   // type-specific fields
    useMutation(): { mutateAsync: Function; isPending: boolean }
  }

  insights?: {
    key: string
    aggregate(params: {
      prisma: PrismaClient
      userId: string
      since: Date
    }): Promise<Record<string, unknown>>
  }

  linkTarget?: {
    entityType: string
    resolvePreview(params): Promise<{ title: string } | null>
    verifyOwnership(params): Promise<boolean>
  }

  analyticsWidgets?: Array<{
    key: string
    label: string
    Component: React.ComponentType
    colSpan?: 1 | 2
    order?: number
  }>
}
```

---

## Implementation Phases

### Phase 1: Foundation — Registry + Sidebar

**New files:**
- `src/lib/modules/types.ts` — all TypeScript interfaces
- `src/lib/modules/registry.ts` — central registry with accessor functions
- `src/modules/*/manifest.ts` — one per existing module (13 modules), starting with `nav` field only
- Add `@/modules/*` path alias to `tsconfig.json`

**Modify:**
- `src/components/layout/sidebar.tsx` — replace hardcoded `navItems` with `getNavItems()` from registry

### Phase 2: Search Integration

**Add `search` field** to manifests for: notes, tasks, books, flashcards, decks, expenses, goals, habits

**Modify:**
- `src/app/api/search/route.ts` — replace per-module Prisma queries with loop over `getSearchProviders()`
- `src/lib/types/search.ts` — change `SearchEntityType` to `string`
- `src/lib/validations/search.ts` — derive valid types from registry

### Phase 3: Quick Capture

**Add `quickCapture` field** to manifests for: notes, tasks

**Modify:**
- `src/components/quick-capture/quick-capture-modal.tsx` — replace hardcoded note/task toggle with `getQuickCaptureActions()`

### Phase 4: Analytics Dashboard Widgets

**Add `analyticsWidgets`** to manifests for: expenses, insights

**Modify:**
- `src/app/(dashboard)/analytics/page.tsx` — render dynamic widgets from `getAnalyticsWidgets()`

### Phase 5: AI Insights Aggregation

**Add `insights` field** to manifests for: tasks, notes, flashcards, habits

**Modify:**
- `src/lib/ai/insights/aggregate-user-data.ts` — replace hardcoded queries with `getInsightsProviders()`

### Phase 6: Cross-module Linking

**Add `linkTarget` field** to manifests for: notes, books

**Modify:**
- `src/app/api/tasks/[id]/links/route.ts` — replace `VALID_LINKED_TYPES` with `getLinkTargets()`
- `src/app/api/notes/[id]/links/route.ts` — same treatment

---

## Example: Adding a New "Journal" Module

A developer would:

1. Add `JournalEntry` model to `prisma/schema.prisma`
2. Create `src/lib/types/journal.ts`, `src/lib/validations/journal.ts`
3. Create `src/app/api/journal/route.ts` (CRUD)
4. Create `src/hooks/use-journal.ts`
5. Create `src/components/journal/` (UI components)
6. Create `src/app/(dashboard)/journal/page.tsx`
7. Create `src/modules/journal/manifest.ts` with desired capabilities
8. Add one import + one array entry in `registry.ts`

Steps 1-6 follow existing patterns already established. Steps 7-8 are the new parts that auto-integrate with the platform.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Static imports, not dynamic | Works with Next.js tree-shaking, no custom webpack |
| Prisma passed as parameter | Keeps manifests testable, avoids circular imports |
| String entity types | TypeScript can't derive unions from runtime arrays |
| Routes stay in `src/app/` | Next.js App Router requires file-based routing |
| Phased rollout | Each phase independently shippable, existing modules keep working |

---

## Server/Client Boundary

Manifests contain both server functions (search, insights — use Prisma) and client references (nav icons, analytics components). Options:
- Split into `registry.ts` (server) and `registry.client.ts` (client)
- Use `next/dynamic` for Component references
- Start simple, split if bundle issues arise

---

## Estimated Effort

| Phase | Effort | Risk |
|-------|--------|------|
| 1. Registry + Sidebar | 2-3 hours | Low |
| 2. Search | 4-6 hours | Medium (largest refactor) |
| 3. Quick Capture | 2-3 hours | Low |
| 4. Analytics Widgets | 2-3 hours | Low |
| 5. AI Insights | 3-4 hours | Medium |
| 6. Cross-module Linking | 3-4 hours | Medium |
| **Total** | **~16-23 hours** | |
