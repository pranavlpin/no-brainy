# NoBrainy

A personal workspace for capturing ideas, choosing a realistic day, doing focused work and noticing growth. Built with React 18, Next.js 15, TypeScript, PostgreSQL 16 and Prisma.

## Start using it

Open http://localhost:3000 and create your own account. No demo account or sample tasks are needed. Email/password registration works locally without Google or an AI key.

1. Open **Settings → Make room for your day**. Save your timezone, task context, comfortable daily capacity and working window. Reduced animation and Focus sound are optional. Reminders are off until you choose them.
2. **Capture** a thought with the header button or Command/Ctrl+K. Process it into a task, note or saved link, or leave it in Someday.
3. Give a **Project** an outcome and a next action. In **Today**, choose up to three priorities, leave a buffer and optionally schedule time blocks. Planning dates and deadlines are separate.
4. Start **Focus**, pause or return to your workspace, then record progress, completion or a blocker. A partial result keeps the task open. Reload recovery and retry controls protect pending input.
5. Use **Growth** for success criteria, optional measurements, regular practice and evidence. Turn book applications into small experiments. Close a day or reflect on a week in **Reflections** and choose one useful adjustment.

The **Library** retains Notes (Markdown, code, Mermaid, wiki links and graph), Books, Flashcards and saved references. Life tools include Expenses, Budgets, Watchlist and Stash. Existing deep links remain available. Light/dark appearance, color themes, backgrounds and transitions share the redesigned workspace; device reduced-motion preferences are respected.

## This laptop: run and stop

Repository: /Users/pranav/Pranav_projects/github/no-brainy.

The private configuration is already in /Users/pranav/Pranav_projects/github/no-brainy/.env. Keep it private. The local PostgreSQL cluster uses port 55432, database `nobrainy`; automated tests use the separate `nobrainy_test` database. Neither database should be reset to start the app.

Check whether PostgreSQL is running:

```sh
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/postgres/data status
```

If stopped, start it:

```sh
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/postgres/data -l /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/postgres/server.log -w start
```

Run the app in a terminal:

```sh
cd /Users/pranav/Pranav_projects/github/no-brainy
npm run db:generate
npx prisma migrate deploy
npm run build
npm run start -- --hostname 127.0.0.1
```

Open http://localhost:3000. Stop that terminal's app with Ctrl+C. For development, use `npm run dev -- --hostname 127.0.0.1` instead of the build/start steps. Do not run both on the same port. If needed, stop this isolated PostgreSQL cluster after stopping the app:

```sh
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/postgres/data -m fast -w stop
```

The cluster is currently under the ignored evidence directory. It contains your actual local app data: **do not delete that directory as disposable logs**. Keep PostgreSQL backups independently; the core export below is intentionally narrower.

## Dependencies and configuration

Required: Node compatible with the installed tools (20.19+, 22.12+ or newer), pnpm, PostgreSQL and the three values shown in /Users/pranav/Pranav_projects/github/no-brainy/.env.example: `DATABASE_URL`, `NEXTAUTH_URL`, and a private `NEXTAUTH_SECRET` of at least 32 characters. Preserve the secret to retain access to encrypted stored values.

Dependencies are installed from /Users/pranav/Pranav_projects/github/no-brainy/pnpm-lock.yaml. The local pnpm executable is /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/tooling/node_modules/.bin/pnpm. To reinstall the locked dependencies on this laptop:

```sh
cd /Users/pranav/Pranav_projects/github/no-brainy
/Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/tooling/node_modules/.bin/pnpm install --frozen-lockfile
```

Optional services:

| Service           | Configuration                                              | Behavior without it                                                                                                                                 |
| ----------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI            | Personal API key in Settings                               | Manual planning, learning and reflection remain usable; AI assistance is unavailable. Previews require explicit acceptance before applying actions. |
| Google sign-in    | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                 | Use email/password.                                                                                                                                 |
| Stash attachments | `GCS_BUCKET_NAME`, `GCS_PROJECT_ID` and server credentials | Text/link Stash remains usable; file upload reports unavailable storage.                                                                            |
| Movie metadata    | `OMDB_API_KEY`                                             | Add/edit Watchlist records manually.                                                                                                                |
| Browser push      | Existing web-push configuration                            | In-app reminder settings remain available; external delivery is not assumed.                                                                        |

Local acceptance uses test doubles for external services. It does not establish live AI, OAuth, metadata, cloud upload or push delivery. No external deployment is required for personal local use.

## Core backup and additive import

In **Settings → Keep a copy of your progress**, download a version 1 JSON archive. It contains captures, projects, tasks/routines, task planning history, day plans, goals/evidence, Focus sessions, notes, daily/weekly reflections and structured internal links.

It excludes credentials, API keys, authentication sessions, account settings, public share tokens, books, decks/flashcards, bookmarks, watchlist, finance records, Stash and cloud files. Financial-goal metadata remains with goals, but finance category links are omitted. The exported content is private plaintext; store it privately. It is **not** a full database or cloud-file recovery archive.

Import accepts at most 10 MB and 20,000 records. Choose a file to validate it and preview counts; no record changes until **Confirm additive import**. All imported IDs are remapped to your account. Existing date-keyed plans/reflections are kept and listed as skipped; their originals remain in the backup file. Imported notes are private. Unfinished Focus sessions become finished progress snapshots at export time, without starting timers or completing tasks. Excluded/unavailable source links are counted in the preview. Unknown versions, broken references and invalid records are rejected.

Confirmation runs in a transaction; failure leaves no partial import. Retry the same confirmation/file safely: a completed import receipt prevents duplicates. If the date-conflict preview changes, refresh it before confirming again. To restore excluded modules or the whole database, use PostgreSQL and cloud-storage backups through your deployment procedures.

## Verification and contribution

Run from /Users/pranav/Pranav_projects/github/no-brainy:

```sh
npm run format:check
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npx prisma validate
npm run build
```

The integration/browser runners require the explicitly confirmed disposable local test database configured during setup. They apply migrations there, never reset the app database, and browser journeys register temporary test accounts. The browser runner serves http://localhost:3100 and owns its own server lifecycle. Its Chromium binaries are at /Users/pranav/Pranav_projects/github/no-brainy/evidences/platform/react-tdd-foundation/browsers. Screenshots, video and traces are disabled unless explicitly requested. Logs and temporary downloads belong under /Users/pranav/Pranav_projects/github/no-brainy/evidences/ and are not committed.

Repository workflow: [/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md](/Users/pranav/Pranav_projects/github/no-brainy/AGENTS.md), identical to [/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md](/Users/pranav/Pranav_projects/github/no-brainy/CLAUDE.md). Approved plans, append-only task ledgers and section test plans live at /Users/pranav/Pranav_projects/github/no-brainy/docs/plans/, /Users/pranav/Pranav_projects/github/no-brainy/docs/tasks/ and /Users/pranav/Pranav_projects/github/no-brainy/docs/test-plans/. Follow TDD and use task branches. Local completion does not authorize pushing, reviewing, merging or deploying.

Deployment reference: [/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md](/Users/pranav/Pranav_projects/github/no-brainy/docs/DEPLOYMENT.md). Security reporting: https://github.com/pranavlpin/no-brainy/security/advisories/new. The existing deployment guide is historical operational guidance; local acceptance does not validate its cloud configuration.

## License

GNU General Public License v3.0. See [/Users/pranav/Pranav_projects/github/no-brainy/LICENSE](/Users/pranav/Pranav_projects/github/no-brainy/LICENSE).
