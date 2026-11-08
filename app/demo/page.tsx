import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";

async function localOnly() {
  const host = (await headers()).get("host") || "";
  if (process.env.LOCAL_DEMO_MODE !== "1" || !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) notFound();
}
async function chooseRole(form: FormData) {
  "use server";
  await localOnly();
  const user = await prisma.user.findUnique({ where: { id: String(form.get("id")) } });
  if (!user || !user.email.endsWith("@demo.humanoidth.local")) notFound();
  await setSessionUser(user);
  redirect("/me");
}
export default async function DemoPage() {
  await localOnly();
  const accounts = await prisma.user.findMany({ where: { email: { endsWith: "@demo.humanoidth.local" } }, orderBy: { role: "asc" } });
  return <div className="platform-page"><h1>บัญชีเดโม · Local demo accounts</h1><p>ข้อมูลเดโมสำหรับทดลอง workflow บนเครื่องนี้ ไม่มีการรับรองผลหุ่นจริง</p>
    <div className="platform-grid">{accounts.map(user => <form key={user.id} action={chooseRole} className="platform-card"><h2>{user.role}</h2><p>{user.name}</p><input type="hidden" name="id" value={user.id} /><button>ใช้บทบาทนี้ · Open workspace</button></form>)}</div>
  </div>;
}
