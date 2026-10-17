# T01 — Governance, test layout, formatting gates

**Module:** platform · **Date:** 2026-10-16 · **Branch:** `feature/platform-daily-loop-overhaul` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md)

## Summary

Adopt the repository workflow the owner supplied (adapted from their Flutter project) and make the gates it requires actually runnable here: `CLAUDE.md` and `AGENTS.md`, append-only ledgers, per-task plans, section test plans, a `tests/` tree organized by type and module, Prettier formatting, and a `typecheck` script.

## Predecessors

None. This is new governance; no earlier plan exists in this repository.

## Scope and affected files

- `CLAUDE.md`, `AGENTS.md` (new, identical content)
- `docs/tasks/*.md`, `docs/plans/**`, `docs/test-plans/*.md` (new)
- `.gitignore` adds `/evidences/`
- `vitest.config.ts`: include `tests/**/*.test.{ts,tsx}`; keep jsdom and the `@/` alias; add a setup file for Testing Library matchers
- `package.json`: add `format`, `format:check`, `typecheck` scripts; add `prettier` and `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` as dev dependencies (component tests need them; the README lists RTL but it is not installed)
- Move the three existing test files from `src/` into `tests/unit/<module>/` without changing their assertions
- `.prettierrc` with the project's existing style (no semicolons, single quotes, 2 spaces, trailing commas es5, print width 100)

## Dependencies

Dev dependencies only: `prettier`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`. Pre-approved by the 2026-10-16 owner ruling; landed in their own commit.

## Data model / state changes

None.

## UI/UX

None.

## Test-id strategy and accessibility

Not applicable; this task adds no UI. It establishes the `data-testid` convention in `CLAUDE.md` §5a that later tasks follow.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T01. The TDD artifact for this task is the relocated test suite running green from its new location plus a smoke test proving the Testing Library setup renders a component.

## Risks and open questions

- Prettier will reformat files it touches; to keep the diff reviewable, formatting runs only on files changed by each task, not the whole repo. **Ruling applied:** repo-wide formatting is deferred to a later dedicated task.
- `next lint` currently reports 5 pre-existing warnings (`<img>` usage, one `useMemo` dependency). **Ruling applied:** they are outside this batch's scope; the zero-warning gate applies to files touched by batch tasks, and a follow-up task is listed in the backlog if they are to be cleared.
