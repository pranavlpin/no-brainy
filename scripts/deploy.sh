#!/bin/bash
set -e

# ============================================================
# NoBrainy — Deploy to Google Cloud Run
# ============================================================
# Builds Docker image, pushes to Artifact Registry, deploys
# to Cloud Run, and runs database migrations.
#
# Usage:
#   ./scripts/deploy.sh                  # deploys to production
#   ./scripts/deploy.sh staging          # deploys to staging
#   ./scripts/deploy.sh production v1.2  # with custom tag
# ============================================================

ENVIRONMENT="${1:-production}"
TAG="${2:-$(git rev-parse --short HEAD)}"
REGION="${GCP_REGION:-asia-south1}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SERVICE_NAME="nobrainy-${ENVIRONMENT}"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/nobrainy/app:$TAG"
IMAGE_LATEST="$REGION-docker.pkg.dev/$PROJECT_ID/nobrainy/app:${ENVIRONMENT}-latest"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# Secret names differ by environment
if [ "$ENVIRONMENT" = "production" ]; then
  DB_SECRET="nobrainy-database-url-prod"
  AUTH_SECRET="nobrainy-nextauth-secret-prod"
  URL_SECRET="nobrainy-nextauth-url-prod"
  MEMORY="1Gi"
  CPU="2"
  MAX_INSTANCES="10"
else
  DB_SECRET="nobrainy-database-url"
  AUTH_SECRET="nobrainy-nextauth-secret"
  URL_SECRET="nobrainy-nextauth-url"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="5"
fi

echo "=== Deploying NoBrainy ($ENVIRONMENT) ==="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "Service:  $SERVICE_NAME"
echo "Tag:      $TAG"
echo ""

# ----------------------------------------------------------
# Step 1: Build Docker image
# ----------------------------------------------------------
echo "[1/4] Building Docker image..."
docker build --platform=linux/amd64 \
  -t "$IMAGE" \
  -t "$IMAGE_LATEST" \
  .

# ----------------------------------------------------------
# Step 2: Push to Artifact Registry
# ----------------------------------------------------------
echo "[2/4] Pushing to Artifact Registry..."
docker push "$IMAGE"
docker push "$IMAGE_LATEST"

# ----------------------------------------------------------
# Step 3: Deploy to Cloud Run
# ----------------------------------------------------------
echo "[3/4] Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory="$MEMORY" \
  --cpu="$CPU" \
  --min-instances=0 \
  --max-instances="$MAX_INSTANCES" \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=${DB_SECRET}:latest,NEXTAUTH_SECRET=${AUTH_SECRET}:latest,NEXTAUTH_URL=${URL_SECRET}:latest,GOOGLE_CLIENT_ID=nobrainy-google-client-id:latest,GOOGLE_CLIENT_SECRET=nobrainy-google-client-secret:latest" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:nobrainy-db" \
  --cpu-boost \
  --quiet

# ----------------------------------------------------------
# Step 4: Run database migrations
# ----------------------------------------------------------
echo "[4/4] Running database migrations..."
MIGRATE_JOB="nobrainy-migrate-${ENVIRONMENT}"

# Create or update the migration job
gcloud run jobs create "$MIGRATE_JOB" \
  --image="$IMAGE" \
  --region="$REGION" \
  --set-secrets="DATABASE_URL=${DB_SECRET}:latest" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:nobrainy-db" \
  --command="npx" \
  --args="prisma,migrate,deploy" \
  --max-retries=1 \
  --task-timeout=300s \
  --quiet \
  2>/dev/null || \
gcloud run jobs update "$MIGRATE_JOB" \
  --image="$IMAGE" \
  --region="$REGION" \
  --set-secrets="DATABASE_URL=${DB_SECRET}:latest" \
  --add-cloudsql-instances="${PROJECT_ID}:${REGION}:nobrainy-db" \
  --quiet

gcloud run jobs execute "$MIGRATE_JOB" \
  --region="$REGION" \
  --wait

# ----------------------------------------------------------
# Done
# ----------------------------------------------------------
APP_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')

echo ""
echo "=== Deployment Complete ==="
echo "URL:         $APP_URL"
echo "Environment: $ENVIRONMENT"
echo "Image:       $IMAGE"
echo ""

# Update NEXTAUTH_URL secret if this is first deploy
echo "If this is the first deploy, update NEXTAUTH_URL:"
echo "  echo -n '$APP_URL' | gcloud secrets versions add ${URL_SECRET} --data-file=-"
