import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import CompanyTools from "./tools";
export const dynamic = "force-dynamic";
export default async function CompanyPortal() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?from=/company/portal");
  const memberships = await prisma.companyMembership.findMany({ where: { userId: user.id } });
  const models = await prisma.companyModelEvaluation.findMany({ where: user.role === "ADMIN" ? {} : user.role === "REVIEWER" ? { reviewerId: user.id } : { companyId: { in: memberships.map(item => item.companyId) } }, orderBy: { updatedAt: "desc" } });
  const reviewers = user.role === "ADMIN" ? await prisma.user.findMany({ where: { role: "REVIEWER" }, select: { id: true, name: true } }) : [];
  return <div className="platform-page"><h1>พอร์ทัลบริษัท · Company workspace</h1><p>จัดการแต่ละรุ่นและเวอร์ชัน ผลที่เผยแพร่ต้องตรงกับเวอร์ชันที่ตรวจแล้ว</p><Link href="/company/models/new">ยื่นรุ่นใหม่ · Submit model</Link>
    {models.length === 0 && <p>No models assigned to this account yet.</p>}
    <div className="platform-grid">{models.map(model => <article key={model.id} className="platform-card"><h2>{model.modelName} · {model.version}</h2><p>{model.companyName} · {model.workflowStatus}</p><p>{model.isDemoData ? "ข้อมูลเดโม · Demo data" : "Physical report required"}</p>
      <Link href={`/company/models/${model.id}`}>เปิดรุ่น · Open model</Link>{["ADMIN", "REVIEWER"].includes(user.role) && <> · <Link href={`/ops/company/${model.id}`}>ตรวจผล · Review</Link></>}
      <CompanyTools id={model.id} reviewers={reviewers} canEdit={user.role === "COMPANY" || user.role === "ADMIN"} reviewerId={model.reviewerId} />
      <details><summary>ประวัติเวอร์ชันนี้ · Version history</summary><ol>{Array.isArray(model.historyJson) && model.historyJson.map((item,index) => { const event=typeof item === "object" && item && !Array.isArray(item) ? item : {}; return <li key={index}>{String(event.action || "Update")} · {String(event.at || "")}</li>; })}</ol></details>
    </article>)}</div>
  </div>;
}
