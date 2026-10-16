-- AlterTable: realistic-day settings on the day plan
ALTER TABLE "day_plans" ADD COLUMN "availableMinutes" INTEGER NOT NULL DEFAULT 180,
ADD COLUMN "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "workStart" TEXT,
ADD COLUMN "workEnd" TEXT;
