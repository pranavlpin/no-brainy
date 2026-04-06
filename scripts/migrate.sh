#!/bin/bash
set -e

# ============================================================
# NoBrainy — Run Database Migrations (Remote)
# ============================================================
# Runs Prisma migrations against the Cloud SQL database
# via a Cloud Run Job. Use this after schema changes.
#
# Usage:
#   ./scripts/migrate.sh              # production
#   ./scripts/migrate.sh staging      # staging
# ============================================================

ENVIRONMENT="${1:-production}"
REGION="${GCP_REGION:-asia-south1}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
MIGRATE_JOB="nobrainy-migrate-${ENVIRONMENT}"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "=== Running Migrations ($ENVIRONMENT) ==="
echo "Project: $PROJECT_ID"
echo "Job:     $MIGRATE_JOB"
echo ""

gcloud run jobs execute "$MIGRATE_JOB" \
  --region="$REGION" \
  --wait

echo ""
echo "=== Migrations Complete ==="
