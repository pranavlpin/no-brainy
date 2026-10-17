# T24 — Protect Inbox and Projects, hydration-safe auth forms, honour callbackUrl

**Module:** auth · **Date:** 2026-10-17 · **Branch:** `feature/product-adoption-wave-2` · **Ledger:** [docs/tasks/auth.md](../../tasks/auth.md) · **Type:** bug fix

## Reproduction and root cause

1. Signed out, open `/inbox` or `/projects`: the page shell renders with 401s from the APIs instead of redirecting to login. `src/middleware.ts` lists every protected section by hand and the two routes added by T16 and T18 were never added.
2. On `/register` or `/login`, press Enter before React has hydrated: the browser submits the form natively as GET and the password lands in the URL (`/register?name=&email=&password=…`). Both forms rely on `onSubmit` and declare no `method`.
3. After being bounced to `/login?callbackUrl=/planner`, signing in always lands on `/` because `LoginForm` pushes `/` unconditionally.

## Predecessors

- [inbox-and-processing](../capture/inbox.md) (T16) and [projects](../projects/outcomes-and-next-action.md) (T18) added the routes; delta: they are now protected by the middleware. The auth forms predate the ledgers.

## Scope and affected files

- `src/middleware.ts`: add `/inbox/:path*` and `/projects/:path*`.
- `src/components/auth/login-form.tsx`, `register-form.tsx`: `method="post"` on the form; login reads `callbackUrl` with `useSearchParams`, accepts only same-origin paths, and pushes there after sign-in.
- `src/app/(auth)/login/page.tsx`: wrap the form in `Suspense` (required by `useSearchParams`).
- Tests: `tests/unit/auth/middleware-matcher.test.ts` (every folder under `src/app/(dashboard)` must be matched), `tests/component/auth/{login-form,register-form}.test.tsx`.

## Fix approach

Minimal. A native POST to the page route is harmless (405) and never leaks fields; the JavaScript handler still runs after hydration. Open redirects are prevented by resolving `callbackUrl` against `window.location.origin` and rejecting other origins.

## Test-id strategy and accessibility

No new UI. Forms keep their labelled controls.

## Test plan

[docs/test-plans/auth.md](../../test-plans/auth.md) §T24.

## Owner ruling applied

The platform ledger's 2026-10-17 "End-to-end sweep defects" ruling (owner: "push the current changes and fix all in same branch.") pre-approves this plan on the integration branch. Found by the headless-Chrome sweep recorded in gitignored `evidences/e2e/full/REPORT.md`.
