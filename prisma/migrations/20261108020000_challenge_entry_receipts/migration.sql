-- ChallengeSubmission existed in schema.prisma but not in the migration history.
-- Preserve rows on installations that previously used prisma db push.
CREATE TABLE IF NOT EXISTS "ChallengeSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "solutionTitle" TEXT NOT NULL,
    "description" TEXT,
    "repoUrl" TEXT,
    "dockerImage" TEXT,
    "hardwareSpecs" TEXT,
    "benchmarkScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeSubmission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChallengeSubmission" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN IF NOT EXISTS "requestKey" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN IF NOT EXISTS "submittedById" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ChallengeSubmission_requestKey_key" ON "ChallengeSubmission"("requestKey");
CREATE INDEX IF NOT EXISTS "ChallengeSubmission_challengeId_idx" ON "ChallengeSubmission"("challengeId");
CREATE INDEX IF NOT EXISTS "ChallengeSubmission_status_idx" ON "ChallengeSubmission"("status");
CREATE INDEX IF NOT EXISTS "ChallengeSubmission_submittedById_challengeId_submittedAt_idx"
    ON "ChallengeSubmission"("submittedById", "challengeId", "submittedAt");
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
