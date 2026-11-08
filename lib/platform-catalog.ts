export const PLATFORM_KINDS = ["EVALUATION", "PROGRAM", "RUN", "COMPETITION", "ENTRY", "PROGRESS", "DRAFT", "REPORT"] as const;
export type PlatformKind = typeof PLATFORM_KINDS[number];
export type PlatformData = Record<string, unknown>;
export type PlatformItem = { id: string; kind: string; title: string; ownerId: string; assignedToId: string | null; parentId: string | null; status: string; revision: number; isPublished: boolean; data: PlatformData; createdAt: string; updatedAt: string };
export type PlatformUser = { id: string; role: string; email: string };
export type Field = { key: string; label: string; type?: "text" | "textarea" | "number" | "date" | "url" | "checkbox" | "select"; options?: string[]; optionLabels?: Record<string, string>; required?: boolean; value?: string | number | boolean };
export const PILOT_PROTOCOL = {
  code: "PILOT-PICK-PLACE-v1", task: "pick-place", robotClass: "manipulator", version: "v1",
  conditions: "ข้อมูลเดโม: ชิ้นงาน 250g ระยะเอื้อม 650mm จำนวน 5 รอบ",
  safety: "ทุกครั้งต้องผ่าน protective stop ตามแบบตรวจเดโม", primary: "precisionMm", unit: "mm", direction: "ascending"
};
export const GRID_TASK = { id: "grid-navigation", version: "grid-v1", robotClass: "grid-agent", maxSteps: 100, size: 5, obstacles: [[1, 1], [2, 1], [3, 3]], goal: [4, 4], starter: "F F F F R F F F F" };
export const LESSONS = [
  { id: "first-robot", title: "1 · เริ่มต้นรู้จักหุ่นยนต์", goal: "แยกข้อมูลรุ่นจริงออกจากผลจำลอง", body: ["หุ่นยนต์ประกอบด้วยส่วนรับข้อมูล ประมวลผล และส่วนทำงาน เริ่มจากเปิดทะเบียนแล้วอ่านชื่อรุ่น ผู้พัฒนา และแหล่งอ้างอิง", "ผลใน HRI Living Lab เป็นการทดลองปฏิสัมพันธ์บนเว็บ ไม่ใช่ผลการทดสอบการเคลื่อนที่ของหุ่นจริง", "ฝึกสังเกตชื่อรุ่นและสถานะ จากนั้นขอเจ้าหน้าที่หรือยกเลิกเพื่อดูผลที่ต่างกัน"], href: "/robots" },
  { id: "navigation", title: "2 · เขียนคำสั่งนำทางในกริด", goal: "รันโปรแกรมแรกโดยไม่ต้องมีหุ่นจริง", body: ["ฉากฝึกเป็นตาราง 5 × 5 จุดเริ่ม (0,0) หันไปทางขวา จุดหมาย (4,4)", "ใช้ F เพื่อเดินหน้า 1 ช่อง L เพื่อเลี้ยวซ้าย และ R เพื่อเลี้ยวขวา แยกคำสั่งด้วยช่องว่าง", "โปรแกรมเริ่มต้น F F F F R F F F F ไปถึงจุดหมาย ลองเปลี่ยนคำสั่งแล้วสังเกตเส้นทาง การชน และจำนวนก้าว"], href: "/simulator/grid-navigation/workspace" },
  { id: "evidence", title: "3 · อ่านผลและเตรียมเข้าแข่งขัน", goal: "อธิบายผลจาก log และเงื่อนไขเดียวกัน", body: ["ตรวจรหัสรอบ เวอร์ชันฉาก โปรแกรม และผลลัพธ์ก่อนเปรียบเทียบเวลาและจำนวนก้าว", "การยกเลิกหรือโปรแกรมผิดเป็นผลลัพธ์ที่ต้องอ่านได้ หลีกเลี่ยงการนับทุกกรณีว่าเป็นภารกิจสำเร็จ", "ทดลองซ้ำด้วยเวอร์ชันเดียวกัน หากต้องการเข้าแข่งขัน ให้อ่านรุ่น รอบ วันปิดส่ง และเกณฑ์คะแนนก่อนส่งประเมิน"], href: "/competitions" }
] as const;
export const evaluationFields: Field[] = [
  { key: "robotId", label: "รหัสรุ่นจาก Atlas · Atlas robot ID", required: true },
  { key: "version", label: "Hardware version", required: true }, { key: "firmwareVersion", label: "Firmware version", required: true },
  { key: "contactEmail", label: "อีเมลติดต่อ · Contact email", required: true },
  { key: "hardwareSpec", label: "ฮาร์ดแวร์และขอบเขตงาน · Hardware and task", type: "textarea", required: true },
  { key: "companyModelId", label: "Company model ID (optional)" },
  { key: "documents", label: "เอกสารอ้างอิง · Evidence URLs (one per line)", type: "textarea" }
];
export const programFields: Field[] = [{ key: "program", label: "โปรแกรม · Commands F L R", type: "textarea", required: true, value: GRID_TASK.starter }];
export const competitionFields: Field[] = [
  { key: "format", label: "รูปแบบ · Format", type: "select", options: ["ONLINE", "ONSITE", "HYBRID"], required: true },
  { key: "rules", label: "กติกา รุ่น และการตัดสินเสมอ · Rules / class / tie rule", type: "textarea", required: true },
  { key: "closesAt", label: "ปิดส่ง (ISO datetime with timezone) · Entry deadline", required: true },
  { key: "appealsUntil", label: "ปิดทักท้วง (ISO datetime with timezone) · Appeal deadline", required: true },
  { key: "onlineAppealsUntil", label: "Hybrid: Online appeal deadline (ISO datetime with timezone)" },
  { key: "venue", label: "สถานที่ / Online · Venue", required: true },
  { key: "onsiteAt", label: "กำหนดการ On-site · Schedule" },
  { key: "qualifyScore", label: "คะแนนขั้นต่ำเข้ารอบ · Qualification score", type: "number", value: 50 },
];
export const entryFields: Field[] = [{ key: "teamName", label: "ชื่อทีม · Team name", required: true }, { key: "members", label: "สมาชิกและคุณสมบัติ · Members / eligibility", type: "textarea", required: true }, { key: "repoUrl", label: "Repository / evidence URL", type: "url" }];
export const draftFields: Field[] = [{ key: "content", label: "เนื้อหา · Content", type: "textarea", required: true }, { key: "type", label: "ประเภท · Type", type: "select", options: ["DISCUSSION", "NEWS", "RESEARCH", "SHOWCASE", "QUESTION"], required: true }, { key: "sources", label: "แหล่งอ้างอิง · Source URLs (one per line)", type: "textarea" }, { key: "tags", label: "Tags (comma separated)" }];
export function detailPath(record: { kind: string; id: string; parentId?: string | null }) {
  if (record.kind === "EVALUATION") return `/me/evaluations/${record.id}`;
  if (record.kind === "PROGRAM") return `/simulator/grid-navigation/workspace?programId=${record.id}`;
  if (record.kind === "RUN") return `/me/runs/${record.id}`;
  if (record.kind === "COMPETITION") return `/competitions/${record.id}`;
  if (record.kind === "ENTRY") return `/me/entries/${record.id}`;
  if (record.kind === "DRAFT") return `/community/drafts/${record.id}`;
  return `/me/work/${record.id}`;
}
