# T34 — Build deploy images with Cloud Build when Docker is absent; pin pnpm 9 in the image

**Module:** platform · **Date:** 2026-10-17 · **Branch:** `feature/platform-cloud-build-deploy` · **Ledger:** [docs/tasks/platform.md](../../tasks/platform.md) · **Type:** deployment / config

## Context and problem

Production already runs on Cloud Run in project `nobrainy-prod` (service `nobrainy-production`, Cloud SQL `nobrainy-db`, Secret Manager, migration job `nobrainy-migrate-production`, images in Artifact Registry `nobrainy`). `scripts/deploy.sh` builds the app and migrator images with a local Docker daemon, which is not installed on the owner's machine. The Dockerfile also activates `pnpm@latest`, so a future pnpm major could stop reading the version 9 lockfile.

## Predecessors

- The deployment scripts and `docs/DEPLOYMENT.md` predate the ledgers (no plan). Delta: the image build can run in Cloud Build; everything after the build (Cloud Run deploy, migration job) is unchanged.

## Scope and affected files

- `cloudbuild.yaml` (new): builds `app` and the `migrator` target, tags `<sha>` and `<environment>-latest`, pushes to `asia-south1-docker.pkg.dev/$PROJECT_ID/nobrainy/`.
- `.gcloudignore` (new): includes `.gitignore` so `.env`, `node_modules`, `.next`, and `evidences/` never upload with the build context.
- `scripts/deploy.sh`: when `docker` is not on the PATH, run `gcloud builds submit --config cloudbuild.yaml` instead of the local build and push steps; production keeps `--min-instances=1`, which is what the live service already runs with (the script used to reset it to 0).
- `Dockerfile`: `corepack prepare pnpm@9 --activate` in the two pnpm stages.
- `docs/DEPLOYMENT.md`: note the Cloud Build path (current code-facing docs).
- Tests: `tests/unit/platform/cloud-build-config.test.ts` (file-based, like the icon and layout checks).

## Dependencies

- `cloudbuild.googleapis.com` enabled on `nobrainy-prod` (enabled as part of this task). No new npm dependencies.

## Risks and open questions

- Cloud Build charges per build minute on `E2_HIGHCPU_8`; a build is a few minutes. Accepted.
- Pending migrations on production are additive (T14 to T21 schema, T28 drops the note-link foreign key). The migration job runs `prisma migrate deploy` from the new migrator image, as before.
- `NEXTAUTH_URL` is read from Secret Manager; `trustHost` is on, so a mismatch would not break sign-in.

## Test-id strategy and accessibility

No UI.

## Test plan

[docs/test-plans/platform.md](../../test-plans/platform.md) §T34.

## Owner ruling applied

The platform ledger's 2026-10-17 "Merge and deploy" ruling pre-approves this plan and the production redeploy.
