-- CreateTable: a project is an outcome with one explicit next action
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT '',
    "context" TEXT NOT NULL DEFAULT 'personal',
    "status" TEXT NOT NULL DEFAULT 'active',
    "goalId" TEXT,
    "nextActionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_notes" (
    "projectId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,

    CONSTRAINT "project_notes_pkey" PRIMARY KEY ("projectId","noteId")
);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "projects_userId_status_idx" ON "projects"("userId", "status");
CREATE INDEX "tasks_userId_projectId_idx" ON "tasks"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_nextActionId_fkey" FOREIGN KEY ("nextActionId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_notes" ADD CONSTRAINT "project_notes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
