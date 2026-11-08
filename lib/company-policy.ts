import { isDeepStrictEqual } from "node:util";
import type { CompanyModelRecord } from "./company-leaderboard";

export function publicCompanyModel(model: CompanyModelRecord): CompanyModelRecord | null {
  if (!model.isPublished || model.workflowStatus !== "PUBLISHED" || model.safetyStatus !== "PASSED" || model.precisionMm === null || model.speedSec === null) return null;
  const fields = model.publishedFields;
  const contact = model.allowContact && fields.showContactButton;
  return {
    ...model, contactName: contact ? model.contactName : "", contactEmail: contact ? model.contactEmail : "", contactPhone: contact ? model.contactPhone : null,
    hardwareSpec: fields.showHardwareSpec ? model.hardwareSpec : "", firmwareVersion: fields.showFirmwareVersion ? model.firmwareVersion : "",
    testConditions: fields.showTestConditions ? model.testConditions : "",
    evidenceLinks: fields.showEvidenceLinks ? model.evidenceLinks.filter(link => link.publicAllowed) : [],
    evaluatorNotes: null, sampleReportSummary: null, sampleReportTitle: null
  };
}

export function approvalSnapshot(model: { version: string; hardwareSpec: string; firmwareVersion: string; taskEvaluated: string; protocolCode: string; physicalReportId?: string | null }) {
  return { version: model.version, hardwareSpec: model.hardwareSpec, firmwareVersion: model.firmwareVersion, taskEvaluated: model.taskEvaluated, protocolCode: model.protocolCode, physicalReportId: model.physicalReportId ?? null };
}
export function approvalMatches(model: Parameters<typeof approvalSnapshot>[0], approved: unknown) {
  return isDeepStrictEqual(approvalSnapshot(model), approved);
}
