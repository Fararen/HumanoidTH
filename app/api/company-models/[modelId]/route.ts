import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureM02Seeded, serializeCompanyModel } from "@/lib/company-leaderboard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    await ensureM02Seeded();
    const { modelId } = await params;

    const found = await prisma.companyModelEvaluation.findFirst({
      where: {
        OR: [{ id: modelId }, { modelCode: modelId }]
      }
    });

    if (!found) {
      return NextResponse.json(
        { success: false, error: `ไม่พบรุ่นหุ่นยนต์รหัส "${modelId}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      model: serializeCompanyModel(found)
    });
  } catch (error) {
    console.error("GET /api/company-models/[modelId] error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถดึงข้อมูลรุ่นหุ่นยนต์ได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  try {
    await ensureM02Seeded();
    const { modelId } = await params;
    const body = await request.json();

    const existing = await prisma.companyModelEvaluation.findFirst({
      where: {
        OR: [{ id: modelId }, { modelCode: modelId }]
      }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `ไม่พบรุ่นหุ่นยนต์รหัส "${modelId}"` },
        { status: 404 }
      );
    }

    const action = String(body.action || "UPDATE_COMPANY_DRAFT");

    if (action === "SUBMIT_FOR_REVIEW") {
      const updated = await prisma.companyModelEvaluation.update({
        where: { id: existing.id },
        data: {
          companyName: body.companyName ? String(body.companyName).trim() : existing.companyName,
          contactName: body.contactName ? String(body.contactName).trim() : existing.contactName,
          contactEmail: body.contactEmail ? String(body.contactEmail).trim() : existing.contactEmail,
          contactPhone: body.contactPhone !== undefined ? String(body.contactPhone).trim() : existing.contactPhone,
          modelName: body.modelName ? String(body.modelName).trim() : existing.modelName,
          version: body.version ? String(body.version).trim() : existing.version,
          hardwareSpec: body.hardwareSpec ? String(body.hardwareSpec).trim() : existing.hardwareSpec,
          firmwareVersion: body.firmwareVersion ? String(body.firmwareVersion).trim() : existing.firmwareVersion,
          taskEvaluated: body.taskEvaluated ? String(body.taskEvaluated).trim() : existing.taskEvaluated,
          workflowStatus: "SUBMITTED",
          isPublished: false,
          evaluatorNotes:
            "บริษัทส่งคำขอประเมินเข้าสู่คิวผู้ตรวจแล้ว รอผู้ตรวจทวนสอบเวอร์ชันและรายงานผลตัวอย่าง"
        }
      });
      return NextResponse.json({
        success: true,
        message: "ส่งคำขอให้ผู้ตรวจทวนสอบตามโปรโตคอลเรียบร้อยแล้ว",
        model: serializeCompanyModel(updated)
      });
    }

    if (action === "SAVE_DRAFT") {
      const updated = await prisma.companyModelEvaluation.update({
        where: { id: existing.id },
        data: {
          companyName: body.companyName ? String(body.companyName).trim() : existing.companyName,
          contactName: body.contactName ? String(body.contactName).trim() : existing.contactName,
          contactEmail: body.contactEmail ? String(body.contactEmail).trim() : existing.contactEmail,
          contactPhone: body.contactPhone !== undefined ? String(body.contactPhone).trim() : existing.contactPhone,
          modelName: body.modelName ? String(body.modelName).trim() : existing.modelName,
          version: body.version ? String(body.version).trim() : existing.version,
          hardwareSpec: body.hardwareSpec ? String(body.hardwareSpec).trim() : existing.hardwareSpec,
          firmwareVersion: body.firmwareVersion ? String(body.firmwareVersion).trim() : existing.firmwareVersion,
          taskEvaluated: body.taskEvaluated ? String(body.taskEvaluated).trim() : existing.taskEvaluated,
          workflowStatus: "DRAFT",
          isPublished: false
        }
      });
      return NextResponse.json({
        success: true,
        message: "บันทึกข้อมูลรุ่นเป็นฉบับร่างเรียบร้อยแล้ว",
        model: serializeCompanyModel(updated)
      });
    }

    if (action === "EVALUATOR_DECISION") {
      const decision = body.decision === "PASSED" ? "PASSED" : "NEEDS_REVISION";
      const safetyStatus =
        body.safetyStatus === "PASSED" || decision === "PASSED"
          ? "PASSED"
          : "NEEDS_IMPROVEMENT";
      const precisionMm =
        typeof body.precisionMm === "number" && !Number.isNaN(body.precisionMm)
          ? body.precisionMm
          : existing.precisionMm;
      const speedSec =
        typeof body.speedSec === "number" && !Number.isNaN(body.speedSec)
          ? body.speedSec
          : existing.speedSec;
      const evaluatorNotes = String(
        body.evaluatorNotes ||
          (decision === "PASSED"
            ? "ผู้ตรวจยืนยันว่าเวอร์ชันฮาร์ดแวร์และเฟิร์มแวร์ตรงกับรายงานผลทดสอบตัวอย่าง และผ่านเกณฑ์ Safety อนุญาตให้บริษัทตรวจสอบตัวอย่างและยืนยันเผยแพร่ได้"
            : "ผู้ตรวจขอให้บริษัทปรับปรุงตามข้อสังเกตในโปรโตคอลและส่งตรวจซ้ำ")
      ).trim();

      const updated = await prisma.companyModelEvaluation.update({
        where: { id: existing.id },
        data: {
          workflowStatus: decision,
          safetyStatus,
          precisionMm,
          speedSec,
          evaluatorNotes,
          evaluatedAt: new Date(),
          isPublished: decision === "PASSED" ? existing.isPublished : false
        }
      });

      return NextResponse.json({
        success: true,
        message:
          decision === "PASSED"
            ? "ผู้ตรวจบันทึกผล 'ผ่านเกณฑ์' เรียบร้อยแล้ว บริษัทสามารถตรวจตัวอย่างและยืนยันเผยแพร่ได้ทันที"
            : "ผู้ตรวจบันทึกผล 'ขอแก้ไข (ต้องปรับปรุง)' พร้อมส่งเหตุผลกลับไปยังพอร์ทัลบริษัทแล้ว",
        model: serializeCompanyModel(updated)
      });
    }

    if (action === "CONFIRM_PUBLISH") {
      if (existing.workflowStatus !== "PASSED" && existing.workflowStatus !== "PUBLISHED") {
        return NextResponse.json(
          {
            success: false,
            error: "รุ่นนี้ยังไม่ผ่านการอนุมัติจากผู้ตรวจ จึงยังไม่สามารถยืนยันเผยแพร่ขึ้น Company Leaderboard ได้"
          },
          { status: 400 }
        );
      }

      if (existing.safetyStatus !== "PASSED") {
        return NextResponse.json(
          {
            success: false,
            error: "รุ่นที่จะเผยแพร่ขึ้นตารางต้องมีสถานะ Safety 'ผ่านตามเกณฑ์ตัวอย่าง' เท่านั้น"
          },
          { status: 400 }
        );
      }

      const publishedFields =
        body.publishedFields && typeof body.publishedFields === "object"
          ? body.publishedFields
          : existing.publishedFieldsJson;
      const allowContact =
        typeof body.allowContact === "boolean" ? body.allowContact : existing.allowContact;

      // Idempotent publish per (modelCode, version): updates the single existing record without creating duplicates
      const updated = await prisma.companyModelEvaluation.update({
        where: { id: existing.id },
        data: {
          workflowStatus: "PUBLISHED",
          isPublished: true,
          allowContact,
          publishedFieldsJson: publishedFields as object,
          publishedAt: existing.publishedAt || new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message:
          "ยืนยันการเผยแพร่สำเร็จ รุ่นและเวอร์ชันนี้ปรากฏบนตาราง Company Leaderboard เพียงรายการเดียวตามเกณฑ์",
        model: serializeCompanyModel(updated)
      });
    }

    return NextResponse.json({ success: false, error: "ไม่รู้จักคำสั่งที่ส่งมา" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/company-models/[modelId] error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถอัปเดตสถานะของรุ่นหุ่นยนต์ได้" },
      { status: 500 }
    );
  }
}
