#!/bin/bash
set -e

# ============================================================
# NoBrainy — View Cloud Run Logs
# ============================================================
# Usage:
#   ./scripts/logs.sh                  # production, last 50
#   ./scripts/logs.sh staging          # staging
#   ./scripts/logs.sh production 100   # last 100 lines
# ============================================================

ENVIRONMENT="${1:-production}"
LIMIT="${2:-50}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="nobrainy-${ENVIRONMENT}"

echo "=== Logs: $SERVICE_NAME ==="
echo ""

gcloud run services logs read "$SERVICE_NAME" \
  --region="$REGION" \
  --limit="$LIMIT"
