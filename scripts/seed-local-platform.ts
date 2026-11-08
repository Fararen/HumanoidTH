import { config } from "dotenv";
config({ path: ".env.local", override: true, quiet: true });
const url = new URL(process.env.DATABASE_URL!);
if (process.env.LOCAL_DEMO_MODE !== "1" || url.hostname !== "127.0.0.1" || url.port !== "5433") throw new Error("This script only seeds the isolated local demo database");
const { prisma } = await import("../lib/prisma");
const { seedAtlasData } = await import("../lib/seed-importer");
const { ensureM02Seeded } = await import("../lib/company-leaderboard");
const { approvalSnapshot } = await import("../lib/company-policy");
for (const role of ["USER", "COMPANY", "ADMIN", "REVIEWER", "LAB", "ORGANIZER", "JUDGE", "MODERATOR"] as const) {
  await prisma.user.upsert({ where: { id: `local-${role.toLowerCase()}` }, update: {}, create: { id: `local-${role.toLowerCase()}`, email: `${role.toLowerCase()}@demo.humanoidth.local`, name: `Demo ${role}`, role } });
}
if (!await prisma.robotModel.count()) await seedAtlasData(prisma);
await ensureM02Seeded();
const models = await prisma.companyModelEvaluation.findMany({ where: { id: { in: ["m02-model-a", "m02-model-b", "m02-model-c"] } } });
for (const model of models) {
  if (!model.isDemoData) continue;
  await prisma.companyModelEvaluation.update({ where: { id: model.id }, data: { reviewerId: "local-reviewer", approvedSnapshot: model.workflowStatus === "PUBLISHED" || model.workflowStatus === "PASSED" ? approvalSnapshot(model) : {} } });
  if (model.companyId) await prisma.companyMembership.upsert({ where: { userId_companyId: { userId: "local-company", companyId: model.companyId } }, create: { userId: "local-company", companyId: model.companyId, role: "OWNER" }, update: {} });
}
const { GRID_TASK, PILOT_PROTOCOL } = await import("../lib/platform-catalog");
const robot = await prisma.robotModel.findFirstOrThrow();
const now = Date.now();
const samples = [
  { id: "pilot-starter-program", kind: "PROGRAM", ownerId: "local-user", title: "ข้อมูลเดโม · My first navigation program", status: "DRAFT", assignedToId: null, isPublished: false, data: { program: GRID_TASK.starter, taskId: GRID_TASK.id, sceneVersion: GRID_TASK.version, mode: "SIMULATION" } },
  { id: "pilot-evaluation-request", kind: "EVALUATION", ownerId: "local-user", title: "ข้อมูลเดโม · Physical evaluation request", status: "SUBMITTED", assignedToId: "local-lab", isPublished: false, data: { robotId: robot.id, version: "pilot-v1", firmwareVersion: "pilot-fw1", hardwareSpec: "ข้อมูลเดโมสำหรับฝึกระบบงานห้องทดสอบ", contactEmail: "user@demo.humanoidth.local", documents: [], protocol: PILOT_PROTOCOL, isDemoData: true, mode: "PHYSICAL", groupId: "physical-pick-place-pilot-v1" } },
  ...["ONLINE", "ONSITE", "HYBRID"].map(format => ({ id: `pilot-${format.toLowerCase()}-competition`, kind: "COMPETITION", ownerId: "local-organizer", title: `ข้อมูลเดโม · ${format} robotics pilot`, status: "OPEN", assignedToId: "local-judge", isPublished: true, data: { format, rules: "ข้อมูลเดโม: ทีมละหนึ่งบัญชี ลงทะเบียนก่อนปิดรับสมัคร คะแนน 0–100; Online ใช้ผลจาก grid-v1; On-site ใช้หลักฐานที่กรรมการบันทึก เสมอให้เรียงตามเวลาสมัครและรหัสใบสมัคร", closesAt: new Date(now + 7*86400_000).toISOString(), onlineAppealsUntil: new Date(now + 8*86400_000).toISOString(), appealsUntil: new Date(now + 10*86400_000).toISOString(), venue: format === "ONLINE" ? "Online simulator" : "สถานที่เดโม · Venue to be confirmed", onsiteAt: new Date(now + 9*86400_000).toISOString(), qualifyScore: 50, rulesVersion: "v1", taskId: GRID_TASK.id, sceneVersion: GRID_TASK.version, robotClass: GRID_TASK.robotClass, tieRule: "score descending, earliest application, then entry ID", isDemoData: true, resultsVersion: 0 } }))
];
for (const sample of samples) {
  await prisma.platformRecord.upsert({ where: { id: sample.id }, update: {}, create: sample as never });
  await prisma.platformEvent.upsert({ where: { recordId_revision: { recordId: sample.id, revision: 0 } }, update: {}, create: { recordId: sample.id, revision: 0, actorId: "local-demo-setup", action: "CREATE_DEMO" } });
}
await prisma.communityPost.upsert({ where: { id: "pilot-welcome" }, update: {}, create: { id: "pilot-welcome", slug: "pilot-welcome", authorId: "local-moderator", authorName: "Demo moderator", title: "ข้อมูลเดโม · เริ่มเรียนและทดลองหุ่นยนต์", content: "เริ่มจากบทเรียนภาษาไทย เปิด Simulator แล้วบันทึกโปรแกรมแรก ทดลองสมัครทีม หรือส่งคำขอประเมินในสภาพแวดล้อมเดโมนี้", type: "DISCUSSION", tags: ["demo", "beginner"] } });
console.log("Local Atlas records and labeled demo roles ready.");
await prisma.$disconnect();
