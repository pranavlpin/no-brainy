#!/bin/bash
set -e

# ============================================================
# NoBrainy — Rollback to Previous Revision
# ============================================================
# Usage:
#   ./scripts/rollback.sh                      # list revisions
#   ./scripts/rollback.sh REVISION_NAME        # rollback to specific revision
# ============================================================

ENVIRONMENT="${1:-production}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="nobrainy-${ENVIRONMENT}"

# If a revision name is provided as second arg, rollback to it
REVISION="${2:-}"

if [ -z "$REVISION" ]; then
  echo "=== Recent Revisions: $SERVICE_NAME ==="
  echo ""
  gcloud run revisions list \
    --service="$SERVICE_NAME" \
    --region="$REGION" \
    --limit=10
  echo ""
  echo "To rollback, run:"
  echo "  ./scripts/rollback.sh $ENVIRONMENT REVISION_NAME"
else
  echo "=== Rolling back $SERVICE_NAME to $REVISION ==="
  gcloud run services update-traffic "$SERVICE_NAME" \
    --to-revisions="$REVISION=100" \
    --region="$REGION"

  URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')
  echo ""
  echo "=== Rollback Complete ==="
  echo "URL: $URL"
  echo "Revision: $REVISION"
fi
