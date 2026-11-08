import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureM02Seeded, serializeCompanyModel } from "@/lib/company-leaderboard";
import { getSessionUser } from "@/lib/session";
import { companyAccess } from "@/lib/company-access";
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
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const { modelId } = await params;

  const found = await prisma.companyModelEvaluation.findFirst({
    where: {
      id: modelId
    }
  });

  if (!found || !(await companyAccess(user, found)).review) {
    notFound();
  }

  return <OpsEvaluatorClient initialModel={serializeCompanyModel(found)} />;
}
