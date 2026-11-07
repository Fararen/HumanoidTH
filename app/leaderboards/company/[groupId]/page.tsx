import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GROUP_ID,
  M02_GROUPS,
  ensureM02Seeded,
  serializeCompanyModel
} from "@/lib/company-leaderboard";
import CompanyLeaderboardClient from "../CompanyLeaderboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "M02 · Company Leaderboard และการเผยแพร่ผลประเมินรายรุ่น | HumanoidTH",
  description:
    "ตารางเปรียบเทียบหุ่นยนต์ระดับบริษัทที่ผ่านเกณฑ์โปรโตคอล Safety, Precision (มม.) และ Speed (วินาทีต่อรอบ) พร้อมระบบส่งประเมินและยืนยันเผยแพร่"
};

export default async function CompanyLeaderboardGroupPage({
  params
}: {
  params: Promise<{ groupId: string }>;
}) {
  await ensureM02Seeded();
  const { groupId } = await params;
  const resolvedGroupId = M02_GROUPS[groupId] ? groupId : DEFAULT_GROUP_ID;
  const groupMeta = M02_GROUPS[resolvedGroupId];

  const rows = await prisma.companyModelEvaluation.findMany({
    where: { groupId: resolvedGroupId },
    orderBy: [{ precisionMm: "asc" }, { speedSec: "asc" }, { createdAt: "asc" }]
  });

  const models = rows.map(serializeCompanyModel);

  return (
    <CompanyLeaderboardClient
      groupMeta={groupMeta}
      initialModels={models}
    />
  );
}
