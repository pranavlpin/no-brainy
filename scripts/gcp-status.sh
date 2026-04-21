#!/bin/bash

# ============================================================
# NoBrainy — GCP Status & Usage Dashboard
# ============================================================
# Queries live GCP resources and shows usage, tiers, and costs.
#
# Usage:
#   ./scripts/gcp-status.sh
#   ./scripts/gcp-status.sh nobrainy-prod    # specify project
# ============================================================

PROJECT_ID="${1:-${GCP_PROJECT_ID:-nobrainy-prod}}"
REGION="${GCP_REGION:-asia-south1}"

gcloud config set project "$PROJECT_ID" --quiet 2>/dev/null

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              NoBrainy — GCP Status Dashboard                ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Project: $PROJECT_ID"
echo "║  Region:  $REGION"
echo "║  Date:    $(date '+%Y-%m-%d %H:%M')"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ----------------------------------------------------------
# Cloud Run Services
# ----------------------------------------------------------
echo "═══ Cloud Run Services ═══"
echo ""
gcloud run services list --region="$REGION" --format="table[box](
  metadata.name:label=SERVICE,
  status.url:label=URL,
  spec.template.spec.containers[0].resources.limits.memory:label=MEMORY,
  spec.template.spec.containers[0].resources.limits.cpu:label=CPU,
  spec.template.metadata.annotations.'autoscaling.knative.dev/minScale':label=MIN,
  spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale':label=MAX,
  status.conditions[0].status:label=READY
)" 2>/dev/null || echo "  No Cloud Run services found"
echo ""

# ----------------------------------------------------------
# Cloud Run Jobs
# ----------------------------------------------------------
echo "═══ Cloud Run Jobs ═══"
echo ""
gcloud run jobs list --region="$REGION" --format="table[box](
  metadata.name:label=JOB,
  status.executionCount:label=RUNS,
  status.latestCreatedExecution.completionTimestamp.date():label=LAST_RUN
)" 2>/dev/null || echo "  No Cloud Run jobs found"
echo ""

# ----------------------------------------------------------
# Cloud SQL
# ----------------------------------------------------------
echo "═══ Cloud SQL ═══"
echo ""
gcloud sql instances list --format="table[box](
  name:label=INSTANCE,
  settings.tier:label=TIER,
  databaseVersion:label=VERSION,
  settings.dataDiskSizeGb:label=DISK_GB,
  settings.dataDiskType:label=DISK_TYPE,
  state:label=STATE,
  region:label=REGION,
  settings.availabilityType:label=AVAILABILITY
)" 2>/dev/null || echo "  No Cloud SQL instances found"
echo ""

# DB disk usage
echo "  Disk usage:"
DISK_USED=$(gcloud sql instances describe nobrainy-db --format="value(diskEncryptionStatus.kind,settings.dataDiskSizeGb)" 2>/dev/null)
gcloud monitoring metrics list --filter="metric.type=cloudsql.googleapis.com/database/disk/bytes_used" --limit=1 > /dev/null 2>&1
# Show current disk allocation and databases
DISK_SIZE=$(gcloud sql instances describe nobrainy-db --format="value(settings.dataDiskSizeGb)" 2>/dev/null || echo "?")
echo "    Disk allocated: ${DISK_SIZE}GB"
echo "    Databases:"
gcloud sql databases list --instance=nobrainy-db --format="value(name)" 2>/dev/null | while read -r db; do
  echo "      - $db"
done
echo ""

# ----------------------------------------------------------
# Artifact Registry
# ----------------------------------------------------------
echo "═══ Artifact Registry ═══"
echo ""
gcloud artifacts repositories list --location="$REGION" --format="table[box](
  name:label=REPO,
  format:label=FORMAT,
  sizeBytes.size():label=SIZE,
  createTime.date():label=CREATED
)" 2>/dev/null || echo "  No Artifact Registry repos found"

# Image count
echo ""
echo "  Recent images:"
gcloud artifacts docker images list "$REGION-docker.pkg.dev/$PROJECT_ID/nobrainy" \
  --sort-by=~UPDATE_TIME --limit=5 \
  --format="table(package:label=IMAGE, version:label=TAG, updateTime.date():label=UPDATED)" 2>/dev/null || echo "  Could not list images"
echo ""

# ----------------------------------------------------------
# Secret Manager
# ----------------------------------------------------------
echo "═══ Secret Manager ═══"
echo ""
gcloud secrets list --format="table[box](
  name:label=SECRET,
  replication.automatic:label=REPLICATION,
  createTime.date():label=CREATED
)" --filter="name~nobrainy" 2>/dev/null || echo "  No secrets found"

# Count versions
echo ""
echo "  Version counts:"
for secret in $(gcloud secrets list --format="value(name)" --filter="name~nobrainy" 2>/dev/null); do
  count=$(gcloud secrets versions list "$secret" --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
  echo "    $secret: $count versions"
done
echo ""

# ----------------------------------------------------------
# Billing (if accessible)
# ----------------------------------------------------------
echo "═══ Billing ═══"
echo ""
BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null)
if [ -n "$BILLING_ACCOUNT" ]; then
  echo "  Billing account: $BILLING_ACCOUNT"
else
  echo "  Could not retrieve billing info"
fi
echo ""

# ----------------------------------------------------------
# Cost Estimate
# ----------------------------------------------------------
echo "═══ Estimated Monthly Cost ═══"
echo ""
echo "  ┌───────────────────────────┬──────────────┬───────────────────────────────┐"
echo "  │ Product                   �� Est. Cost    │ Free Tier                     │"
echo "  ├───────────────────────────┼──────────────┼───────────────────────────────┤"
echo "  │ Cloud SQL (db-f1-micro)   │ ~\$8-10/mo   │ None (always-on)              │"
echo "  │ Cloud Run (scale to 0)    │ ~\$0-5/mo    │ 2M req/mo, 180K vCPU-sec     │"
echo "  │ Artifact Registry         │ ~\$0.10/GB   │ 500MB free                    │"
echo "  │ Secret Manager            │ ~\$0.06/sec  │ 6 active versions free        │"
echo "  │ Cloud Run Jobs            │ ~\$0.01/run  │ Included in Cloud Run quota   │"
echo "  ├───────────────────────────┼──────────────┼───────────────────────────────┤"
echo "  │ Total (low traffic)       │ ~\$10-20/mo  │                               │"
echo "  └───────────────────────────┴──────────────┴───────────────────────────────┘"
echo ""

# ----------------------------------------------------------
# External Services
# ----------------------------------------------------------
echo "═══ External Services ═══"
echo ""
echo "  ┌──────────────────┬─────────────────┬──────────────────────────────────┐"
echo "  │ Service          │ Tier            │ Cost                             │"
echo "  ├──────────────────┼─────────────────┼──────────────────────────────────┤"
echo "  │ Cloudflare DNS   │ Free            │ DNS + Workers proxy              │"
echo "  │ OpenAI API       │ Pay-per-use     │ ~\$0.001/req (gpt-4o-mini)       │"
echo "  │ OMDB API         │ Free (1K/day)   │ Movie/show metadata              │"
echo "  │ GitHub Actions   │ Free            │ 2,000 min/month                  │"
echo "  │ GoDaddy          │ Domain          │ Annual renewal                   │"
echo "  │ Google Analytics │ Free (GA4)      │ Unlimited                        │"
echo "  └──────────────────┴─────────────────┴──────────────────────────────────┘"
echo ""
echo "Done."
