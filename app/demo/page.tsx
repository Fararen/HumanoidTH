import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import { publicDemoSandboxEnabled } from "@/lib/demo-mode";

async function requireDemoMode() {
  const host = (await headers()).get("host") || "";
  const localDemo = process.env.LOCAL_DEMO_MODE === "1" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const sandboxDemo = publicDemoSandboxEnabled;
  if (!localDemo && !sandboxDemo) notFound();
}
async function chooseRole(form: FormData) {
  "use server";
  await requireDemoMode();
  const user = await prisma.user.findUnique({ where: { id: String(form.get("id")) } });
  if (!user || !user.email.endsWith("@demo.humanoidth.local")) notFound();
  await setSessionUser(user);
  redirect("/me");
}
export default async function DemoPage() {
  await requireDemoMode();
  const accounts = await prisma.user.findMany({ where: { email: { endsWith: "@demo.humanoidth.local" } }, orderBy: { role: "asc" } });
  const sharedSandbox = publicDemoSandboxEnabled;
  return <div className="platform-page"><h1>บัญชีเดโม · Demo accounts</h1><p>{sharedSandbox ? "พื้นที่ทดลองสาธารณะใช้ฐานข้อมูล sandbox แยกจาก Production · Public demo runs on an isolated sandbox database." : "ข้อมูลเดโมสำหรับทดลอง workflow บนเครื่องนี้ ไม่มีการรับรองผลหุ่นจริง"}</p>
    <div className="platform-grid">{accounts.map(user => <form key={user.id} action={chooseRole} className="platform-card"><h2>{user.role}</h2><p>{user.name}</p><input type="hidden" name="id" value={user.id} /><button>ใช้บทบาทนี้ · Open workspace</button></form>)}</div>
  </div>;
}
