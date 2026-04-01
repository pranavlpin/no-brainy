#!/usr/bin/env bash
set -euo pipefail

# NoBrainy Deployment Script for Google Cloud Run
# Usage: ./scripts/deploy.sh [staging|production]

ENVIRONMENT="${1:-staging}"
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="nobrainy-${ENVIRONMENT}"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/nobrainy/app"

echo "==> Deploying NoBrainy to ${ENVIRONMENT}"
echo "    Project: ${PROJECT_ID}"
echo "    Region: ${REGION}"
echo "    Service: ${SERVICE_NAME}"

# Build and push Docker image
echo "==> Building Docker image..."
docker build -t "${IMAGE_NAME}:latest" -t "${IMAGE_NAME}:$(git rev-parse --short HEAD)" .

echo "==> Pushing to Artifact Registry..."
docker push "${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:$(git rev-parse --short HEAD)"

# Deploy to Cloud Run
echo "==> Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_NAME}:latest" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=nobrainy-database-url:latest,NEXTAUTH_SECRET=nobrainy-nextauth-secret:latest,NEXTAUTH_URL=nobrainy-nextauth-url:latest,GOOGLE_CLIENT_ID=nobrainy-google-client-id:latest,GOOGLE_CLIENT_SECRET=nobrainy-google-client-secret:latest"

# Run database migrations
echo "==> Running database migrations..."
gcloud run jobs execute nobrainy-migrate-${ENVIRONMENT} \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --wait

echo "==> Deployment complete!"
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"
