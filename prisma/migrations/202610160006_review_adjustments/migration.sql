ALTER TABLE "daily_reviews" ADD COLUMN "whatMoved" TEXT NOT NULL DEFAULT '', ADD COLUMN "blockers" TEXT NOT NULL DEFAULT '', ADD COLUMN "tomorrowTaskId" TEXT, ADD COLUMN "closedAt" TIMESTAMP(3), ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "daily_reviews" ADD CONSTRAINT "daily_reviews_tomorrowTaskId_fkey" FOREIGN KEY ("tomorrowTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "weekly_reviews" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "weekStart" DATE NOT NULL,
 "stopDoing" TEXT NOT NULL DEFAULT '', "keepDoing" TEXT NOT NULL DEFAULT '', "startTrying" TEXT NOT NULL DEFAULT '', "reflectionMd" TEXT NOT NULL DEFAULT '',
 "outcomes" JSONB NOT NULL DEFAULT '[]', "nextTaskId" TEXT, "closedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "weekly_reviews_userId_weekStart_key" ON "weekly_reviews"("userId", "weekStart");
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_nextTaskId_fkey" FOREIGN KEY ("nextTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
