-- AlterTable: planned day separate from the deadline, planning metadata, numeric priority rank
ALTER TABLE "tasks" ADD COLUMN "plannedDate" DATE;
ALTER TABLE "tasks" ADD COLUMN "estimatedMinutes" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "effort" TEXT;
ALTER TABLE "tasks" ADD COLUMN "context" TEXT;
ALTER TABLE "tasks" ADD COLUMN "priorityRank" INTEGER NOT NULL DEFAULT 2;

-- Backfill rank from the existing priority label (0 urgent … 3 low)
UPDATE "tasks" SET "priorityRank" = CASE "priority"
  WHEN 'urgent' THEN 0
  WHEN 'high' THEN 1
  WHEN 'medium' THEN 2
  WHEN 'low' THEN 3
  ELSE 2 END;

-- CreateIndex
CREATE INDEX "tasks_userId_plannedDate_idx" ON "tasks"("userId", "plannedDate");
CREATE INDEX "tasks_userId_priorityRank_idx" ON "tasks"("userId", "priorityRank");
