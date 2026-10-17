# tasks — test plan

## T04 — Optimistic task mutations and completion motion

- Scope: unit + component.
- Unit: `patchListCaches` patches matching items across all `['tasks', *]` caches and leaves others untouched; `useUpdateTask` applies the optimistic status before the request resolves and rolls back on error (React Query test harness with a mocked `apiClient`).
- Component: `TaskList` renders `task-row-${id}`; clicking `task-toggle-${id}` flips `aria-checked` immediately; under reduced motion the completed row is removed without delay.
- Dependencies: `@tanstack/react-query` test `QueryClient`, `vi.mock('@/lib/api-client')`.
