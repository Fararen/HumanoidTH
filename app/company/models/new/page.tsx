import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasSessionRole } from "@/lib/session";
import CompanyNewModelClient from "./CompanyNewModelClient";

export const metadata: Metadata = {
  title: "ยื่นรุ่นหุ่นยนต์เพื่อรับการประเมิน (M02 · /company/models/new) | HumanoidTH",
  description:
    "แบบฟอร์มยื่นข้อมูลขั้นต่ำของรุ่นหุ่นยนต์ (บริษัท, ผู้ติดต่อ, ชื่อรุ่น, ฮาร์ดแวร์, เฟิร์มแวร์, งาน และโปรโตคอล) เพื่อเข้าสู่วงจรตรวจผลและเผยแพร่บน Company Leaderboard"
};

export default async function CompanyNewModelPage() {
  if (!await hasSessionRole("COMPANY", "ADMIN")) redirect("/profile?from=/company/models/new");
  return <CompanyNewModelClient />;
}
