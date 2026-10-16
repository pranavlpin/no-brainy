# Design task ledger

## NB-04 — Personal workspace design and navigation

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `feature/design-personal-workspace`.
- Target/base: `bugfix/tasks-persistence-and-discovery`, `dd6efca36b1e458dc8f0f75e438fad41d3302f4a`.
- Approved plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/design/personal-workspace.md).
- Approval: Owner's 2026-10-16 “approved.” message covering the written rebuild package.
- Status: IMPLEMENTED AND VERIFIED locally; global zero-warning gate remains open for four inherited NB-12 image warnings.
- Scope: Semantic appearance/motion, accessible dialogs, responsive navigation, preference migration and working startup.
- Inherited failure: NB-03 real browser journey exposed the existing root-head hydration mismatch and navigation removeChild error. Root font/head and shell fixes belong to this approved design scope. Its persistence browser assertion remains a required gate here.
- Staging decision: Until later module routes exist, navigation uses working planner, tasks, goals and library destinations. Inbox/Projects/Growth/Today destinations are activated by their approved module tasks; no dead destination will be added.
- Results: Red tests reproduced missing dialog semantics/focus, inaccessible capture, omitted Flashcards, malformed preference crashes, unprotected legacy page routes, missing shell behavior and unannounced toast feedback. New shared-state tests first exposed the absent module, then confirmed behavioral red against compile-only empty exports before implementation.
- Green: `npm test` (23 Node + 45 Vitest tests), `npm run test:integration` (6), `npm run test:e2e` (4), `npm run typecheck`, `npm run format:check`, `npm run build`, `git diff --check`.
- Browser: 360/768/1440 px without document overflow, visible capture, focus-safe dialog, light/dark reload persistence, reduced motion, normal auth, protected legacy destinations and working Today/Library/Goals/Flashcards. Browser page-error collection was empty. Navigation timing was collected through Playwright. Screenshots/video/traces remain off.
- Startup correction: remove duplicate root route re-export and hand head composition to Next; remove remote font requirements and hydrate UI preferences after matching initial markup. This resolves the NB-03 hydration/removeChild browser failure; its persistence journey now passes unchanged.
- Appearance: semantic warm/teal surfaces, soft elevation, theme-aware controls, system fonts, CSS page/panel transitions with reduced-motion fallback. Saved presets/custom palettes and valid hidden/reordered legacy navigation remain available.
- Routing: `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/today/page.tsx` temporarily renders the existing planner until NB-07; `/Users/pranav/Pranav_projects/github/no-brainy/src/app/(dashboard)/library/page.tsx` links the existing tools. New Inbox/Projects/Growth routes activate in their own tasks.
- Evidence: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/design/personal-workspace/` (ignored). No packages, schema changes, push, PR, review or deployment.
