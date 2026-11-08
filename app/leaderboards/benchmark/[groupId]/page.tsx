import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PlatformData } from "@/lib/platform-catalog";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const physical = groupId === "physical-pick-place-pilot-v1";
  if (!physical && groupId !== "simulation-grid-navigation-grid-v1") notFound();
  const records = await prisma.platformRecord.findMany({ where: { kind: physical ? "EVALUATION" : "RUN", status: physical ? "CERTIFIED" : "SUCCEEDED", isPublished: true, data: { path: ["groupId"], equals: groupId } } });
  const sorted = records.filter(record => physical ? (record.data as PlatformData).safetyPassed === true : (record.data as PlatformData).verified === true).sort((a,b) => {
    const left = a.data as PlatformData, right = b.data as PlatformData;
    return physical ? Number(left.precisionMm)-Number(right.precisionMm) || Number(left.speedSec)-Number(right.speedSec) || a.id.localeCompare(b.id) : Number(right.score)-Number(left.score) || Number(left.steps)-Number(right.steps) || a.id.localeCompare(b.id);
  });
  return <div className="platform-page"><Link href="/leaderboards">← Leaderboards</Link><h1>{physical ? "Physical · Pick/place pilot" : "Simulation · Grid navigation"}</h1><p className="platform-notice">ข้อมูลเดโม · Pilot demonstration results. เผยแพร่เฉพาะผลที่ตรวจแล้วและเจ้าของยินยอม</p>
    <p>{physical ? "Protocol PILOT-PICK-PLACE-v1 · manipulator · safety pass required · precision mm ascending, then seconds/cycle ascending, then result ID" : "Scene grid-v1 · grid-agent · score descending, then command count ascending, then result ID"}</p>
    <div className="platform-table"><table><thead><tr><th>Rank</th><th>รายการ · Result</th><th>{physical ? "Precision (mm ↓)" : "Score (↑)"}</th><th>{physical ? "Speed (seconds ↓)" : "Commands (↓)"}</th><th>Date</th></tr></thead><tbody>{sorted.map((record,index) => { const data=record.data as PlatformData; return <tr key={record.id}><td>{index+1}</td><td><Link href={`/results/${record.id}`}>{record.title}</Link></td><td>{Number(physical ? data.precisionMm : data.score).toFixed(2)}</td><td>{Number(physical ? data.speedSec : data.steps).toFixed(2)}</td><td>{record.updatedAt.toISOString().slice(0,10)}</td></tr>; })}</tbody></table></div>
    {!sorted.length && <p>No consented verified results in this group yet.</p>}
  </div>;
}
