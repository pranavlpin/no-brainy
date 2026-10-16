CREATE TABLE "focus_sessions" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "activeOwner" TEXT, "clientRequestId" TEXT NOT NULL,
 "taskId" TEXT, "taskTitle" TEXT NOT NULL, "intention" TEXT NOT NULL DEFAULT '',
 "state" TEXT NOT NULL DEFAULT 'running', "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "activeSince" TIMESTAMP(3), "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0, "plannedSeconds" INTEGER NOT NULL,
 "completedAt" TIMESTAMP(3), "outcome" TEXT, "reflection" TEXT NOT NULL DEFAULT '', "nextAction" TEXT NOT NULL DEFAULT '',
 "nextActionId" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "focus_sessions_activeOwner_key" ON "focus_sessions"("activeOwner");
CREATE UNIQUE INDEX "focus_sessions_userId_clientRequestId_key" ON "focus_sessions"("userId", "clientRequestId");
CREATE INDEX "focus_sessions_userId_completedAt_idx" ON "focus_sessions"("userId", "completedAt");
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
