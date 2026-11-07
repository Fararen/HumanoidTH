import type { Metadata } from "next";
import {
  DEFAULT_GROUP_ID,
  M02_GROUPS,
  loadM02CompanyModels
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
  const { groupId } = await params;
  const resolvedGroupId = M02_GROUPS[groupId] ? groupId : DEFAULT_GROUP_ID;
  const groupMeta = M02_GROUPS[resolvedGroupId];
  const { models, isDatabaseAvailable } = await loadM02CompanyModels(resolvedGroupId);

  return (
    <CompanyLeaderboardClient
      groupMeta={groupMeta}
      initialModels={models}
      isDatabaseAvailable={isDatabaseAvailable}
    />
  );
}
