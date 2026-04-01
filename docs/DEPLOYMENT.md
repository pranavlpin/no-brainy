# NoBrainy Deployment Guide

This guide covers deploying NoBrainy to Google Cloud Platform (GCP) using Cloud Run, with automated CI/CD via GitHub Actions.

## Prerequisites

- **GCP account** with billing enabled
- **gcloud CLI** installed and authenticated (`gcloud auth login`)
- **Docker** installed locally (for manual builds/testing)
- **GitHub repository** with admin access (to configure secrets and environments)
- **pnpm** installed (`npm install -g pnpm`)

## GCP Setup (One-Time)

### 1. Create a GCP Project

```bash
gcloud projects create nobrainy --name="NoBrainy"
gcloud config set project nobrainy
gcloud billing accounts list
gcloud billing projects link nobrainy --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com
```

### 3. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create nobrainy \
  --repository-format=docker \
  --location=asia-south1 \
  --description="NoBrainy Docker images"
```

### 4. Create Cloud SQL PostgreSQL Instance

```bash
# Create instance (db-f1-micro for cost savings)
gcloud sql instances create nobrainy-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-south1 \
  --storage-size=10GB \
  --storage-auto-increase

# Set root password
gcloud sql users set-password postgres \
  --instance=nobrainy-db \
  --password=YOUR_SECURE_PASSWORD

# Create databases
gcloud sql databases create nobrainy_staging --instance=nobrainy-db
gcloud sql databases create nobrainy_production --instance=nobrainy-db
```

### 5. Create a Service Account

```bash
gcloud iam service-accounts create nobrainy-deployer \
  --display-name="NoBrainy Deployer"

PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="nobrainy-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### 6. Set Up Workload Identity Federation for GitHub Actions

This allows GitHub Actions to authenticate to GCP without storing service account keys.

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub repo to impersonate the service account
# Replace YOUR_GITHUB_ORG/YOUR_REPO with your actual repo
gcloud iam service-accounts add-iam-policy-binding \
  "nobrainy-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO"

# Get the Workload Identity Provider resource name (you'll need this for GitHub secrets)
echo "Workload Identity Provider:"
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
```

### 7. Configure Secrets in Secret Manager

```bash
# Create secrets (replace values with your actual secrets)
echo -n "postgresql://postgres:PASSWORD@/nobrainy_staging?host=/cloudsql/PROJECT:asia-south1:nobrainy-db" | \
  gcloud secrets create nobrainy-database-url --data-file=-

echo -n "postgresql://postgres:PASSWORD@/nobrainy_production?host=/cloudsql/PROJECT:asia-south1:nobrainy-db" | \
  gcloud secrets create nobrainy-database-url-prod --data-file=-

echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create nobrainy-nextauth-secret --data-file=-

echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create nobrainy-nextauth-secret-prod --data-file=-

echo -n "https://staging.nobrainy.example.com" | \
  gcloud secrets create nobrainy-nextauth-url --data-file=-

echo -n "https://nobrainy.example.com" | \
  gcloud secrets create nobrainy-nextauth-url-prod --data-file=-

echo -n "your-google-client-id" | \
  gcloud secrets create nobrainy-google-client-id --data-file=-

echo -n "your-google-client-secret" | \
  gcloud secrets create nobrainy-google-client-secret --data-file=-
```

Grant the Cloud Run service account access to secrets:

```bash
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in nobrainy-database-url nobrainy-database-url-prod \
  nobrainy-nextauth-secret nobrainy-nextauth-secret-prod \
  nobrainy-nextauth-url nobrainy-nextauth-url-prod \
  nobrainy-google-client-id nobrainy-google-client-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## GitHub Repository Secrets

Configure these secrets in your GitHub repository under **Settings > Secrets and variables > Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `nobrainy` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name | `projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | Deployer service account email | `nobrainy-deployer@nobrainy.iam.gserviceaccount.com` |

### Setting Up the Production Environment

For production deployments with approval gates:

1. Go to **Settings > Environments** in your GitHub repo
2. Create an environment called `production`
3. Enable **Required reviewers** and add team members who can approve production deploys
4. Optionally set a **Wait timer** (e.g., 5 minutes) for additional safety

## CI/CD Pipeline

### How It Works

```
PR to main
  --> CI runs (lint, typecheck, test, build)
  --> Must pass before merge

Push to develop
  --> Auto-deploy to staging

Push to main (or manual trigger)
  --> CI runs first
  --> If CI passes, deploy to production (requires environment approval)
```

### Workflow Files

| File | Trigger | What It Does |
|------|---------|--------------|
| `.github/workflows/ci.yml` | Push to main/develop, PRs to main | Lint, typecheck, test, build |
| `.github/workflows/deploy-staging.yml` | Push to develop | Build image, migrate DB, deploy to staging |
| `.github/workflows/deploy-production.yml` | Push to main, manual | Run CI, build image, migrate DB, deploy to production |

## Manual Deployment

### Using the Deploy Script

```bash
export GCP_PROJECT_ID=your-project
./scripts/deploy.sh staging
./scripts/deploy.sh production
```

### Manual Docker Build and Deploy

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=asia-south1
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/nobrainy/app"

# Configure Docker
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and push
docker build -t $IMAGE:latest .
docker push $IMAGE:latest

# Deploy
gcloud run deploy nobrainy-production \
  --image=$IMAGE:latest \
  --region=$REGION \
  --port=3000 \
  --memory=1Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10 \
  --allow-unauthenticated
```

## Database Migrations

### Locally

```bash
pnpm db:migrate    # Create and apply migrations (development)
pnpm db:push       # Push schema changes without creating migration files
pnpm db:studio     # Open Prisma Studio to browse data
```

### In CI/CD

Database migrations run automatically as a Cloud Run Job before each deployment. The job executes `npx prisma migrate deploy` which applies pending migrations.

### Manual Migration

```bash
# Execute the migration job manually
gcloud run jobs execute nobrainy-migrate-production \
  --region=asia-south1 \
  --wait

# Check job execution status
gcloud run jobs executions list \
  --job=nobrainy-migrate-production \
  --region=asia-south1
```

## Environment-Specific Configuration

### Staging

- **Memory:** 512Mi
- **CPU:** 1 vCPU
- **Instances:** 0-5 (scales to zero when idle)
- **Purpose:** Testing and validation before production

### Production

- **Memory:** 1Gi
- **CPU:** 2 vCPUs
- **Instances:** 1-10 (always at least 1 instance running)
- **CPU Boost:** Enabled (extra CPU during startup for faster cold starts)
- **Purpose:** Live user-facing application

## Monitoring and Logs

### View Logs

```bash
# Stream live logs
gcloud run services logs read nobrainy-production \
  --region=asia-south1 \
  --limit=100

# Tail logs in real-time
gcloud run services logs tail nobrainy-production \
  --region=asia-south1

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nobrainy-production AND severity>=ERROR" \
  --limit=50 \
  --format="table(timestamp, severity, textPayload)"
```

### Cloud Console Links

- **Cloud Run dashboard:** https://console.cloud.google.com/run?project=YOUR_PROJECT_ID
- **Cloud SQL:** https://console.cloud.google.com/sql?project=YOUR_PROJECT_ID
- **Secret Manager:** https://console.cloud.google.com/security/secret-manager?project=YOUR_PROJECT_ID
- **Artifact Registry:** https://console.cloud.google.com/artifacts?project=YOUR_PROJECT_ID
- **Logs Explorer:** https://console.cloud.google.com/logs?project=YOUR_PROJECT_ID

## Rollback

### Quick Rollback to Previous Revision

```bash
# List recent revisions
gcloud run revisions list \
  --service=nobrainy-production \
  --region=asia-south1 \
  --limit=10

# Route all traffic to a specific revision
gcloud run services update-traffic nobrainy-production \
  --to-revisions=REVISION_NAME=100 \
  --region=asia-south1
```

### Rollback by Redeploying a Previous Image

```bash
# List available images
gcloud artifacts docker images list \
  asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/nobrainy/app \
  --include-tags

# Deploy a specific image by commit SHA
gcloud run deploy nobrainy-production \
  --image=asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/nobrainy/app:COMMIT_SHA \
  --region=asia-south1
```

### Rollback via Git

```bash
# Revert the problematic commit and push to trigger a new deployment
git revert HEAD
git push origin main
```

## Cost Estimation

Approximate monthly costs for a low-traffic application:

| Service | Staging | Production | Notes |
|---------|---------|------------|-------|
| Cloud Run | ~$0 | ~$5-15 | Staging scales to zero; production keeps 1 min instance |
| Cloud SQL (db-f1-micro) | Shared | Shared | ~$7-10/month for the instance |
| Artifact Registry | ~$0.10/GB | Included | Storage for Docker images |
| Secret Manager | ~$0.06/secret | Included | 8 secrets total |
| **Total** | | **~$15-30/month** | For low-traffic usage |

**Cost optimization tips:**
- Use `db-f1-micro` for Cloud SQL (shared CPU, sufficient for small apps)
- Set staging `min-instances=0` to scale to zero when not in use
- Clean up old Docker images periodically with a lifecycle policy
- Use Workload Identity Federation instead of service account keys (free and more secure)

## Troubleshooting

### Common Issues

**Build fails with Prisma error:**
Ensure `pnpm prisma generate` runs before `pnpm build`. The Dockerfile and CI workflows handle this, but check if the Prisma schema has changed.

**Cloud Run deployment fails with secret access error:**
The compute service account needs `roles/secretmanager.secretAccessor` on each secret. See the secret setup section above.

**Database connection timeout:**
Cloud Run connects to Cloud SQL via the Cloud SQL Auth Proxy (built into Cloud Run). Make sure the `--add-cloudsql-instances` flag is set, or use the private IP connection string.

**Cold start latency:**
Production uses `--cpu-boost` to allocate extra CPU during startup. If latency is still a concern, increase `--min-instances` to keep more warm instances.
