# Platform task ledger

## NB-02 — React TDD foundation and runnable environment

- Date: 2026-10-16 (Asia/Kolkata).
- Branch: `test/platform-react-tdd-foundation`.
- Target/base: `feature/workflow-react-governance`, `88b4f35a6099dbceaea4a9c47377ad8f7ada0d96`.
- Plan: [/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/plans/platform/react-tdd-foundation.md).
- Approval: Owner's 2026-10-16 conversation message “approved.” covers the named plan and six listed development dependencies.
- Status: IMPLEMENTED — environment and test foundation verified; five inherited lint warnings remain tracked for NB-03/NB-12 before final acceptance.
- Scope: Environment readiness, isolated database guard, assertion-preserving test migration, test scripts and harnesses.
- Prerequisites observed: npm registry lookup fails with ENOTFOUND; no pnpm, PostgreSQL or container runtime on PATH; no installed project dependencies or local environment file. Node bootstrap tests can run independently.
- Validation: Initial platform red run: 12/12 failed for missing planned implementations. First green: 12/12 passed. A connection-override regression then failed (13 pass, 1 fail) before its guard fix. Final combined bootstrap run: 20/20 pass (14 platform + 6 workflow). Node syntax and Git whitespace checks pass. No database connection or application test has run.


### Completed bootstrap behavior

- `/Users/pranav/Pranav_projects/github/no-brainy/scripts/check-environment.mjs` checks runtime/package/configuration prerequisites and reports missing values without exposing them. It explicitly does not claim connectivity, migrations or application readiness.
- `/Users/pranav/Pranav_projects/github/no-brainy/scripts/test-database.mjs` validates the disposable database before future test migrations/cleanup: confirmed name, local target, separation from development, no ambiguous overrides. It performs no database mutation.
- `/Users/pranav/Pranav_projects/github/no-brainy/.env` was created only because no local file existed, with a private generated auth secret and local database configuration matching the existing compose service. It is Git-ignored and mode 0600; no secret was printed or committed.
- Red/green and readiness records: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/` (ignored).

### Remaining gates and precise blocker

The current shell cannot resolve https://registry.npmjs.org (`npm ping` exits 1 with ENOTFOUND). No usable cached application/test packages were found. pnpm, PostgreSQL and a container runtime are unavailable on PATH; the Docker Desktop application is absent. The readiness check currently reports 60 unresolved packages. Node and the required local configuration pass their checks.

NB-02-T02 legacy-test migration, NB-02-T04 React component harness, NB-02-T05 authenticated browser journey, live database migration tests, Vitest, TypeScript, ESLint, Prettier and production build remain NOT RUN. The package manifest, lockfile and existing product/test source files are unchanged. Do not mark NB-02 complete or begin dependent product implementation without executable red/green tests. The two new scripts and their tests remain local working-tree changes while dependency-based formatting/static gates are unavailable.

### Resume setup

Preferred external action: make package downloads and a local PostgreSQL runtime available to this workspace; the approved build needs no further plan approval.

If setup must be run in the owner's regular terminal, the following commands install the existing lockfile and the already-approved developer packages without a global pnpm installation. pnpm 10 supports Node 26 according to https://pnpm.io/installation; it is selected to retain the existing lockfile/build-allowlist convention. Resolved development-tool versions must be inspected and committed separately after installation.

```sh
cd /Users/pranav/Pranav_projects/github/no-brainy
npm exec --yes --package=pnpm@10 -- pnpm install --frozen-lockfile
npm exec --yes --package=pnpm@10 -- pnpm add --save-dev --save-exact @testing-library/react@16 @testing-library/dom@10 @testing-library/user-event@14 @testing-library/jest-dom@6 @playwright/test@1 prettier@3
npm exec --yes --package=pnpm@10 -- pnpm exec playwright install chromium
```

For the repository's existing PostgreSQL container setup, install and start Docker Desktop using https://docs.docker.com/desktop/setup/install/mac-install/ if no other local PostgreSQL runtime is available, then run:

```sh
docker compose -f /Users/pranav/Pranav_projects/github/no-brainy/docker-compose.yml up -d db
docker compose -f /Users/pranav/Pranav_projects/github/no-brainy/docker-compose.yml exec db pg_isready -U postgres
docker compose -f /Users/pranav/Pranav_projects/github/no-brainy/docker-compose.yml exec db createdb -U postgres nobrainy_test
```

Wait for the database to be ready before creating the disposable test database. If that database already exists, preserve it and verify its purpose; do not reset it. These commands have not been executed here. No production service, cloud resource, global Git identity or deployment workflow has been changed. Once tools are available, continue the approved NB-02 TDD sequence and verify normal auth before NB-03.


### Provisioning retry — 2026-10-16, 09:20 IST

The owner explicitly instructed that dependency downloads and local PostgreSQL setup should be performed here. This confirms authorization for the existing NB-02 provisioning scope; it does not change the executor's effective permissions.

Retried `npm ping` and a real workspace-local pnpm bootstrap/install. Both exited 1 with `getaddrinfo ENOTFOUND registry.npmjs.org`; no packages were installed. Install log: `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/npm-cache/_logs/2026-10-16T03_50_03_261Z-debug-0.log`. Read-only checks found no PostgreSQL/pnpm runtime in the Homebrew installation/cache or local pnpm cache. No service, global installation or permission configuration was changed.

The active session restricts command network access and does not permit requesting sandbox escalation. The remaining prerequisite is an externally applied execution-policy change enabling the required downloads. Official documentation distinguishes this execution boundary from conversational authorization: https://learn.chatgpt.com/docs/sandboxing. In the desktop app, use the permissions control beneath the composer; for Work environments where exposed, public command access is controlled by Settings > Data controls > Work network access. The environment policy must actually refresh before retrying. Preserve workspace-scoped filesystem access where possible; do not silently broaden it or route downloads around the restriction.

NB-02 remains blocked at package installation. Existing bootstrap results are unchanged; tests were not rerun because no implementation changed.


### Environment unblocked and foundation verified — 2026-10-16

The owner enabled full access and explicitly authorized provisioning. Registry ping and package downloads now work. Installed pnpm 10.34.7 locally under ignored tooling and the six approved developer packages (pinned in the manifest/lockfile); the dependency-only commit is `34da3a5`. PostgreSQL 16.15 was installed with Homebrew. Its required dependencies included OpenSSL 4, krb5 and a CA certificate update; no login service was enabled.

An isolated cluster runs on loopback port 55432 with separate `nobrainy` and `nobrainy_test` databases, a private password and all eleven baseline migrations. Runtime data/logs are under `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/postgres/`. Existing databases were not reset. The ignored local environment file now points to this cluster.

Verified results:

- Baseline: 18 existing tests passed and production build passed. The suspected duplicate-root route did not cause a build failure; no route change was needed.
- T02 red: relocated tests were not discovered and the main command omitted Node checks (two expected failures). After assertion-preserving moves and script/config changes, all 18 legacy tests remain discovered and green.
- Formatter boundary red: missing implementation failed. Green: candidate filtering excludes immutable ledgers/plans, secrets, evidence and generated files. Formatter installed/applied to changed current files; historical plans/sections untouched. Both root rule files remain identical after formatting.
- Current complete unit/bootstrap run: 23 Node cases plus 19 Vitest cases pass (including a real shared-button keyboard/disabled interaction).
- PostgreSQL integration: persistence/owner-filter fixture passes in the isolated database, with exact-user cleanup.
- Browser: real registration, authenticated task access, public homepage and unauthenticated API rejection pass in Chromium. No auth bypass or screenshots. The test server uses a separate build directory and the test database.
- TypeScript, Prisma migrations and changed-file formatting pass. The environment diagnostic reports all required capabilities/configuration available when the local pnpm executable is on PATH.
- ESLint is enforced with zero-warning exit behavior. The baseline has five warnings (one unstable notes-list dependency and four existing native image elements). They were confirmed before feature changes and remain assigned to the already-approved NB-03 reliability and NB-12 module-preservation work. No lint rule was weakened. Global lint is not claimed green; it remains a final acceptance gate.

All logs are in `/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/`. No push, PR, review or deployment occurred. Continue with approved NB-03 on its own stacked branch.
