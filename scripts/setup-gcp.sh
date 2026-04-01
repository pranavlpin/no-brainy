#!/usr/bin/env bash
set -euo pipefail

# One-time GCP infrastructure setup for NoBrainy
# Run this once to set up Artifact Registry, Cloud SQL, and secrets

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${GCP_REGION:-asia-south1}"

echo "==> Setting up GCP infrastructure for NoBrainy"

# Enable required APIs
echo "==> Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

# Create Artifact Registry repository
echo "==> Creating Artifact Registry repository..."
gcloud artifacts repositories create nobrainy \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --description="NoBrainy Docker images" \
  2>/dev/null || echo "Repository already exists"

# Configure Docker auth
echo "==> Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev"

# Create Cloud SQL instance
echo "==> Creating Cloud SQL PostgreSQL instance..."
gcloud sql instances create nobrainy-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --storage-type=SSD \
  --storage-size=10GB \
  --availability-type=zonal \
  2>/dev/null || echo "SQL instance already exists"

# Create database
gcloud sql databases create nobrainy \
  --instance=nobrainy-db \
  --project="${PROJECT_ID}" \
  2>/dev/null || echo "Database already exists"

# Set database user password
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users set-password postgres \
  --instance=nobrainy-db \
  --password="${DB_PASSWORD}" \
  --project="${PROJECT_ID}"

# Store secrets
echo "==> Creating secrets..."
echo -n "postgresql://postgres:${DB_PASSWORD}@/nobrainy?host=/cloudsql/${PROJECT_ID}:${REGION}:nobrainy-db" | \
  gcloud secrets create nobrainy-database-url --data-file=- --project="${PROJECT_ID}" 2>/dev/null || \
  echo "Secret already exists"

NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -n "${NEXTAUTH_SECRET}" | \
  gcloud secrets create nobrainy-nextauth-secret --data-file=- --project="${PROJECT_ID}" 2>/dev/null || \
  echo "Secret already exists"

echo ""
echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set NEXTAUTH_URL secret: gcloud secrets create nobrainy-nextauth-url --data-file=- --project=${PROJECT_ID}"
echo "2. Set Google OAuth secrets (optional):"
echo "   gcloud secrets create nobrainy-google-client-id --data-file=- --project=${PROJECT_ID}"
echo "   gcloud secrets create nobrainy-google-client-secret --data-file=- --project=${PROJECT_ID}"
echo "3. Create a migration job:"
echo "   gcloud run jobs create nobrainy-migrate-staging --image=... --set-env-vars=... --command=npx,prisma,migrate,deploy"
echo "4. Deploy: ./scripts/deploy.sh staging"
