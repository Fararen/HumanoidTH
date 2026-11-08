import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/session";
import { publicDemoModeEnabled, publicDemoSandboxEnabled, temporaryProductionDemoEnabled } from "@/lib/demo-mode";

async function requireDemoMode() {
  const host = (await headers()).get("host") || "";
  const localDemo = process.env.LOCAL_DEMO_MODE === "1" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (!localDemo && !publicDemoModeEnabled()) notFound();
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
  const temporaryProductionDemo = temporaryProductionDemoEnabled();
  const notice = temporaryProductionDemo
    ? "เดโมชั่วคราวสำหรับ hackathon: บัญชี ADMIN ใช้ฐานข้อมูล Production และการแก้ไขมีผลกับข้อมูลจริง ระบบจะปิด demo อัตโนมัติเมื่อครบกำหนด · Temporary hackathon demo: ADMIN access uses Production data; changes affect live records. Demo access expires automatically."
    : sharedSandbox
      ? "พื้นที่ทดลองสาธารณะใช้ฐานข้อมูล sandbox แยกจาก Production · Public demo runs on an isolated sandbox database."
      : "ข้อมูลเดโมสำหรับทดลอง workflow บนเครื่องนี้ ไม่มีการรับรองผลหุ่นจริง";
  return <div className="platform-page"><h1>บัญชีเดโม · Demo accounts</h1><p>{notice}</p>
    <div className="platform-grid">{accounts.map(user => <form key={user.id} action={chooseRole} className="platform-card"><h2>{user.role}</h2><p>{user.name}</p><input type="hidden" name="id" value={user.id} /><button>ใช้บทบาทนี้ · Open workspace</button></form>)}</div>
  </div>;
}
