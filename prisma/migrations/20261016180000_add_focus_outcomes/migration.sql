-- AlterTable: a focus session ends with a result
ALTER TABLE "focus_sessions" ADD COLUMN "intention" TEXT NOT NULL DEFAULT '',
ADD COLUMN "outcome" TEXT,
ADD COLUMN "reflection" TEXT NOT NULL DEFAULT '',
ADD COLUMN "nextAction" TEXT,
ADD COLUMN "nextActionTaskId" TEXT;
