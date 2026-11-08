import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PlatformData } from "@/lib/platform-catalog";
export const dynamic = "force-dynamic";
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ round?: string }> }) {
  const id=(await params).id, round=(await searchParams).round || "ALL";
  if (!["ALL","ONLINE","ONSITE"].includes(round)) notFound();
  const competition = await prisma.platformRecord.findUnique({ where: { id } });
  if (!competition || competition.kind !== "COMPETITION" || !competition.isPublished) notFound();
  const data=competition.data as PlatformData;
  const entries=competition.status === "RESULTS_PUBLISHED" ? await prisma.platformRecord.findMany({ where: { kind: "ENTRY", parentId: id, status: "FINAL" } }) : [];
  const rows=entries.filter(record => round === "ALL" || (record.data as PlatformData).round === round).sort((a,b) => Number((b.data as PlatformData).score)-Number((a.data as PlatformData).score) || a.createdAt.getTime()-b.createdAt.getTime() || a.id.localeCompare(b.id));
  return <div className="platform-page"><Link href={`/competitions/${id}`}>← {competition.title}</Link><h1>อันดับที่รับรองแล้ว · Official results</h1><p>{String(data.format)} · Rules {String(data.rulesVersion)} · Results revision {String(data.resultsVersion)}</p><p className="platform-notice">ข้อมูลเดโม · Pilot competition</p><nav className="platform-links">{["ALL","ONLINE","ONSITE"].map(value => <Link key={value} href={`?round=${value}`}>{value}</Link>)}</nav>
    {(round === "ALL" ? ["ONLINE", "ONSITE"] : [round]).map(group => <section key={group}><h2>{group}</h2><div className="platform-table"><table><thead><tr><th>Rank</th><th>Team</th><th>Round</th><th>Score</th></tr></thead><tbody>{rows.filter(record => (record.data as PlatformData).round === group).map((record,index) => { const result=record.data as PlatformData; return <tr key={record.id}><td>{index+1}</td><td>{String(result.teamName)}</td><td>{String(result.round)}</td><td>{String(result.score)}</td></tr>; })}</tbody></table></div></section>)}
    {competition.status !== "RESULTS_PUBLISHED" && <p>ผลยังไม่ประกาศ · Final results have not been published.</p>}
    <p>Score descending; ties use earliest application, then entry ID. Personal eligibility/contact data is private.</p>
  </div>;
}
