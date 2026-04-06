#!/bin/bash
set -e

# ============================================================
# NoBrainy — One-time GCP Infrastructure Setup
# ============================================================
# Run once to create all GCP resources needed for deployment.
# Prerequisites: gcloud CLI authenticated, billing enabled.
#
# Usage:
#   gcloud auth login
#   gcloud config set project YOUR_PROJECT_ID
#   ./scripts/setup-gcp.sh
# ============================================================

REGION="${GCP_REGION:-asia-south1}"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
GITHUB_REPO="${GITHUB_REPO:-pranavlpin/no-brainy}"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "=== NoBrainy GCP Setup ==="
echo "Project:  $PROJECT_ID"
echo "Region:   $REGION"
echo "GitHub:   $GITHUB_REPO"
echo ""

# ----------------------------------------------------------
# Step 1: Enable APIs
# ----------------------------------------------------------
echo "[1/8] Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID"

# ----------------------------------------------------------
# Step 2: Create Artifact Registry
# ----------------------------------------------------------
echo "[2/8] Creating Artifact Registry..."
gcloud artifacts repositories create nobrainy \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" \
  --description="NoBrainy Docker images" \
  2>/dev/null || echo "  (already exists)"

gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# ----------------------------------------------------------
# Step 3: Create Cloud SQL PostgreSQL instance
# ----------------------------------------------------------
echo "[3/8] Creating Cloud SQL instance (this may take a few minutes)..."
gcloud sql instances create nobrainy-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --storage-type=SSD \
  --storage-size=10GB \
  --availability-type=zonal \
  2>/dev/null || echo "  (already exists)"

gcloud sql databases create nobrainy \
  --instance=nobrainy-db \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  (already exists)"

# ----------------------------------------------------------
# Step 4: Set DB password and create secrets
# ----------------------------------------------------------
echo "[4/8] Creating secrets..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
gcloud sql users set-password postgres \
  --instance=nobrainy-db \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID"

CONNECTION_STRING="postgresql://postgres:${DB_PASSWORD}@/nobrainy?host=/cloudsql/${PROJECT_ID}:${REGION}:nobrainy-db"
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Create secrets (skip if they already exist)
echo -n "$CONNECTION_STRING" | gcloud secrets create nobrainy-database-url-prod --data-file=- --project="$PROJECT_ID" 2>/dev/null || echo "  secret nobrainy-database-url-prod already exists"
echo -n "$NEXTAUTH_SECRET"   | gcloud secrets create nobrainy-nextauth-secret-prod --data-file=- --project="$PROJECT_ID" 2>/dev/null || echo "  secret nobrainy-nextauth-secret-prod already exists"
echo -n "https://nobrainy-production.run.app" | gcloud secrets create nobrainy-nextauth-url-prod --data-file=- --project="$PROJECT_ID" 2>/dev/null || echo "  secret nobrainy-nextauth-url-prod already exists"
echo -n ""                   | gcloud secrets create nobrainy-google-client-id --data-file=- --project="$PROJECT_ID" 2>/dev/null || echo "  secret nobrainy-google-client-id already exists"
echo -n ""                   | gcloud secrets create nobrainy-google-client-secret --data-file=- --project="$PROJECT_ID" 2>/dev/null || echo "  secret nobrainy-google-client-secret already exists"

# ----------------------------------------------------------
# Step 5: Create service account for GitHub Actions
# ----------------------------------------------------------
echo "[5/8] Creating service account..."
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  (already exists)"

for ROLE in roles/run.admin roles/artifactregistry.writer roles/secretmanager.secretAccessor roles/cloudsql.client roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet > /dev/null
done
echo "  Granted 5 roles to $SA_EMAIL"

# ----------------------------------------------------------
# Step 6: Set up Workload Identity Federation
# ----------------------------------------------------------
echo "[6/8] Setting up Workload Identity Federation..."
gcloud iam workload-identity-pools create github-pool \
  --location=global \
  --display-name="GitHub Actions Pool" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  pool already exists"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "  provider already exists"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_REPO}" \
  --quiet > /dev/null

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"

# ----------------------------------------------------------
# Step 7: Set GitHub secrets (requires gh CLI)
# ----------------------------------------------------------
echo "[7/8] Setting GitHub repository secrets..."
if command -v gh &> /dev/null; then
  gh secret set GCP_PROJECT_ID --body="$PROJECT_ID" --repo "$GITHUB_REPO"
  gh secret set GCP_SERVICE_ACCOUNT --body="$SA_EMAIL" --repo "$GITHUB_REPO"
  gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --body="$WIF_PROVIDER" --repo "$GITHUB_REPO"
  echo "  3 secrets set on $GITHUB_REPO"
else
  echo "  gh CLI not found. Set these secrets manually at:"
  echo "  https://github.com/$GITHUB_REPO/settings/secrets/actions"
  echo ""
  echo "  GCP_PROJECT_ID=$PROJECT_ID"
  echo "  GCP_SERVICE_ACCOUNT=$SA_EMAIL"
  echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=$WIF_PROVIDER"
fi

# ----------------------------------------------------------
# Step 8: Summary
# ----------------------------------------------------------
echo ""
echo "[8/8] Done!"
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Resources created:"
echo "  - Artifact Registry: $REGION-docker.pkg.dev/$PROJECT_ID/nobrainy"
echo "  - Cloud SQL:         nobrainy-db (PostgreSQL 16)"
echo "  - Service Account:   $SA_EMAIL"
echo "  - WIF Provider:      $WIF_PROVIDER"
echo "  - Secrets:           5 secrets in Secret Manager"
echo ""
echo "Next steps:"
echo "  1. Deploy:  ./scripts/deploy.sh production"
echo "  2. Or push to main branch to trigger GitHub Actions deployment"
echo ""
echo "Optional: Set Google OAuth credentials:"
echo "  echo -n 'YOUR_CLIENT_ID' | gcloud secrets versions add nobrainy-google-client-id --data-file=-"
echo "  echo -n 'YOUR_SECRET'    | gcloud secrets versions add nobrainy-google-client-secret --data-file=-"
