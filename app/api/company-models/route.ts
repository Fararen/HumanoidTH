import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_GROUP_ID,
  M02_GROUPS,
  ensureM02Seeded,
  resetM02DemoState,
  serializeCompanyModel
} from "@/lib/company-leaderboard";

export async function GET(request: NextRequest) {
  try {
    await ensureM02Seeded();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || DEFAULT_GROUP_ID;

    const rows = await prisma.companyModelEvaluation.findMany({
      where: { groupId },
      orderBy: [{ precisionMm: "asc" }, { speedSec: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json({
      success: true,
      models: rows.map(serializeCompanyModel)
    });
  } catch (error) {
    console.error("GET /api/company-models error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดข้อมูล Company Leaderboard ได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureM02Seeded();
    const body = await request.json();

    if (body?.action === "RESET_DEMO") {
      await resetM02DemoState();
      const rows = await prisma.companyModelEvaluation.findMany({
        orderBy: [{ precisionMm: "asc" }, { speedSec: "asc" }]
      });
      return NextResponse.json({
        success: true,
        message: "รีเซ็ตข้อมูลเดโม A, B, C กลับสู่สถานะเริ่มต้นเรียบร้อยแล้ว",
        models: rows.map(serializeCompanyModel)
      });
    }

    const groupId = String(body.groupId || DEFAULT_GROUP_ID).trim();
    const groupMeta = M02_GROUPS[groupId] || M02_GROUPS[DEFAULT_GROUP_ID];
    const companyName = String(body.companyName || "").trim();
    const contactName = String(body.contactName || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const contactPhone = body.contactPhone ? String(body.contactPhone).trim() : null;
    const modelName = String(body.modelName || "").trim();
    const version = String(body.version || "v1.0.0").trim();
    const hardwareSpec = String(body.hardwareSpec || "").trim();
    const firmwareVersion = String(body.firmwareVersion || "").trim();
    const taskEvaluated = String(
      body.taskEvaluated || "หยิบวางชิ้นงานในภาคการผลิตตามโปรโตคอล TH-IND-PP-2026.1 (50 รอบต่อเนื่อง)"
    ).trim();
    const workflowStatus =
      body.workflowStatus === "SUBMITTED" ? "SUBMITTED" : "DRAFT";

    if (!companyName || !contactName || !contactEmail || !modelName || !hardwareSpec || !firmwareVersion) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกข้อมูลขั้นต่ำของรุ่นให้ครบถ้วน (บริษัท, ผู้ติดต่อ, ชื่อรุ่น, ฮาร์ดแวร์ และเฟิร์มแวร์)"
        },
        { status: 400 }
      );
    }

    const slugBase = modelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const modelCode =
      String(body.modelCode || "").trim() ||
      `m02-${slugBase || "custom"}-${Math.floor(100 + Math.random() * 900)}`;

    const created = await prisma.companyModelEvaluation.upsert({
      where: {
        modelCode_version: {
          modelCode,
          version
        }
      },
      update: {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        modelName,
        hardwareSpec,
        firmwareVersion,
        taskEvaluated,
        workflowStatus
      },
      create: {
        id: modelCode,
        modelCode,
        version,
        groupId: groupMeta.groupId,
        groupName: groupMeta.groupName,
        protocolCode: groupMeta.protocolCode,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        modelName,
        robotClass: String(body.robotClass || groupMeta.robotClass),
        hardwareSpec,
        firmwareVersion,
        taskEvaluated,
        testConditions: groupMeta.testConditions,
        workflowStatus,
        safetyStatus: "PASSED",
        precisionMm: 2.8,
        speedSec: 4.4,
        evaluatorName: "ดร. ภาคภูมิ วงศ์วิศิษฏ์ (ผู้ตรวจประเมินตามโปรโตคอล)",
        evaluatorNotes:
          workflowStatus === "SUBMITTED"
            ? "ส่งคำขอประเมินแล้ว รอผู้ตรวจทวนสอบเวอร์ชันและรายงานตัวอย่าง"
            : "บันทึกเป็นฉบับร่างในพอร์ทัลบริษัท",
        sampleReportTitle: `รายงานผลทดสอบตัวอย่าง TRL-REP-${modelCode.toUpperCase()}`,
        sampleReportSummary:
          "ข้อมูลรายงานตัวอย่างสำหรับเดโม: ทดสอบหยิบวางชิ้นงาน 50 รอบ ภายใต้โปรโตคอล TH-IND-PP-2026.1",
        evidenceLinksJson: [
          {
            id: `ev-${Date.now()}`,
            title: `รายงานผลทดสอบตัวอย่าง (${groupMeta.protocolCode})`,
            type: "PROTOCOL_REPORT",
            url: `/leaderboards/company/${groupMeta.groupId}`,
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
        isDemoData: true
      }
    });

    return NextResponse.json({
      success: true,
      model: serializeCompanyModel(created)
    });
  } catch (error) {
    console.error("POST /api/company-models error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถบันทึกคำขอประเมินรุ่นหุ่นยนต์ได้" },
      { status: 500 }
    );
  }
}
