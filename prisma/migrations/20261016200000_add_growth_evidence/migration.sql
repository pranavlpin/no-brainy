-- AlterTable: what success looks like, how it is measured, how often it is practised
ALTER TABLE "goals" ADD COLUMN "successCriteria" TEXT NOT NULL DEFAULT '',
ADD COLUMN "baseline" DOUBLE PRECISION,
ADD COLUMN "target" DOUBLE PRECISION,
ADD COLUMN "unit" TEXT,
ADD COLUMN "weeklyPracticeTarget" INTEGER;

-- CreateTable: dated evidence of growth, optionally sourced
CREATE TABLE "growth_evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "observedAt" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "measurement" DOUBLE PRECISION,
    "kind" TEXT NOT NULL DEFAULT 'reflection',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "sourceTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "growth_evidence_userId_clientRequestId_key" ON "growth_evidence"("userId", "clientRequestId");
CREATE INDEX "growth_evidence_goalId_observedAt_idx" ON "growth_evidence"("goalId", "observedAt");
CREATE INDEX "growth_evidence_userId_observedAt_idx" ON "growth_evidence"("userId", "observedAt");

-- AddForeignKey
ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_evidence" ADD CONSTRAINT "growth_evidence_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
