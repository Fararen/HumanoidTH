import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureM02Seeded, serializeCompanyModel } from "@/lib/company-leaderboard";
import { hasSessionRole } from "@/lib/session";
import OpsEvaluatorClient from "./OpsEvaluatorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ผู้ตรวจประเมินรุ่นตามโปรโตคอล (M02 · /ops/company/:modelId) | HumanoidTH",
  description:
    "หน้าทำงานของผู้ตรวจที่ได้รับมอบหมายเพื่อตรวจสอบเวอร์ชันของรุ่นกับรายงานตัวอย่าง และบันทึกผลผ่านเกณฑ์หรือขอให้บริษัทแก้ไข"
};

export default async function OpsEvaluatorPage({
  params
}: {
  params: Promise<{ modelId: string }>;
}) {
  if (!await hasSessionRole("ADMIN")) redirect("/profile?from=/ops/company");
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

  return <OpsEvaluatorClient initialModel={serializeCompanyModel(found)} />;
}
