-- CreateTable: one receipt per confirmed core import, so a retry never duplicates
CREATE TABLE "core_import_receipts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "core_import_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "core_import_receipts_userId_clientRequestId_key" ON "core_import_receipts"("userId", "clientRequestId");
CREATE UNIQUE INDEX "core_import_receipts_userId_digest_key" ON "core_import_receipts"("userId", "digest");

-- AddForeignKey
ALTER TABLE "core_import_receipts" ADD CONSTRAINT "core_import_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
