-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'REVIEWER';
ALTER TYPE "UserRole" ADD VALUE 'LAB';
ALTER TYPE "UserRole" ADD VALUE 'ORGANIZER';
ALTER TYPE "UserRole" ADD VALUE 'JUDGE';
ALTER TYPE "UserRole" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "CommunityPost" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "sourcesJson" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "visibilityStatus" TEXT NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "CompanyModelEvaluation" ADD COLUMN     "approvedSnapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "historyJson" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "physicalReportId" TEXT,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PlatformRecord" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "requestHash" TEXT,
    "uniqueKey" TEXT,
    "assignedToId" TEXT,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformEvent" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRecord_uniqueKey_key" ON "PlatformRecord"("uniqueKey");

-- CreateIndex
CREATE INDEX "PlatformRecord_kind_ownerId_idx" ON "PlatformRecord"("kind", "ownerId");

-- CreateIndex
CREATE INDEX "PlatformRecord_kind_status_isPublished_idx" ON "PlatformRecord"("kind", "status", "isPublished");

-- CreateIndex
CREATE INDEX "PlatformRecord_parentId_idx" ON "PlatformRecord"("parentId");

-- CreateIndex
CREATE INDEX "PlatformRecord_assignedToId_idx" ON "PlatformRecord"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformEvent_recordId_revision_key" ON "PlatformEvent"("recordId", "revision");

