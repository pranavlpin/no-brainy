-- AlterTable
ALTER TABLE "notes" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notes" ADD COLUMN "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "notes_shareId_key" ON "notes"("shareId");
