import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getRecord, listRecords } from "@/lib/platform-store";
import { detailPath, evaluationFields, programFields, competitionFields, entryFields, draftFields, type Field, type PlatformItem } from "@/lib/platform-catalog";
import { ActionForm, CreateForm } from "./Forms";
import RunReplay from "./RunReplay";
import RecordExport from "./RecordExport";

export function RecordCards({ records }: { records: { id: string; title: string; kind: string; status: string; parentId?: string | null }[] }) {
  return records.length ? <div className="platform-grid">{records.map(record => <Link key={record.id} href={detailPath(record)} className="platform-card"><small>{record.kind} · {record.status}</small><h3>{record.title}</h3></Link>)}</div> : <p>ยังไม่มีรายการ · No records yet.</p>;
}
const reason: Field = { key: "reason", label: "เหตุผลและข้อสังเกต · Notes / reason", type: "textarea", required: true };
export default async function RecordView({ id, publicOnly = false }: { id: string; publicOnly?: boolean }) {
  const user = await getSessionUser();
  let raw;
  try { raw = await getRecord(id, user, publicOnly); }
  catch { return <div className="platform-page"><h1>ไม่พบรายการหรือไม่มีสิทธิ์ · Record unavailable</h1><p>Check your account and connection, then try again.</p><Link href={`/sign-in?from=${encodeURIComponent(`/me/work/${id}`)}`}>Sign in</Link> · <Link href="/me">My workspace</Link></div>; }
  const record = JSON.parse(JSON.stringify(raw)) as PlatformItem;
  const admin = user?.role === "ADMIN", owner = user?.id === record.ownerId;
  const assigned = user?.id === record.assignedToId;
  const actions: { action: string; label: string; fields?: Field[] }[] = [];
  const add = (condition: boolean | undefined, action: string, label: string, fields?: Field[]) => { if (condition) actions.push({ action, label, fields }); };
  const data = record.data;
  let entries: Awaited<ReturnType<typeof listRecords>> = [];
  if (record.kind === "EVALUATION") {
    const lab = admin || assigned && user?.role === "LAB";
    add(owner && ["DRAFT","NEEDS_INFO"].includes(record.status), "SAVE", "แก้ไขคำขอ · Edit request", evaluationFields);
    add(owner && ["DRAFT","NEEDS_INFO"].includes(record.status), "SUBMIT", "ส่งคำขอประเมิน · Submit request");
    add(lab && ["SUBMITTED","PLANNED"].includes(record.status), "REQUEST_INFO", "ขอข้อมูลเพิ่ม · Request information", [reason]);
    add(lab && record.status === "SUBMITTED", "PLAN", "เสนอแผนและนัดหมาย · Propose plan", [{ key: "costTHB", label: "ค่าใช้จ่ายที่ตกลง (THB)", type: "number", required: true }, { key: "appointment", label: "วันนัด (ISO datetime with timezone)", required: true }, reason]);
    add(owner && record.status === "PLANNED", "CONFIRM", "ยืนยันแผน ค่าใช้จ่าย และวันนัด · Confirm plan");
    add(lab && record.status === "CONFIRMED", "RECEIVE", "รับหุ่นยนต์ · Record intake", [reason]);
    add(lab && record.status === "RECEIVED", "START_TEST", "เริ่มทดสอบ · Start testing");
    add(lab && record.status === "TESTING", "RECORD_RESULTS", "บันทึกผล 5 รอบ · Record rounds", [{ key: "rounds", label: "ผลรายรอบ · Round measurements" }]);
    add(lab && record.status === "REVIEW", "CERTIFY", "รับรองรายงานเดโม · Certify pilot report", [reason]);
    add(lab && record.status === "CERTIFIED" && !data.returnedAt, "RETURN_ROBOT", "คืนหุ่นยนต์ · Record return", [reason]);
    add(owner && record.status === "CERTIFIED" && data.safetyPassed === true && !record.isPublished, "PUBLISH", "ยินยอมเผยแพร่ตัวชี้วัดใน Benchmark · Publish metrics", [{ key: "showFirmwareVersion", label: "เผยแพร่เวอร์ชัน Firmware ด้วย", type: "checkbox" }, { key: "showEvidence", label: "เผยแพร่หลักฐานรายรอบด้วย", type: "checkbox" }]);
  }
  if (record.kind === "PROGRAM") add(owner, "SAVE", "บันทึกโปรแกรม · Save program", programFields);
  if (record.kind === "RUN") {
    add(owner && ["QUEUED","RUNNING"].includes(record.status), "CANCEL", "ยกเลิกรอบ · Cancel run");
    add(owner && record.status === "SUCCEEDED" && data.purpose === "EVALUATION" && !record.parentId && !record.isPublished, "PUBLISH", "ยินยอมเผยแพร่ผลจำลอง · Publish simulation result", [{ key: "showProgram", label: "เผยแพร่โปรแกรมด้วย · Include program", type: "checkbox" }]);
  }
  if (record.kind === "COMPETITION") {
    add(owner && record.status === "DRAFT", "SAVE", "แก้ไขกติกา · Edit competition", competitionFields);
    add((owner || admin) && record.status === "DRAFT", "OPEN", "เปิดรับสมัคร · Open registration");
    add((owner || admin) && record.status === "OPEN", "CLOSE", "ปิดรับสมัคร · Close registration");
    add((owner || admin) && ["CLOSED","RESULTS_PUBLISHED"].includes(record.status), "PUBLISH_RESULTS", "ประกาศผลที่รับรองแล้ว · Publish final results");
    if (owner || admin || assigned) entries = await listRecords("ENTRY", user, "ops", id);
    else if (user) entries = await listRecords("ENTRY", user, "mine", id);
  }
  if (record.kind === "ENTRY") {
    const parent = record.parentId ? await prisma.platformRecord.findUnique({ where: { id: record.parentId } }) : null;
    const organizer = admin || parent?.ownerId === user?.id;
    const judge = admin || assigned || parent?.assignedToId === user?.id;
    add(owner && record.status === "NEEDS_REVISION", "SAVE", "แก้ใบสมัครเดิม · Correct application", entryFields);
    add(organizer && record.status === "APPLIED", "REQUEST_INFO", "ขอแก้ใบสมัคร · Request correction", [reason]);
    add(organizer && record.status === "APPLIED", "ACCEPT", "ยืนยันคุณสมบัติ · Accept eligibility");
    add(organizer && ["APPLIED", "NEEDS_REVISION"].includes(record.status), "REJECT", "ไม่ผ่านคุณสมบัติ · Reject eligibility", [reason]);
    add(organizer && ["ELIGIBLE","QUALIFIED"].includes(record.status) && data.round === "ONSITE", "CHECK_IN", "เช็กอินทีม · Check in", [reason]);
    const verifiedRuns = judge && data.round === "ONLINE" ? await prisma.platformRecord.findMany({ where: { kind: "RUN", parentId: record.id, status: "SUCCEEDED" }, orderBy: { createdAt: "desc" } }) : [];
    add(judge && ["ELIGIBLE","CHECKED_IN"].includes(record.status), "SCORE", "บันทึกผลเบื้องต้น · Record provisional result", data.round === "ONLINE" ? [{ key: "runId", label: "รอบจำลองที่ตรวจแล้ว · Verified competition run", type: "select", options: verifiedRuns.map(run => run.id), optionLabels: Object.fromEntries(verifiedRuns.map(run => [run.id,`${run.title} · ${run.createdAt.toISOString()}`])), required: true }, reason] : [{ key: "score", label: "Score (0–100)", type: "number", required: true }, { key: "evidenceUrl", label: "Evidence URL", type: "url", required: true }, reason]);
    add(owner && record.status === "PROVISIONAL", "APPEAL", "ทักท้วงผล · Submit appeal", [reason]);
    add(judge && record.status === "APPEALED", "RESOLVE_APPEAL", "วินิจฉัยคำทักท้วง · Resolve appeal", [{ key: "score", label: "Score (0–100)", type: "number", required: true }, reason]);
    add(judge && record.status === "PROVISIONAL", "FINALIZE", "รับรองผลหลังปิดทักท้วง · Finalize result");
    add(judge && record.status === "FINAL", "AMEND_SCORE", "แก้ผลพร้อมเหตุผล · Amend final score", [{ key: "score", label: "Score (0–100)", type: "number", required: true }, reason]);
  }
  if (record.kind === "DRAFT") {
    add(owner && record.status === "DRAFT", "SAVE", "บันทึกร่างในบัญชี · Save account draft", draftFields);
    add(owner && record.status === "DRAFT", "PUBLISH", "เผยแพร่โพสต์ · Publish post");
  }
  if (record.kind === "REPORT" && record.status === "OPEN" && (admin || user?.role === "MODERATOR")) for (const [action,label] of [["HIDE","ซ่อนเนื้อหา · Hide post"],["RESTORE","คืนเนื้อหา · Restore post"],["DISMISS","ปิดรายงาน · Dismiss report"]]) actions.push({ action, label, fields: [reason] });
  if (record.isPublished && ["EVALUATION", "RUN"].includes(record.kind)) add(owner, "WITHDRAW", "ถอนความยินยอมเผยแพร่ · Withdraw publication");
  const assignRole = record.kind === "EVALUATION" ? "LAB" : "JUDGE";
  const canAssign = (admin || record.kind === "COMPETITION" && owner) && ["EVALUATION","COMPETITION"].includes(record.kind);
  const staff = canAssign ? await prisma.user.findMany({ where: { role: assignRole }, select: { id: true, name: true } }) : [];
  const programs = owner && record.kind === "ENTRY" ? await prisma.platformRecord.findMany({ where: { kind: "PROGRAM", ownerId: user!.id }, orderBy: { updatedAt: "desc" } }) : [];
  const events = owner || admin || assigned || record.kind === "ENTRY" && actions.length ? await prisma.platformEvent.findMany({ where: { recordId: id }, orderBy: { revision: "asc" } }) : [];
  return <div className="platform-page"><Link href="/me">← พื้นที่ของฉัน · My workspace</Link><header><small>{record.kind} · {record.status} · Revision {record.revision}</small><h1>{record.title}</h1><p className="platform-id">ID: {record.id}</p></header>
    {data.isDemoData === true && <p className="platform-notice">ข้อมูลเดโม · Pilot demonstration data. ตัวอย่างนี้ไม่ใช่การรับรองผลหุ่นยนต์จริง</p>}
    {["EVALUATION", "RUN"].includes(record.kind) && <div className="platform-card"><RecordExport record={record} /><p>Public results include the task, protocol, version and measured metrics. Contact details, intake notes and private documents stay in your account; optional evidence is included only with your consent.</p></div>}
    <section className="platform-card"><h2>รายละเอียด · Details</h2><dl className="platform-summary">{Object.entries(data).filter(([key]) => !["events","rounds","program"].includes(key)).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd></div>)}</dl></section>
    {record.kind === "RUN" && <RunReplay events={(data.events || []) as { seq: number; x: number; y: number; action: string }[]} pending={["QUEUED","RUNNING"].includes(record.status)} />}
    {data.program !== undefined && <pre className="platform-code">{String(data.program)}</pre>}
    {Array.isArray(data.rounds) && <section className="platform-card"><h2>ผลรายรอบ · Round results</h2><div className="platform-table"><table><thead><tr><th>Round</th><th>Precision (mm)</th><th>Speed (s)</th><th>Safety</th><th>Evidence</th></tr></thead><tbody>{(data.rounds as { precisionMm: number; speedSec: number; safetyPassed: boolean; evidenceUrl: string }[]).map((round,index) => <tr key={index}><td>{index+1}</td><td>{round.precisionMm}</td><td>{round.speedSec}</td><td>{round.safetyPassed ? "Pass" : "Fail"}</td><td><a href={round.evidenceUrl} target="_blank" rel="noreferrer">Source</a></td></tr>)}</tbody></table></div></section>}
    {staff.length > 0 && <ActionForm record={record} action="ASSIGN" label="มอบหมายงาน · Assign" fields={[{ key: "assignedToId", label: "ผู้รับผิดชอบ · Responsible staff", type: "select", options: staff.map(item => item.id), optionLabels: Object.fromEntries(staff.map(item => [item.id, item.name || item.id])), required: true }]} />}
    <div className="platform-grid">{actions.map(item => <ActionForm key={`${item.action}-${record.revision}`} record={record} {...item} />)}</div>
    {record.kind === "PROGRAM" && owner && <section className="platform-card"><h2>รันโปรแกรมที่บันทึกแล้ว · Run saved program</h2><CreateForm kind="RUN" title={`Run ${record.title}`} defaults={{ programId: id }} fields={[{ key: "purpose", label: "Purpose", type: "select", options: ["PRACTICE","EVALUATION"] }]} label="ส่งเข้าคิว · Queue run" /></section>}
    {record.kind === "ENTRY" && owner && record.status === "ELIGIBLE" && data.round === "ONLINE" && <section className="platform-card"><h2>ส่งโปรแกรมเข้าแข่งขัน · Submit competition program</h2><Link href="/simulator/grid-navigation/workspace">เปิด Workspace เพื่อบันทึกโปรแกรมก่อน</Link><CreateForm kind="RUN" title={`Competition run ${record.title}`} parentId={record.id} fields={[{ key: "programId", label: "โปรแกรมที่บันทึก · Saved program", type: "select", options: programs.map(program => program.id), optionLabels: Object.fromEntries(programs.map(program => [program.id,program.title])), required: true }]} label="ส่งประเมินรอบ Online · Queue competition run" /></section>}
    {record.kind === "ENTRY" && record.status === "QUALIFIED" && <p className="platform-notice">ผ่านเข้ารอบ On-site · Qualified. Open the competition for the venue/schedule and present for check-in.</p>}
    {record.kind === "DRAFT" && typeof data.postId === "string" && <Link href={`/community/${data.postId}`}>เปิดโพสต์ที่เผยแพร่ · View published post</Link>}
    {record.kind === "COMPETITION" && <section><h2>ทีมและผล · Teams and results</h2><Link href={`/competitions/${id}/apply`}>สมัครทีม · Apply</Link> · <Link href={`/leaderboards/competition/${id}`}>อันดับทางการ · Official leaderboard</Link><RecordCards records={entries} /></section>}
    {record.kind === "EVALUATION" && record.status === "CERTIFIED" && <p><Link href={`/me/evaluations/${id}/report`}>เปิดรายงาน · Open report</Link></p>}
    {record.isPublished && ["EVALUATION","RUN"].includes(record.kind) && <p><Link href={`/results/${id}`}>ผลสาธารณะ · Public result</Link> · <Link href={`/leaderboards/benchmark/${data.groupId}`}>Benchmark</Link></p>}
    {events.length > 0 && <section className="platform-card"><h2>ประวัติการดำเนินงาน · Audit history</h2><ol>{events.map(event => <li key={event.id}>#{event.revision} · {event.action} · {event.createdAt.toISOString()} · {JSON.stringify(event.details)}</li>)}</ol></section>}
  </div>;
}
