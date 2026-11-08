import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RecordCards } from "@/components/platform/RecordView";
import { LESSONS, type PlatformData } from "@/lib/platform-catalog";
export const dynamic="force-dynamic";
export default async function Page() {
  const user=await getSessionUser(); if (!user) redirect("/sign-in?from=/me");
  const records=await prisma.platformRecord.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, take: 100 });
  const assignments=await prisma.platformRecord.findMany({ where: { assignedToId: user.id }, orderBy: { updatedAt: "desc" }, take: 30 });
  const progress=records.filter(record => record.kind === "PROGRESS"), next=LESSONS.find(lesson => !progress.some(record => (record.data as PlatformData).lessonId === lesson.id));
  return <div className="platform-page"><h1>พื้นที่ของฉัน · My workspace</h1><p>{user.name || user.email} · {user.role}</p><nav className="platform-links"><Link href="/learn">เรียน · Learn</Link><Link href="/simulator/grid-navigation/workspace">Simulator</Link><Link href="/evaluate">ประเมิน · Evaluate</Link><Link href="/competitions">แข่งขัน · Compete</Link><Link href="/leaderboards">อันดับ · Rankings</Link><Link href="/company/portal">Company</Link><Link href="/community/drafts">Drafts</Link><Link href="/profile">Profile</Link>{process.env.LOCAL_DEMO_MODE === "1" && <Link href="/demo">สลับบทบาทเดโม · Demo roles</Link>}</nav>
    <section className="platform-card"><h2>เรียนต่อ · Continue learning</h2><p>{progress.length} / {LESSONS.length} lessons complete</p><Link href={next ? `/learn/${next.id}` : "/learn"}>{next?.title || "ทบทวนบทเรียน · Review lessons"}</Link></section>
    {["ADMIN","LAB"].includes(user.role) && <Link href="/ops/lab">คิวห้องทดสอบ · Lab queue</Link>}
    {["ADMIN","ORGANIZER","JUDGE"].includes(user.role) && <Link href="/ops/challenges">งานแข่งขัน · Competition operations</Link>}
    {["ADMIN","MODERATOR"].includes(user.role) && <Link href="/ops/moderation">คิวรายงานเนื้อหา · Moderation</Link>}
    {assignments.length > 0 && <section><h2>งานที่ได้รับมอบหมาย · Assigned work</h2><RecordCards records={assignments} /></section>}
    {["EVALUATION","PROGRAM","RUN","COMPETITION","ENTRY","DRAFT","REPORT"].map(kind => <section key={kind}><h2>{kind}</h2><RecordCards records={records.filter(record => record.kind === kind)} /></section>)}
  </div>;
}
