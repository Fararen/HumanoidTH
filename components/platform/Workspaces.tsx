import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { listRecords } from "@/lib/platform-store";
import { type PlatformKind, type Field } from "@/lib/platform-catalog";
import { CreateForm } from "./Forms";
import { RecordCards } from "./RecordView";
import { prisma } from "@/lib/prisma";

export async function WorkspaceList({ kind, title, scope = "mine", createHref, introduction }: { kind: PlatformKind; title: string; scope?: "public" | "mine" | "ops"; createHref?: string; introduction?: string }) {
  const user = await getSessionUser();
  if (scope !== "public" && !user) {
    if (scope === "ops") redirect("/sign-in");
    const destination = kind === "DRAFT" ? "/community/drafts" : kind === "PROGRAM" ? "/simulator/grid-navigation/workspace" : "/me";
    redirect(`/guest?from=${encodeURIComponent(destination)}`);
  }
  const opsRoles = kind === "EVALUATION" ? ["ADMIN","LAB"] : kind === "COMPETITION" ? ["ADMIN","ORGANIZER","JUDGE"] : ["ADMIN","MODERATOR"];
  if (scope === "ops" && !opsRoles.includes(user!.role)) return <div className="platform-page"><h1>บัญชีนี้ไม่มีหน้าที่ในคิวนี้ · Staff role required</h1><Link href="/me">My workspace</Link></div>;
  const records = await listRecords(kind, user, scope);
  return <div className="platform-page"><h1>{title}</h1>{introduction && <p>{introduction}</p>}
    <nav className="platform-links"><Link href="/me">My workspace</Link>{createHref && <Link href={createHref}>สร้างรายการใหม่ · Create new</Link>}</nav><RecordCards records={records} />
  </div>;
}
export async function WorkspaceCreate({ kind, title, fields, parentId }: { kind: PlatformKind; title: string; fields: Field[]; parentId?: string }) {
  const user = await getSessionUser();
  const destinations: Partial<Record<PlatformKind,string>> = { EVALUATION: "/evaluate/physical/new", PROGRAM: "/simulator/grid-navigation/workspace", COMPETITION: "/ops/challenges/new", DRAFT: "/community/drafts/new", ENTRY: `/competitions/${parentId}/apply` };
  if (!user) redirect(`/${kind === "COMPETITION" ? "sign-in" : "guest"}?from=${encodeURIComponent(destinations[kind] || "/me")}`);
  if (kind === "COMPETITION" && !["ADMIN", "ORGANIZER"].includes(user.role)) return <div className="platform-page"><h1>Organizer account required</h1><Link href="/me">My workspace</Link></div>;
  if (kind === "EVALUATION") {
    const robots = await prisma.robotModel.findMany({ orderBy: { canonicalName: "asc" }, select: { id: true, canonicalName: true } });
    fields = fields.map(field => field.key === "robotId" ? { ...field, label: "รุ่นจากทะเบียน · Atlas robot", type: "select", options: robots.map(robot => robot.id), optionLabels: Object.fromEntries(robots.map(robot => [robot.id,robot.canonicalName])) } : field);
  }
  return <div className="platform-page"><Link href="/me">← My workspace</Link><h1>{title}</h1>{["EVALUATION","COMPETITION"].includes(kind) && <p className="platform-notice">Pilot demonstration protocol. ข้อมูลเดโม ไม่ใช่ผลรับรองหุ่นจริง</p>}<CreateForm kind={kind} fields={fields} parentId={parentId} /></div>;
}
