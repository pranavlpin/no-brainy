# T18 — Projects with outcome, next action, linked tasks and notes

**Module:** projects · **Date:** 2026-10-16 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/projects.md](../../tasks/projects.md) · **Package:** [acceptance-branch-adoption.md](../product/acceptance-branch-adoption.md)

## Summary

A project is an outcome with one explicit next action, its tasks, and supporting notes, optionally linked to a goal. This is the layer between goals and tasks that the owner currently keeps in a hand-written HTML tracker.

## Predecessors

None in this repository. Ported, credited: the `Project` / `ProjectNote` model and pages from `test/product-final-acceptance` (NB-05), re-implemented on this branch's primitives.

## Scope and affected files

- `prisma/schema.prisma`: `Project`, `ProjectNote`, `Task.projectId`; migration `add_projects`
- `src/lib/validations/projects.ts`, `src/lib/types/projects.ts`
- `src/app/api/projects/route.ts`, `[id]/route.ts`, `[id]/actions/route.ts` (idempotent add action)
- `src/hooks/use-projects.ts`
- `src/components/projects/project-form.tsx`, `src/app/(dashboard)/projects/page.tsx`, `[id]/page.tsx`
- `src/components/tasks/task-planning-fields.tsx` (project select), `src/lib/nav/items.ts` (Do group), breadcrumbs title
- `src/components/planner/focus-tasks.tsx` (project chip alongside goal chip)

## Data model / state changes

New tables `projects`, `project_notes`; nullable `tasks.projectId`. Archiving keeps history; deleting is not offered in this task.

## UI/UX

Cards with progress and "Next:" line; detail with a next-step hero, add-action input, existing-action select, task list, and note linking. Cards use the glass surface and stagger in.

## Test-id strategy and accessibility

`project-${id}`, `project-next-action`, `project-add-action`, `project-note-${id}`.

## Test plan

[docs/test-plans/projects.md](../../test-plans/projects.md) §T18.

## Risks and open questions

- A next action must belong to the project and the owner; the route rejects anything else with 400. **Ruling applied.**

## Refinements (while the branch was open)

- A finished next action reads as "none chosen" in the API (`nextAction` null) so cards never point at a completed task; a focus session that completes the next action also clears it, and a next action typed at the end of a session becomes the project's next step when it has none.
- The add-action task id is derived from owner, project, and submission id, so a retried submission returns the existing task.
- Inbox processing accepts `projectId`: a task joins the project (and becomes its next action if empty), a note links to it; a foreign project is a 400.
- The task planning fields gained a Project select, so a task can join a project from the create form, the detail page, and the Inbox.
- Focus tasks show a project chip next to the goal chip; the planner fetches active projects for the lookup.
- `g j` jumps to Projects.
