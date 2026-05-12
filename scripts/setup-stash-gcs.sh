#!/bin/bash
set -e

# ============================================================
# NoBrainy — One-time GCS setup for the Stash feature
# ============================================================
# Creates the GCS bucket used by Stash for file attachments and
# grants the Cloud Run service account the permissions needed
# to read/write objects and generate V4 signed URLs.
#
# Prerequisites: gcloud CLI authenticated, setup-gcp.sh already run.
#
# Usage:
#   gcloud config set project nobrainy-prod
#   ./scripts/setup-stash-gcs.sh
#
# Environment overrides (optional):
#   GCS_BUCKET_NAME   default: ${PROJECT_ID}-stash
#   GCP_REGION        default: asia-south1
#   ALLOWED_ORIGIN    default: https://nobrainy.com
# ============================================================

REGION="${GCP_REGION:-asia-south1}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-https://nobrainy.com}"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
BUCKET_NAME="${GCS_BUCKET_NAME:-${PROJECT_ID}-stash}"

echo "=== Stash GCS Setup ==="
echo "Project: $PROJECT_ID"
echo "Bucket:  gs://$BUCKET_NAME"
echo "Region:  $REGION"
echo "SA:      $SERVICE_ACCOUNT"
echo "CORS:    $ALLOWED_ORIGIN"
echo ""

# ----------------------------------------------------------
# Step 1: Ensure required APIs
# ----------------------------------------------------------
echo "[1/5] Enabling storage APIs..."
gcloud services enable \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID"

# ----------------------------------------------------------
# Step 2: Create bucket
# ----------------------------------------------------------
echo "[2/5] Creating GCS bucket..."
gcloud storage buckets create "gs://$BUCKET_NAME" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --public-access-prevention \
  2>/dev/null || echo "  (already exists)"

# ----------------------------------------------------------
# Step 3: Grant SA object-admin on the bucket
# ----------------------------------------------------------
echo "[3/5] Granting Cloud Run SA read/write on bucket..."
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/storage.objectAdmin" \
  --quiet

# ----------------------------------------------------------
# Step 4: Grant SA permission to sign URLs (impersonate itself)
# Required for V4 signed-URL generation from Cloud Run without a key file
# ----------------------------------------------------------
echo "[4/5] Granting SA permission to sign URLs..."
gcloud iam service-accounts add-iam-policy-binding \
  "$SERVICE_ACCOUNT" \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="$PROJECT_ID" \
  --quiet

# ----------------------------------------------------------
# Step 5: CORS so the browser can PUT directly to signed URLs
# ----------------------------------------------------------
echo "[5/5] Applying CORS config..."
CORS_FILE=$(mktemp)
cat > "$CORS_FILE" <<EOF
[
  {
    "origin": ["$ALLOWED_ORIGIN"],
    "method": ["GET", "PUT"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update "gs://$BUCKET_NAME" --cors-file="$CORS_FILE"
rm -f "$CORS_FILE"

# ----------------------------------------------------------
# Done
# ----------------------------------------------------------
echo ""
echo "=== Stash GCS Ready ==="
echo "Bucket:        gs://$BUCKET_NAME"
echo ""
echo "Next step: add these to scripts/deploy.sh --set-env-vars="
echo "  GCS_BUCKET_NAME=$BUCKET_NAME"
echo "  GCS_PROJECT_ID=$PROJECT_ID"
echo ""
echo "Then run: ./scripts/deploy.sh production"
