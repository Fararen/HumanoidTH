import { prisma } from "@/lib/prisma";

export type CompanyEvidenceLink = {
  id: string;
  title: string;
  type: "PROTOCOL_REPORT" | "VIDEO_LOG" | "SAFETY_CERT" | "SPEC_SHEET";
  url: string;
  publicAllowed: boolean;
};

export type CompanyPublishedFields = {
  showHardwareSpec: boolean;
  showFirmwareVersion: boolean;
  showTestConditions: boolean;
  showEvidenceLinks: boolean;
  showContactButton: boolean;
};

export type CompanyModelRecord = {
  id: string;
  modelCode: string;
  version: string;
  groupId: string;
  groupName: string;
  protocolCode: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  modelName: string;
  robotClass: string;
  hardwareSpec: string;
  firmwareVersion: string;
  taskEvaluated: string;
  testConditions: string;
  workflowStatus: "DRAFT" | "SUBMITTED" | "NEEDS_REVISION" | "PASSED" | "PUBLISHED";
  safetyStatus: "PASSED" | "NEEDS_IMPROVEMENT" | "PENDING";
  precisionMm: number | null;
  speedSec: number | null;
  evaluatorName: string | null;
  evaluatorNotes: string | null;
  sampleReportTitle: string | null;
  sampleReportSummary: string | null;
  evidenceLinks: CompanyEvidenceLink[];
  publishedFields: CompanyPublishedFields;
  isPublished: boolean;
  allowContact: boolean;
  isDemoData: boolean;
  evaluatedAt: string;
  publishedAt: string | null;
  updatedAt: string;
};

export const DEFAULT_GROUP_ID = "industrial-pick-place";

export const M02_GROUPS: Record<
  string,
  {
    groupId: string;
    groupName: string;
    groupNameEn: string;
    protocolCode: string;
    robotClass: string;
    taskDescription: string;
    testConditions: string;
    safetyRule: string;
    rankingRule: string;
  }
> = {
  "industrial-pick-place": {
    groupId: "industrial-pick-place",
    groupName: "หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Industrial Pick & Place)",
    groupNameEn: "Industrial Pick & Place Manipulation",
    protocolCode: "TH-IND-PP-2026.1",
    robotClass: "Industrial Cobot / Dual-Arm Manipulator (Payload 3–10 kg)",
    taskDescription:
      "หยิบชิ้นงานมาตรฐานจากถาดป้อนเข้าสู่จิ๊กประกอบและจัดเรียงลงพาเลทภายใต้สภาพแสงและความเร็วสายพานคงที่ จำนวน 50 รอบต่อเนื่อง",
    testConditions:
      "ชิ้นงานอะลูมิเนียมมาตรฐาน 250g · ระยะเอื้อม 650 มม. · อุณหภูมิห้องทดสอบ 25°C · วัดค่าด้วย Optical Tracker ความละเอียด 0.05 มม.",
    safetyRule:
      "Safety ต้องผ่านเกณฑ์หยุดฉุกเฉิน (Protective Stop ≤ 150 ms และแรงปะทะไม่เกินเกณฑ์ ISO/TS 15066) จึงจะมีสิทธิ์จัดอันดับบนตาราง",
    rankingRule:
      "เรียงลำดับจากค่าคลาดเคลื่อนตำแหน่ง Precision (มม.) น้อยไปมาก และแสดงเวลาเฉลี่ยต่อรอบ Speed (วินาทีต่อรอบ) ประกอบการตัดสินใจ"
  }
};

export const INITIAL_M02_DEMO_RECORDS = [
  {
    id: "m02-model-a",
    modelCode: "m02-model-a",
    version: "v1.2.0",
    groupId: "industrial-pick-place",
    groupName: "หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Industrial Pick & Place)",
    protocolCode: "TH-IND-PP-2026.1",
    companyName: "Siam Cobotics Co., Ltd. (สยาม โคบอทติกส์)",
    contactName: "วิศรุต รัตนโชติ (ฝ่ายวิศวกรรมโซลูชัน)",
    contactEmail: "sales-demo@siamcobotics.th",
    contactPhone: "02-000-4101 (ข้อมูลเดโม)",
    modelName: "รุ่นตัวอย่าง A · SiamArm P6-Pro",
    robotClass: "6-DOF Industrial Collaborative Manipulator",
    hardwareSpec: "แขนกล 6 แกน Payload 6 kg · Force/Torque Sensor 6 แกนที่ข้อมือ · กริปเปอร์ไฟฟ้า 2 นิ้วปรับแรงบีบอัตโนมัติ",
    firmwareVersion: "SiamOS-RT v1.2.0 (ROS 2 Humble)",
    taskEvaluated: "หยิบวางชิ้นงานในภาคการผลิตตามโปรโตคอล TH-IND-PP-2026.1 (50 รอบต่อเนื่อง)",
    testConditions:
      "ชิ้นงานมาตรฐาน 250g · ระยะเอื้อม 650 มม. · ทดสอบ ณ ห้องปฏิบัติการอ้างอิงภายใต้เงื่อนไขเดียวกันทุกรุ่น",
    workflowStatus: "PUBLISHED",
    safetyStatus: "PASSED",
    precisionMm: 2.4,
    speedSec: 4.6,
    evaluatorName: "ดร. ภาคภูมิ วงศ์วิศิษฏ์ (ผู้ตรวจประเมินตามโปรโตคอล)",
    evaluatorNotes:
      "ผ่านเกณฑ์ความปลอดภัยครบทุกข้อ ค่าคลาดเคลื่อนตำแหน่งเฉลี่ย 2.4 มม. และเวลาต่อรอบ 4.6 วินาที อนุมัติให้บริษัทเผยแพร่ขึ้นตารางเปรียบเทียบได้",
    sampleReportTitle: "รายงานผลทดสอบตัวอย่าง TRL-REP-2026-001A (รุ่นตัวอย่าง A)",
    sampleReportSummary:
      "ทดสอบครบ 50 รอบโดยไม่พบการตกหล่น ระบบหยุดฉุกเฉินเมื่อมีสิ่งกีดขวางในระยะ 120 ms (ผ่านเกณฑ์ตามโปรโตคอลตัวอย่าง)",
    evidenceLinksJson: [
      {
        id: "ev-a1",
        title: "ใบรับรองผลทดสอบโปรโตคอล TH-IND-PP-2026.1 (ข้อมูลเดโม)",
        type: "PROTOCOL_REPORT",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: true
      },
      {
        id: "ev-a2",
        title: "บันทึกการตรวจสอบ Safety Protective Stop (ISO/TS 15066 Demo)",
        type: "SAFETY_CERT",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: true
      },
      {
        id: "ev-a3",
        title: "ตารางข้อมูลจำเพาะฮาร์ดแวร์และขีดจำกัดการรับน้ำหนัก SiamArm P6-Pro",
        type: "SPEC_SHEET",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: true
      }
    ],
    publishedFieldsJson: {
      showHardwareSpec: true,
      showFirmwareVersion: true,
      showTestConditions: true,
      showEvidenceLinks: true,
      showContactButton: true
    },
    isPublished: true,
    allowContact: true,
    isDemoData: true,
    evaluatedAt: new Date("2026-10-15T09:30:00Z"),
    publishedAt: new Date("2026-10-16T10:00:00Z")
  },
  {
    id: "m02-model-b",
    modelCode: "m02-model-b",
    version: "v1.0.0",
    groupId: "industrial-pick-place",
    groupName: "หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Industrial Pick & Place)",
    protocolCode: "TH-IND-PP-2026.1",
    companyName: "Eastern Automation Lab (อีสเทิร์น ออโตเมชัน)",
    contactName: "นันทิดา พงศ์ไพศาล (Product Manager)",
    contactEmail: "contact-demo@easternauto.th",
    contactPhone: "038-000-220 (ข้อมูลเดโม)",
    modelName: "รุ่นตัวอย่าง B · EEC-PickBot X2",
    robotClass: "6-DOF High-Speed Cobot Manipulator",
    hardwareSpec: "แขนกล 6 แกน Payload 5 kg · กล้อง 3D Structured Light บนข้อมือ · Vacuum + Parallel Hybrid Gripper",
    firmwareVersion: "EEC-MotionCore v1.0.0",
    taskEvaluated: "หยิบวางชิ้นงานในภาคการผลิตตามโปรโตคอล TH-IND-PP-2026.1 (50 รอบต่อเนื่อง)",
    testConditions:
      "ชิ้นงานมาตรฐาน 250g · ระยะเอื้อม 650 มม. · ทดสอบ ณ ห้องปฏิบัติการอ้างอิงภายใต้เงื่อนไขเดียวกันทุกรุ่น",
    workflowStatus: "DRAFT",
    safetyStatus: "PASSED",
    precisionMm: 3.1,
    speedSec: 4.2,
    evaluatorName: "ดร. ภาคภูมิ วงศ์วิศิษฏ์ (ผู้ตรวจประเมินตามโปรโตคอล)",
    evaluatorNotes:
      "ผลทดสอบจากห้องปฏิบัติการพร้อมแล้ว: Safety ผ่านตามเกณฑ์ตัวอย่าง, Precision 3.1 มม., Speed 4.2 วินาที รอบริษัทส่งตรวจและผู้ตรวจยืนยันผล",
    sampleReportTitle: "รายงานผลทดสอบตัวอย่าง TRL-REP-2026-002B (รุ่นตัวอย่าง B)",
    sampleReportSummary:
      "ความเร็วต่อรอบทำได้ดีมากที่ 4.2 วินาที ค่าคลาดเคลื่อนตำแหน่งเฉลี่ย 3.1 มม. และผ่านเกณฑ์ความปลอดภัยครบถ้วน",
    evidenceLinksJson: [
      {
        id: "ev-b1",
        title: "รายงานผลทดสอบตัวอย่าง TRL-REP-2026-002B (TH-IND-PP-2026.1)",
        type: "PROTOCOL_REPORT",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: true
      },
      {
        id: "ev-b2",
        title: "ผลตรวจวัดความแม่นยำ Optical Tracker 50 รอบ (EEC-PickBot X2)",
        type: "SPEC_SHEET",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: true
      }
    ],
    publishedFieldsJson: {
      showHardwareSpec: true,
      showFirmwareVersion: true,
      showTestConditions: true,
      showEvidenceLinks: true,
      showContactButton: true
    },
    isPublished: false,
    allowContact: true,
    isDemoData: true,
    evaluatedAt: new Date("2026-11-01T14:00:00Z"),
    publishedAt: null
  },
  {
    id: "m02-model-c",
    modelCode: "m02-model-c",
    version: "v0.9.4",
    groupId: "industrial-pick-place",
    groupName: "หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Industrial Pick & Place)",
    protocolCode: "TH-IND-PP-2026.1",
    companyName: "Krungthep Robotics Works (กรุงเทพ โรบอทติกส์ เวิร์กส์)",
    contactName: "กิตติพงศ์ ชาญวิทยา (Chief Hardware Architect)",
    contactEmail: "eng-demo@krungtheprobotics.th",
    contactPhone: "02-000-8890 (ข้อมูลเดโม)",
    modelName: "รุ่นตัวอย่าง C · KrungthepArm FastPick-S1",
    robotClass: "High-Velocity Delta/Articulated Hybrid Arm",
    hardwareSpec: "แขนกลความเร็วสูง Payload 4 kg · เซอร์โวมอเตอร์แรงบิดสูงแบบ Direct-Drive · กริปเปอร์ลมความเร็วสูง",
    firmwareVersion: "FastPick-FW v0.9.4-beta",
    taskEvaluated: "หยิบวางชิ้นงานในภาคการผลิตตามโปรโตคอล TH-IND-PP-2026.1 (50 รอบต่อเนื่อง)",
    testConditions:
      "ชิ้นงานมาตรฐาน 250g · ระยะเอื้อม 650 มม. · ทดสอบ ณ ห้องปฏิบัติการอ้างอิงภายใต้เงื่อนไขเดียวกันทุกรุ่น",
    workflowStatus: "NEEDS_REVISION",
    safetyStatus: "NEEDS_IMPROVEMENT",
    precisionMm: 2.0,
    speedSec: 4.0,
    evaluatorName: "ดร. ภาคภูมิ วงศ์วิศิษฏ์ (ผู้ตรวจประเมินตามโปรโตคอล)",
    evaluatorNotes:
      "แม้ความแม่นยำ (2.0 มม.) และความเร็ว (4.0 วินาที) จะสูงที่สุด แต่การหยุดฉุกเฉินเมื่อมีสิ่งกีดขวางใช้เวลา 240 ms (เกินเกณฑ์ 150 ms ของโปรโตคอล) จึงยังไม่ผ่านเกณฑ์ Safety กรุณาปรับตั้งค่า Torque Limit ในเฟิร์มแวร์แล้วส่งตรวจซ้ำ",
    sampleReportTitle: "รายงานผลทดสอบตัวอย่าง TRL-REP-2026-003C (รุ่นตัวอย่าง C · ต้องปรับปรุง Safety)",
    sampleReportSummary:
      "Precision เฉลี่ย 2.0 มม. และ Speed 4.0 วินาทีต่อรอบ แต่ไม่ผ่านเกณฑ์ Safety ข้อ 4.2 เรื่องเวลาหยุดเมื่อเกิดแรงต้านเกินกำหนด",
    evidenceLinksJson: [
      {
        id: "ev-c1",
        title: "บันทึกผลการตรวจข้อบกพร่องด้าน Safety (Protective Stop Latency)",
        type: "PROTOCOL_REPORT",
        url: "/leaderboards/company/industrial-pick-place",
        publicAllowed: false
      }
    ],
    publishedFieldsJson: {
      showHardwareSpec: true,
      showFirmwareVersion: true,
      showTestConditions: true,
      showEvidenceLinks: false,
      showContactButton: false
    },
    isPublished: false,
    allowContact: false,
    isDemoData: true,
    evaluatedAt: new Date("2026-11-03T11:15:00Z"),
    publishedAt: null
  }
] as const;

export function serializeCompanyModel(row: {
  id: string;
  modelCode: string;
  version: string;
  groupId: string;
  groupName: string;
  protocolCode: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  modelName: string;
  robotClass: string;
  hardwareSpec: string;
  firmwareVersion: string;
  taskEvaluated: string;
  testConditions: string;
  workflowStatus: string;
  safetyStatus: string;
  precisionMm: number | null;
  speedSec: number | null;
  evaluatorName: string | null;
  evaluatorNotes: string | null;
  sampleReportTitle: string | null;
  sampleReportSummary: string | null;
  evidenceLinksJson: unknown;
  publishedFieldsJson: unknown;
  isPublished: boolean;
  allowContact: boolean;
  isDemoData: boolean;
  evaluatedAt: Date;
  publishedAt: Date | null;
  updatedAt: Date;
}): CompanyModelRecord {
  const defaultPublishedFields: CompanyPublishedFields = {
    showHardwareSpec: true,
    showFirmwareVersion: true,
    showTestConditions: true,
    showEvidenceLinks: true,
    showContactButton: true
  };

  const parsedFields =
    row.publishedFieldsJson && typeof row.publishedFieldsJson === "object"
      ? { ...defaultPublishedFields, ...(row.publishedFieldsJson as Partial<CompanyPublishedFields>) }
      : defaultPublishedFields;

  const parsedLinks = Array.isArray(row.evidenceLinksJson)
    ? (row.evidenceLinksJson as CompanyEvidenceLink[])
    : [];

  return {
    id: row.id,
    modelCode: row.modelCode,
    version: row.version,
    groupId: row.groupId,
    groupName: row.groupName,
    protocolCode: row.protocolCode,
    companyName: row.companyName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    modelName: row.modelName,
    robotClass: row.robotClass,
    hardwareSpec: row.hardwareSpec,
    firmwareVersion: row.firmwareVersion,
    taskEvaluated: row.taskEvaluated,
    testConditions: row.testConditions,
    workflowStatus: row.workflowStatus as CompanyModelRecord["workflowStatus"],
    safetyStatus: row.safetyStatus as CompanyModelRecord["safetyStatus"],
    precisionMm: row.precisionMm,
    speedSec: row.speedSec,
    evaluatorName: row.evaluatorName,
    evaluatorNotes: row.evaluatorNotes,
    sampleReportTitle: row.sampleReportTitle,
    sampleReportSummary: row.sampleReportSummary,
    evidenceLinks: parsedLinks,
    publishedFields: parsedFields,
    isPublished: row.isPublished,
    allowContact: row.allowContact,
    isDemoData: row.isDemoData,
    evaluatedAt: row.evaluatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function ensureM02Seeded() {
  const count = await prisma.companyModelEvaluation.count();
  if (count === 0) {
    for (const item of INITIAL_M02_DEMO_RECORDS) {
      const company = await prisma.company.upsert({
        where: { name: item.companyName },
        update: { isVerified: true },
        create: { name: item.companyName, isVerified: true }
      });
      await prisma.companyModelEvaluation.upsert({
        where: {
          modelCode_version: {
            modelCode: item.modelCode,
            version: item.version
          }
        },
        update: {},
        create: {
          ...item,
          companyId: company.id,
          evidenceLinksJson: item.evidenceLinksJson as unknown as object,
          publishedFieldsJson: item.publishedFieldsJson as unknown as object
        }
      });
    }
    return;
  }

  for (const item of INITIAL_M02_DEMO_RECORDS) {
    const company = await prisma.company.upsert({
      where: { name: item.companyName },
      update: { isVerified: true },
      create: { name: item.companyName, isVerified: true }
    });
    await prisma.companyModelEvaluation.updateMany({
      where: { modelCode: item.modelCode, version: item.version, companyId: null },
      data: { companyId: company.id }
    });
  }
}

export async function resetM02DemoState() {
  await prisma.companyModelEvaluation.deleteMany({});
  for (const item of INITIAL_M02_DEMO_RECORDS) {
    const company = await prisma.company.upsert({
      where: { name: item.companyName },
      update: { isVerified: true },
      create: { name: item.companyName, isVerified: true }
    });
    await prisma.companyModelEvaluation.create({
      data: {
        ...item,
        companyId: company.id,
        evidenceLinksJson: item.evidenceLinksJson as unknown as object,
        publishedFieldsJson: item.publishedFieldsJson as unknown as object
      }
    });
  }
}

function isMissingCompanyEvaluationTable(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

export function getM02FallbackModels(groupId: string): CompanyModelRecord[] {
  return INITIAL_M02_DEMO_RECORDS
    .filter((item) => item.groupId === groupId)
    .map((item) => ({
      id: item.id,
      modelCode: item.modelCode,
      version: item.version,
      groupId: item.groupId,
      groupName: item.groupName,
      protocolCode: item.protocolCode,
      companyName: item.companyName,
      contactName: item.contactName,
      contactEmail: item.contactEmail,
      contactPhone: item.contactPhone,
      modelName: item.modelName,
      robotClass: item.robotClass,
      hardwareSpec: item.hardwareSpec,
      firmwareVersion: item.firmwareVersion,
      taskEvaluated: item.taskEvaluated,
      testConditions: item.testConditions,
      workflowStatus: item.workflowStatus,
      safetyStatus: item.safetyStatus,
      precisionMm: item.precisionMm,
      speedSec: item.speedSec,
      evaluatorName: item.evaluatorName,
      evaluatorNotes: item.evaluatorNotes,
      sampleReportTitle: item.sampleReportTitle,
      sampleReportSummary: item.sampleReportSummary,
      evidenceLinks: [...item.evidenceLinksJson],
      publishedFields: { ...item.publishedFieldsJson },
      isPublished: item.isPublished,
      allowContact: item.allowContact,
      isDemoData: item.isDemoData,
      evaluatedAt: item.evaluatedAt.toISOString(),
      publishedAt: item.publishedAt?.toISOString() ?? null,
      updatedAt: item.evaluatedAt.toISOString()
    }));
}

export async function loadM02CompanyModels(groupId: string) {
  try {
    await ensureM02Seeded();
    const rows = await prisma.companyModelEvaluation.findMany({
      where: { groupId },
      orderBy: [{ precisionMm: "asc" }, { speedSec: "asc" }, { createdAt: "asc" }]
    });
    return { models: rows.map(serializeCompanyModel), isDatabaseAvailable: true };
  } catch (error) {
    if (!isMissingCompanyEvaluationTable(error)) throw error;
    console.warn("CompanyModelEvaluation table is unavailable; showing read-only M02 demo data.");
    return { models: getM02FallbackModels(groupId), isDatabaseAvailable: false };
  }
}
