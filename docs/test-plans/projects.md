# projects — test plan

## T18 — Projects

- Integration: create/list/update projects for the owner only; `POST /api/projects/[id]/actions` with the same `submissionId` creates one task; setting `nextActionId` to a task outside the project returns 400.
- Component: `ProjectForm` validates a title; the projects page renders cards with progress and the next action.
