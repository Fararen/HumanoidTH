-- Restore feature tables omitted from the historical migrations.
-- IF NOT EXISTS preserves databases previously synchronized with db push.

CREATE TABLE IF NOT EXISTS "CommunityPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DISCUSSION',
    "communityName" TEXT NOT NULL DEFAULT 'r/HumanoidTH',
    "authorName" TEXT NOT NULL DEFAULT 'Robotics Explorer',
    "authorHandle" TEXT NOT NULL DEFAULT 'robotics_explorer',
    "authorBadge" TEXT NOT NULL DEFAULT 'Community Member',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT,
    "tags" TEXT[],
    "upvotes" INTEGER NOT NULL DEFAULT 1,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 1,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Robotics Enthusiast',
    "authorHandle" TEXT NOT NULL DEFAULT 'enthusiast',
    "authorBadge" TEXT NOT NULL DEFAULT 'Robotics Enthusiast',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 1,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunityVote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userKey" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HriSimulationRun" (
    "id" TEXT NOT NULL,
    "runCode" TEXT NOT NULL,
    "robotId" TEXT NOT NULL,
    "robotName" TEXT NOT NULL,
    "sceneVersion" TEXT NOT NULL DEFAULT 'wellness-reception-v1.0',
    "simulationMode" TEXT NOT NULL DEFAULT 'interactive-hri-living-lab',
    "testCaseType" TEXT NOT NULL,
    "terminalStatus" TEXT NOT NULL,
    "testCasePassed" BOOLEAN NOT NULL DEFAULT true,
    "navigationSucceeded" BOOLEAN NOT NULL DEFAULT false,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "errorReason" TEXT,
    "eventsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HriSimulationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanyModelEvaluation" (
    "id" TEXT NOT NULL,
    "modelCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0.0',
    "groupId" TEXT NOT NULL DEFAULT 'industrial-pick-place',
    "groupName" TEXT NOT NULL DEFAULT 'หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Industrial Pick & Place)',
    "protocolCode" TEXT NOT NULL DEFAULT 'TH-IND-PP-2026.1',
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "modelName" TEXT NOT NULL,
    "robotClass" TEXT NOT NULL DEFAULT 'Industrial Cobot / Manipulator',
    "hardwareSpec" TEXT NOT NULL,
    "firmwareVersion" TEXT NOT NULL,
    "taskEvaluated" TEXT NOT NULL DEFAULT 'การหยิบวางชิ้นงานความละเอียดสูงบนสายพาน (High-Precision Bin Picking & Palletizing)',
    "testConditions" TEXT NOT NULL DEFAULT 'ชิ้นงานมาตรฐาน 250g · ความเร็วสายพานคงที่ · ทดสอบต่อเนื่อง 50 รอบภายใต้โปรโตคอล TH-IND-PP-2026.1',
    "workflowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "safetyStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "precisionMm" DOUBLE PRECISION,
    "speedSec" DOUBLE PRECISION,
    "evaluatorName" TEXT DEFAULT 'ดร. ภาคภูมิ วงศ์วิศิษฏ์ (Lead Protocol Evaluator)',
    "evaluatorNotes" TEXT,
    "sampleReportTitle" TEXT,
    "sampleReportSummary" TEXT,
    "evidenceLinksJson" JSONB NOT NULL DEFAULT '[]',
    "publishedFieldsJson" JSONB NOT NULL DEFAULT '{}',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "allowContact" BOOLEAN NOT NULL DEFAULT true,
    "isDemoData" BOOLEAN NOT NULL DEFAULT true,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyModelEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPost_slug_key" ON "CommunityPost"("slug");

CREATE INDEX IF NOT EXISTS "CommunityPost_type_idx" ON "CommunityPost"("type");

CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

CREATE INDEX IF NOT EXISTS "CommunityPost_communityName_idx" ON "CommunityPost"("communityName");

CREATE INDEX IF NOT EXISTS "CommunityComment_postId_idx" ON "CommunityComment"("postId");

CREATE INDEX IF NOT EXISTS "CommunityComment_parentId_idx" ON "CommunityComment"("parentId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityVote_postId_userKey_key" ON "CommunityVote"("postId", "userKey");

CREATE UNIQUE INDEX IF NOT EXISTS "HriSimulationRun_runCode_key" ON "HriSimulationRun"("runCode");

CREATE INDEX IF NOT EXISTS "HriSimulationRun_robotId_idx" ON "HriSimulationRun"("robotId");

CREATE INDEX IF NOT EXISTS "HriSimulationRun_testCaseType_idx" ON "HriSimulationRun"("testCaseType");

CREATE INDEX IF NOT EXISTS "HriSimulationRun_createdAt_idx" ON "HriSimulationRun"("createdAt");

CREATE INDEX IF NOT EXISTS "CompanyModelEvaluation_groupId_isPublished_idx" ON "CompanyModelEvaluation"("groupId", "isPublished");

CREATE INDEX IF NOT EXISTS "CompanyModelEvaluation_workflowStatus_idx" ON "CompanyModelEvaluation"("workflowStatus");

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyModelEvaluation_modelCode_version_key" ON "CompanyModelEvaluation"("modelCode", "version");

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityComment_postId_fkey' AND connamespace = current_schema()::regnamespace) THEN ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityComment_parentId_fkey' AND connamespace = current_schema()::regnamespace) THEN ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityVote_postId_fkey' AND connamespace = current_schema()::regnamespace) THEN ALTER TABLE "CommunityVote" ADD CONSTRAINT "CommunityVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
