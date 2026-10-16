CREATE TABLE "core_import_receipts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientRequestId" TEXT NOT NULL,
  "digest" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "core_import_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "core_import_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "core_import_receipts_userId_clientRequestId_key" ON "core_import_receipts"("userId", "clientRequestId");
CREATE UNIQUE INDEX "core_import_receipts_userId_digest_key" ON "core_import_receipts"("userId", "digest");
