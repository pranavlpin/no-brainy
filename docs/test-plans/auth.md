# auth — test plan

## T24 — Protected routes and form posting (bug fix)

- Scope: unit + component (regression tests written first, failing).
- Unit: the middleware `config.matcher` contains `/<section>/:path*` for every directory under `src/app/(dashboard)`.
- Component: `LoginForm` and `RegisterForm` render `<form method="post">`; after a successful sign-in `LoginForm` pushes a same-origin `callbackUrl` path and falls back to `/` for another origin or no parameter.
