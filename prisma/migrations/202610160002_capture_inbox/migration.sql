-- CreateTable
CREATE TABLE "captures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "state" TEXT NOT NULL DEFAULT 'inbox',
    "destinationType" TEXT,
    "destinationId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "captures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "captures_userId_state_createdAt_idx" ON "captures"("userId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "captures_userId_clientRequestId_key" ON "captures"("userId", "clientRequestId");

-- AddForeignKey
ALTER TABLE "captures" ADD CONSTRAINT "captures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

