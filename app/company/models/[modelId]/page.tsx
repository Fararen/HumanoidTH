import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureM02Seeded, serializeCompanyModel } from "@/lib/company-leaderboard";
import { hasSessionRole } from "@/lib/session";
import CompanyModelPortalClient from "./CompanyModelPortalClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "พอร์ทัลบริษัทและตัวอย่างการเผยแพร่รุ่น (M02 · /company/models/:modelId) | HumanoidTH",
  description:
    "ติดตามสถานะร่าง ส่งตรวจ ขอแก้ไข หรือผ่านเกณฑ์ พร้อมตรวจสอบตัวอย่างฟิลด์สาธารณะและยืนยันการเผยแพร่ขึ้น Company Leaderboard"
};

export default async function CompanyModelDetailPage({
  params
}: {
  params: Promise<{ modelId: string }>;
}) {
  if (!await hasSessionRole("COMPANY", "ADMIN")) redirect("/profile?from=/company/models");
  await ensureM02Seeded();
  const { modelId } = await params;

  const found = await prisma.companyModelEvaluation.findFirst({
    where: {
      OR: [{ id: modelId }, { modelCode: modelId }]
    }
  });

  if (!found) {
    notFound();
  }

  return <CompanyModelPortalClient initialModel={serializeCompanyModel(found)} />;
}
