-- CreateEnum
CREATE TYPE "StashMessageType" AS ENUM ('TEXT', 'LINK', 'FILE');

-- CreateTable
CREATE TABLE "stash_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stash_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stash_messages" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StashMessageType" NOT NULL DEFAULT 'TEXT',
    "label" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "linkTitle" TEXT,
    "linkDescription" TEXT,
    "linkImageUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileMimeType" TEXT,
    "fileGcsObject" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stash_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stash_channels_userId_isDeleted_idx" ON "stash_channels"("userId", "isDeleted");
CREATE INDEX "stash_channels_userId_isPinned_lastMessageAt_idx" ON "stash_channels"("userId", "isPinned", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "stash_messages_channelId_isDeleted_createdAt_idx" ON "stash_messages"("channelId", "isDeleted", "createdAt" DESC);
CREATE INDEX "stash_messages_userId_isDeleted_createdAt_idx" ON "stash_messages"("userId", "isDeleted", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "stash_channels" ADD CONSTRAINT "stash_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stash_messages" ADD CONSTRAINT "stash_messages_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "stash_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stash_messages" ADD CONSTRAINT "stash_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
