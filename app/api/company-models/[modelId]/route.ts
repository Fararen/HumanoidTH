import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { serializeCompanyModel, M02_GROUPS } from "@/lib/company-leaderboard";
import { getSessionUser } from "@/lib/session";
import { companyAccess } from "@/lib/company-access";
import { approvalMatches, approvalSnapshot, publicCompanyModel } from "@/lib/company-policy";
import type { Prisma } from "@/generated/prisma";

type Context = { params: Promise<{ modelId: string }> };
const noStore = { "Cache-Control": "private, no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status, headers: noStore });
const fieldsSchema = z.object({
  contactName: z.string().trim().min(1).max(150).optional(), contactEmail: z.string().email().max(200).optional(),
  contactPhone: z.string().trim().max(80).optional(), modelName: z.string().trim().min(1).max(200).optional(),
  version: z.string().trim().min(1).max(60).optional(), hardwareSpec: z.string().trim().min(1).max(4000).optional(),
  firmwareVersion: z.string().trim().min(1).max(100).optional(), taskEvaluated: z.string().trim().min(1).max(2000).optional(),
  physicalReportId: z.string().max(100).nullable().optional()
});
export async function GET(_request: Request, { params }: Context) {
  try {
    const { modelId } = await params;
    const model = await prisma.companyModelEvaluation.findUnique({ where: { id: modelId } });
    if (!model) return fail("Model not found", 404);
    const access = await companyAccess(await getSessionUser(), model);
    const result = access.read ? serializeCompanyModel(model) : publicCompanyModel(serializeCompanyModel(model));
    if (!result) return fail("Model not found", 404);
    return NextResponse.json({ success: true, model: result, revision: model.revision }, { headers: noStore });
  } catch { return fail("Model data unavailable", 503); }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getSessionUser();
    if (!user || user.id.startsWith("demo:")) return fail("Sign in with an account", 401);
    let body;
    try { body = await request.json(); } catch { return fail("Invalid JSON"); }
    const { modelId } = await params;
    const existing = await prisma.companyModelEvaluation.findUnique({ where: { id: modelId } });
    if (!existing) return fail("Model not found", 404);
    const access = await companyAccess(user, existing);
    const action = body.action;
    if (!access.read) return fail("Model not found", 404);
    if (body.revision !== undefined && body.revision !== existing.revision) return fail("This record changed. Reload and try again.", 409);
    let changes: Prisma.CompanyModelEvaluationUpdateManyMutationInput = {};
    if (action === "ASSIGN_REVIEWER") {
      if (!access.admin) return fail("Administrator required", 403);
      const reviewer = await prisma.user.findUnique({ where: { id: String(body.reviewerId) } });
      if (!reviewer || !["REVIEWER", "ADMIN"].includes(reviewer.role)) return fail("Choose a reviewer account");
      changes = { reviewerId: reviewer.id };
    } else if (action === "SAVE_DOCUMENTS") {
      if (!access.edit) return fail("Company editor required", 403);
      if (!["DRAFT", "NEEDS_REVISION"].includes(existing.workflowStatus)) return fail("Documents are locked after submission; create a new version", 409);
      const parsed = z.string().max(10000).safeParse(body.documents);
      if (!parsed.success) return fail("Provide document URLs, one per line");
      const links = parsed.data.split(/\n/).map(url => url.trim()).filter(Boolean);
      if (links.length > 20 || links.some(url => !z.string().url().safeParse(url).success || !/^https?:\/\//.test(url))) return fail("Use at most 20 http(s) document URLs");
      changes = { evidenceLinksJson: links.map((url,index) => ({ id: `document-${index}`, title: `Company document ${index+1}`, type: "SPEC_SHEET", url, publicAllowed: false })) };
    } else if (action === "LINK_REPORT") {
      if (!access.edit) return fail("Company editor required", 403);
      if (!["DRAFT", "NEEDS_REVISION"].includes(existing.workflowStatus)) return fail("Link a report before submitting this version", 409);
      const report = await prisma.platformRecord.findUnique({ where: { id: String(body.physicalReportId) } });
      const reportData = (report?.data || {}) as Record<string, unknown>;
      if (!report || report.kind !== "EVALUATION" || report.status !== "CERTIFIED" || reportData.companyModelId !== existing.id || reportData.version !== existing.version || reportData.firmwareVersion !== existing.firmwareVersion || reportData.hardwareSpec !== existing.hardwareSpec) return fail("A certified report for this exact model and hardware/firmware version is required");
      const group = M02_GROUPS["physical-pick-place-pilot-v1"];
      changes = { physicalReportId: report.id, groupId: group.groupId, groupName: group.groupName, protocolCode: group.protocolCode, robotClass: group.robotClass, taskEvaluated: group.taskDescription, testConditions: group.testConditions, sampleReportTitle: report.title, sampleReportSummary: "Measurements are taken from the linked certified pilot report.", evidenceLinksJson: [{ id: report.id, title: "Certified pilot report", type: "PROTOCOL_REPORT", url: report.isPublished ? `/results/${report.id}` : `/me/evaluations/${report.id}/report`, publicAllowed: report.isPublished }], isDemoData: reportData.isDemoData === true, approvedSnapshot: {}, isPublished: false };
    } else if (action === "SAVE_DRAFT" || action === "SUBMIT_FOR_REVIEW") {
      if (!access.edit) return fail("Company editor required", 403);
      if (!["DRAFT", "NEEDS_REVISION"].includes(existing.workflowStatus)) return fail("Create a new version before changing an approved or submitted model", 409);
      const parsed = fieldsSchema.safeParse(body);
      if (!parsed.success) return fail("Invalid model fields");
      if (parsed.data.version && parsed.data.version !== existing.version) return fail("Use New version to change the model version", 409);
      changes = { ...parsed.data, workflowStatus: action === "SAVE_DRAFT" ? "DRAFT" : "SUBMITTED", isPublished: false, safetyStatus: "PENDING", precisionMm: null, speedSec: null, approvedSnapshot: {} };
    } else if (action === "NEW_VERSION") {
      if (!access.edit) return fail("Company editor required", 403);
      const parsed = z.string().trim().min(1).max(60).safeParse(body.version);
      if (!parsed.success || parsed.data === existing.version) return fail("Choose a new version");
      const { id: _id, createdAt: _created, updatedAt: _updated, ...copy } = existing;
      const created = await prisma.companyModelEvaluation.create({ data: {
        ...copy, version: parsed.data, workflowStatus: "DRAFT", isPublished: false, publishedAt: null,
        safetyStatus: "PENDING", precisionMm: null, speedSec: null, approvedSnapshot: {}, historyJson: [],
        revision: 0, physicalReportId: null, evaluatorNotes: null,
        evidenceLinksJson: [], publishedFieldsJson: {},
      } });
      return NextResponse.json({ success: true, model: serializeCompanyModel(created) }, { headers: noStore });
    } else if (action === "EVALUATOR_DECISION") {
      if (!access.review) return fail("Assigned reviewer required", 403);
      if (existing.workflowStatus !== "SUBMITTED") return fail("Only submitted models can be reviewed", 409);
      const parsed = z.object({ decision: z.enum(["PASSED", "NEEDS_REVISION"]), evaluatorNotes: z.string().trim().min(3).max(4000), safetyStatus: z.enum(["PASSED", "NEEDS_IMPROVEMENT"]), precisionMm: z.number().finite().min(0).max(10000), speedSec: z.number().finite().positive().max(86400) }).safeParse(body);
      if (!parsed.success) return fail("Provide valid measurements, safety decision and review notes");
      if (parsed.data.decision === "PASSED" && parsed.data.safetyStatus !== "PASSED") return fail("Safety must pass before approval");
      let measuredPrecision = parsed.data.precisionMm, measuredSpeed = parsed.data.speedSec;
      if (!existing.isDemoData || existing.physicalReportId) {
        const report = existing.physicalReportId ? await prisma.platformRecord.findUnique({ where: { id: existing.physicalReportId } }) : null;
        if (!report || report.kind !== "EVALUATION" || report.status !== "CERTIFIED") return fail("A certified physical report is required");
        const data = report.data as Record<string, unknown>;
        if (data.companyModelId !== existing.id || data.version !== existing.version || data.firmwareVersion !== existing.firmwareVersion || data.hardwareSpec !== existing.hardwareSpec || (data.protocol as { code?: string })?.code !== existing.protocolCode) return fail("Physical report version/protocol does not match this model");
        if (parsed.data.decision === "PASSED" && data.safetyPassed !== true) return fail("The linked report did not pass safety");
        measuredPrecision = Number(data.precisionMm); measuredSpeed = Number(data.speedSec);
      }
      changes = { workflowStatus: parsed.data.decision, safetyStatus: parsed.data.safetyStatus, precisionMm: measuredPrecision, speedSec: measuredSpeed, evaluatorNotes: parsed.data.evaluatorNotes, evaluatorName: user.name || user.email, evaluatedAt: new Date(), isPublished: false, approvedSnapshot: parsed.data.decision === "PASSED" ? approvalSnapshot(existing) : {} };
    } else if (action === "CONFIRM_PUBLISH") {
      if (!access.edit) return fail("Company editor required", 403);
      if (!["PASSED", "PUBLISHED"].includes(existing.workflowStatus) || existing.safetyStatus !== "PASSED" || existing.precisionMm === null || existing.speedSec === null || !approvalMatches(existing, existing.approvedSnapshot)) return fail("This exact version must have valid approved results before publication", 409);
      const parsed = z.object({ allowContact: z.boolean(), publishedFields: z.object({ showHardwareSpec: z.boolean(), showFirmwareVersion: z.boolean(), showTestConditions: z.boolean(), showEvidenceLinks: z.boolean(), showContactButton: z.boolean() }).strict() }).safeParse(body);
      if (!parsed.success) return fail("Choose the public fields and contact consent");
      changes = { workflowStatus: "PUBLISHED", isPublished: true, allowContact: parsed.data.allowContact, publishedFieldsJson: parsed.data.publishedFields, publishedAt: existing.publishedAt || new Date() };
    } else return fail("Unknown action");
    const history = Array.isArray(existing.historyJson) ? existing.historyJson : [];
    const changed = await prisma.companyModelEvaluation.updateMany({ where: { id: modelId, revision: existing.revision }, data: { ...changes, revision: { increment: 1 }, historyJson: [...history, { action, actorId: user.id, at: new Date().toISOString(), revision: existing.revision + 1 }] } });
    if (!changed.count) return fail("This record changed. Reload and try again.", 409);
    const saved = await prisma.companyModelEvaluation.findUniqueOrThrow({ where: { id: modelId } });
    return NextResponse.json({ success: true, message: "บันทึกแล้ว · Saved", model: serializeCompanyModel(saved), revision: saved.revision }, { headers: noStore });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return fail("This model version already exists", 409);
    return fail("Could not save the model. Please retry.", 503);
  }
}
