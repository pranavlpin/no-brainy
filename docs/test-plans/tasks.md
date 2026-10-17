# tasks — test plan

## T04 — Optimistic task mutations and completion motion

- Scope: unit + component.
- Unit: `patchListCaches` patches matching items across all `['tasks', *]` caches and leaves others untouched; `useUpdateTask` applies the optimistic status before the request resolves and rolls back on error (React Query test harness with a mocked `apiClient`).
- Component: `TaskList` renders `task-row-${id}`; clicking `task-toggle-${id}` flips `aria-checked` immediately; under reduced motion the completed row is removed without delay.
- Dependencies: `@tanstack/react-query` test `QueryClient`, `vi.mock('@/lib/api-client')`.

## T14 — Planned day, planning fields, pagination, active filter, draft-save

- Scope: unit + integration + component.
- Unit: `DraftSave` merges two changes made within the delay into one save, keeps content after a failed save and retries, enters `conflict` when the remote version differs, and persists drafts to storage; `priorityRank` mapping; schemas accept `plannedDate` keys, bound `estimatedMinutes`, enumerate `effort` and `context`.
- Integration: `GET /api/tasks?status=active` queries pending and in-progress; `sortBy=priority` orders by `priorityRank`; `plannedDateFrom/To` bound the query; `PUT /api/tasks/[id]` with a stale `expectedUpdatedAt` returns 409 and does not write; priority updates set the rank.
- Component: `SaveStatus` shows each state and its recovery buttons; the tasks page renders the pagination nav with total and disables Next when there is no more.
