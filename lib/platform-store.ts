import { createHash } from "node:crypto";
import { prisma } from "./prisma";
import { PLATFORM_KINDS, GRID_TASK, type PlatformData, type PlatformKind, type PlatformUser } from "./platform-catalog";
import { WorkflowError, initialData, transition, text, type WorkRecord } from "./platform-policy";
import { runGridProgram } from "./grid-simulator";
import type { Prisma } from "@/generated/prisma";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export function validKind(kind: string): PlatformKind {
  if (!PLATFORM_KINDS.includes(kind as PlatformKind)) throw new WorkflowError("Unknown workspace", 404);
  return kind as PlatformKind;
}
export async function canRead(record: WorkRecord, user: PlatformUser | null, client: Pick<Prisma.TransactionClient, "platformRecord"> = prisma) {
  if (record.isPublished && ["EVALUATION", "RUN", "COMPETITION"].includes(record.kind)) return true;
  if (!user || user.id.startsWith("demo:")) return false;
  if (user.role === "ADMIN" || record.ownerId === user.id || record.assignedToId === user.id) return true;
  if (record.kind === "REPORT" && user.role === "MODERATOR") return true;
  if (record.kind === "ENTRY" && record.parentId) {
    const parent = await client.platformRecord.findUnique({ where: { id: record.parentId } });
    return parent?.ownerId === user.id || parent?.assignedToId === user.id;
  }
  return false;
}
export function publicRecord(record: WorkRecord) {
  const data = record.data as PlatformData;
  const fields = (data.publicFields || {}) as PlatformData;
  const keys = record.kind === "COMPETITION" ? ["format", "rules", "closesAt", "appealsUntil", "onlineAppealsUntil", "onsiteAt", "venue", "qualifyScore", "rulesVersion", "sceneVersion", "robotClass", "tieRule", "isDemoData", "resultsVersion"] : ["robotId", "version", "protocol", "mode", "taskId", "sceneVersion", "robotClass", "precisionMm", "speedSec", "safetyPassed", "score", "steps", "events", "purpose", "verified", "certifiedAt", "isDemoData", "groupId", ...(fields.showFirmwareVersion ? ["firmwareVersion"] : []), ...(fields.showProgram ? ["program"] : []), ...(fields.showEvidence ? ["rounds"] : [])];
  return { id: record.id, kind: record.kind, title: record.title, status: record.status, revision: record.revision, isPublished: record.isPublished, createdAt: record.createdAt, updatedAt: record.updatedAt, parentId: null, ownerId: "", assignedToId: null, data: Object.fromEntries(keys.filter(key => key in data).map(key => [key, data[key]])) };
}
export async function getRecord(id: string, user: PlatformUser | null, publicOnly = false) {
  const record = await prisma.platformRecord.findUnique({ where: { id } });
  if (!record || !(await canRead(record, user)) || (publicOnly && !record.isPublished)) throw new WorkflowError("Record not found", 404);
  const privateAccess = user && !user.id.startsWith("demo:") && (record.ownerId === user.id || record.assignedToId === user.id || user.role === "ADMIN" || record.kind === "REPORT" && user.role === "MODERATOR" || record.kind === "ENTRY");
  return privateAccess && !publicOnly ? record : publicRecord(record);
}
export async function listRecords(kind: PlatformKind, user: PlatformUser | null, scope = "public", parentId?: string) {
  let where: Prisma.PlatformRecordWhereInput = { kind, ...(parentId ? { parentId } : {}) };
  if (scope === "public") where.isPublished = true;
  else {
    if (!user || user.id.startsWith("demo:")) throw new WorkflowError("Sign in to open your workspace", 401);
    const parent = parentId ? await prisma.platformRecord.findUnique({ where: { id: parentId } }) : null;
    if (kind === "ENTRY" && parent && (parent.ownerId === user.id || parent.assignedToId === user.id || user.role === "ADMIN")) {
      // Competition staff can inspect entries in their own assigned competition.
    } else if (scope === "ops") {
      if (user.role !== "ADMIN") where.OR = [{ assignedToId: user.id }, { ownerId: user.id }, ...(kind === "REPORT" && user.role === "MODERATOR" ? [{ status: "OPEN" }] : [])];
    } else where.ownerId = user.id;
  }
  const records = await prisma.platformRecord.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 100 });
  return scope === "public" ? records.map(publicRecord) : records;
}
async function parentFor(id: unknown) {
  return typeof id === "string" ? prisma.platformRecord.findUnique({ where: { id } }) : null;
}
export async function createRecord(kind: PlatformKind, body: { requestId: string; title: string; data: PlatformData; parentId?: string }, user: PlatformUser) {
  if (user.id.startsWith("demo:")) throw new WorkflowError("Use a persisted account", 403);
  const title = text(body as unknown as PlatformData, "title", true, 200);
  const hash = createHash("sha256").update(JSON.stringify({ kind, title, data: body.data, parentId: body.parentId || null })).digest("hex");
  const id = kind === "PROGRESS" ? `progress-${user.id}-${text(body.data, "lessonId", true, 100)}` : body.requestId;
  const existing = await prisma.platformRecord.findUnique({ where: { id } });
  if (existing) {
    if (existing.ownerId === user.id && existing.kind === kind && existing.requestHash === hash) return existing;
    throw new WorkflowError("This request ID already belongs to a different record", 409);
  }
  const initial = initialData(kind, body.data, user);
  const data = initial.data;
  let parentId: string | null = null;
  if (kind === "EVALUATION") {
    if (!await prisma.robotModel.findUnique({ where: { id: String(data.robotId) } })) throw new WorkflowError("Select an existing Atlas robot", 404);
    if (data.companyModelId) {
      const model = await prisma.companyModelEvaluation.findUnique({ where: { id: String(data.companyModelId) } });
      const membership = model?.companyId ? await prisma.companyMembership.findUnique({ where: { userId_companyId: { userId: user.id, companyId: model.companyId } } }) : null;
      if (!model || user.role !== "ADMIN" && !membership || model.version !== data.version || model.firmwareVersion !== data.firmwareVersion || model.hardwareSpec !== data.hardwareSpec) throw new WorkflowError("Company model ownership/version does not match", 403);
    }
    data.groupId = "physical-pick-place-pilot-v1";
  }
  if (kind === "ENTRY") {
    const competition = await parentFor(body.parentId);
    if (!competition || competition.kind !== "COMPETITION" || !competition.isPublished || competition.status !== "OPEN" || Date.parse(String((competition.data as PlatformData).closesAt)) < Date.now()) throw new WorkflowError("Competition entry window is closed", 409);
    const duplicate = await prisma.platformRecord.findFirst({ where: { kind: "ENTRY", ownerId: user.id, parentId: competition.id } });
    if (duplicate) throw new WorkflowError("You already have a team entry in this competition", 409);
    parentId = competition.id;
  }
  if (kind === "RUN") {
    const program = await parentFor(body.data.programId);
    if (!program || program.kind !== "PROGRAM" || program.ownerId !== user.id) throw new WorkflowError("Saved program not found", 404);
    const programData = program.data as PlatformData;
    runGridProgram(String(programData.program));
    const purpose = body.data.purpose === "EVALUATION" ? "EVALUATION" : "PRACTICE";
    Object.assign(data, { programId: program.id, programRevision: program.revision, program: programData.program, purpose, taskId: GRID_TASK.id, sceneVersion: GRID_TASK.version, robotClass: GRID_TASK.robotClass, mode: "SIMULATION", groupId: "simulation-grid-navigation-grid-v1", isDemoData: true });
    if (body.parentId) {
      const entry = await parentFor(body.parentId);
      const competition = await parentFor(entry?.parentId);
      const competitionData = (competition?.data || {}) as PlatformData;
      if (!entry || entry.ownerId !== user.id || entry.kind !== "ENTRY" || entry.status !== "ELIGIBLE" || (entry.data as PlatformData).round !== "ONLINE" || competition?.status !== "OPEN" || Date.parse(String(competitionData.closesAt)) < Date.now() || competitionData.sceneVersion !== GRID_TASK.version) throw new WorkflowError("This entry is not eligible for the online round", 409);
      parentId = entry.id; data.purpose = "EVALUATION";
    }
  }
  if (kind === "REPORT") {
    const post = await prisma.communityPost.findUnique({ where: { id: String(data.postId) } });
    if (!post) throw new WorkflowError("Post not found", 404);
  }
  return prisma.$transaction(async tx => {
    const record = await tx.platformRecord.create({ data: { id, kind, title, ownerId: user.id, requestHash: hash, parentId, uniqueKey: kind === "ENTRY" ? `entry:${parentId}:${user.id}` : null, status: initial.status, data: json(data) } });
    await tx.platformEvent.create({ data: { recordId: id, actorId: user.id, action: "CREATE", revision: 0 } });
    return record;
  });
}
export async function updateRecord(id: string, revision: number, action: string, input: PlatformData, user: PlatformUser) {
  if (user.id.startsWith("demo:")) throw new WorkflowError("Use a persisted account", 403);
  return prisma.$transaction(async tx => {
    const record = await tx.platformRecord.findUnique({ where: { id } });
    if (!record || !await canRead(record, user, tx)) throw new WorkflowError("Record not found", 404);
    if (record.revision !== revision) throw new WorkflowError("The record changed. Reload before saving.", 409);
    const parent = record.parentId ? await tx.platformRecord.findUnique({ where: { id: record.parentId } }) : null;
    // Do not accept server-only scoring fields from a caller.
    const fields: PlatformData = { ...input }; delete fields.verifiedScore; delete fields.verifiedRunId;
    if (record.kind === "ENTRY" && action === "SCORE" && (record.data as PlatformData).round === "ONLINE") {
      const run = await tx.platformRecord.findUnique({ where: { id: text(input, "runId", true, 200) } });
      if (!run || run.kind !== "RUN" || run.parentId !== record.id || run.ownerId !== record.ownerId || run.status !== "SUCCEEDED" || !(run.data as PlatformData).verified) throw new WorkflowError("A verified run belonging to this entry is required", 409);
      fields.verifiedScore = (run.data as PlatformData).score; fields.verifiedRunId = run.id;
    }
    if (record.kind === "COMPETITION" && action === "PUBLISH_RESULTS") {
      const entries = await tx.platformRecord.findMany({ where: { kind: "ENTRY", parentId: id } });
      if (!entries.length || entries.some(entry => !["FINAL", "REJECTED"].includes(entry.status))) throw new WorkflowError("Every entry must have a final result or eligibility decision before publishing", 409);
    }
    if (action === "ASSIGN") {
      const assigned = await tx.user.findUnique({ where: { id: String(input.assignedToId) } });
      const role = record.kind === "COMPETITION" ? "JUDGE" : record.kind === "EVALUATION" ? "LAB" : "MODERATOR";
      if (!assigned || ![role, "ADMIN"].includes(assigned.role)) throw new WorkflowError(`Choose a ${role} account`);
    }
    const changed = transition(record, action, fields, user, parent);
    if (record.kind === "EVALUATION" && action === "SAVE") {
      if (!await tx.robotModel.findUnique({ where: { id: String(changed.data.robotId) } })) throw new WorkflowError("Atlas robot not found", 404);
      if (changed.data.companyModelId) {
        const model = await tx.companyModelEvaluation.findUnique({ where: { id: String(changed.data.companyModelId) } });
        const membership = model?.companyId ? await tx.companyMembership.findUnique({ where: { userId_companyId: { userId: user.id, companyId: model.companyId } } }) : null;
        if (!model || user.role !== "ADMIN" && !membership || model.version !== changed.data.version || model.firmwareVersion !== changed.data.firmwareVersion || model.hardwareSpec !== changed.data.hardwareSpec) throw new WorkflowError("Company model ownership/version does not match", 403);
      }
    }
    const updated = await tx.platformRecord.updateMany({ where: { id, revision }, data: { status: changed.status, isPublished: changed.isPublished, assignedToId: changed.assignedToId, data: json(changed.data), revision: { increment: 1 } } });
    if (!updated.count) throw new WorkflowError("Concurrent update. Reload and try again.", 409);
    await tx.platformEvent.create({ data: { recordId: id, actorId: user.id, action, revision: revision + 1, details: json({ reason: fields.reason || null, status: changed.status, ...(action === "PUBLISH" ? { consentedFields: changed.data.publicFields } : {}) }) } });
    if (record.kind === "DRAFT" && action === "PUBLISH") {
      const post = await tx.communityPost.create({ data: { slug: `post-${record.id}`, authorId: user.id, authorName: user.email.split("@")[0], authorHandle: user.id, title: record.title, content: String(changed.data.content), type: String(changed.data.type), sourcesJson: json(changed.data.sources), tags: String(changed.data.tags || "").split(",").map(tag => tag.trim()).filter(Boolean) } });
      await tx.platformRecord.update({ where: { id }, data: { data: json({ ...changed.data, postId: post.id }) } });
    }
    if (record.kind === "REPORT" && ["HIDE", "RESTORE"].includes(action)) await tx.communityPost.update({ where: { id: String(changed.data.postId) }, data: { visibilityStatus: action === "HIDE" ? "HIDDEN" : "PUBLISHED" } });
    if (record.kind === "REPORT" && ["HIDE", "RESTORE"].includes(action)) {
      const draft = await tx.platformRecord.findFirst({ where: { kind: "DRAFT", data: { path: ["postId"], equals: String(changed.data.postId) } } });
      if (draft) {
        const altered = await tx.platformRecord.updateMany({ where: { id: draft.id, revision: draft.revision }, data: { data: json({ ...(draft.data as PlatformData), publicationStatus: action === "HIDE" ? "HIDDEN" : "PUBLISHED", moderationNotes: changed.data.moderatorNotes }), revision: { increment: 1 } } });
        if (!altered.count) throw new WorkflowError("Post changed concurrently; reload", 409);
        await tx.platformEvent.create({ data: { recordId: draft.id, actorId: user.id, action: `CONTENT_${action === "HIDE" ? "HIDDEN" : "RESTORED"}`, revision: draft.revision + 1, details: json({ reason: changed.data.moderatorNotes }) } });
      }
    }
    if (record.kind === "ENTRY" && action === "AMEND_SCORE" && parent?.status === "RESULTS_PUBLISHED") {
      const parentData = parent.data as PlatformData;
      const updatedParent = await tx.platformRecord.updateMany({ where: { id: parent.id, revision: parent.revision }, data: { revision: { increment: 1 }, data: json({ ...parentData, resultsVersion: Number(parentData.resultsVersion) + 1 }) } });
      if (!updatedParent.count) throw new WorkflowError("Results changed concurrently; reload", 409);
      await tx.platformEvent.create({ data: { recordId: parent.id, actorId: user.id, action: "RESULT_AMENDED", revision: parent.revision + 1, details: json({ entryId: record.id, reason: fields.reason }) } });
    }
    return tx.platformRecord.findUniqueOrThrow({ where: { id } });
  });
}

export async function processNextRun() {
  const interrupted = await prisma.platformRecord.findFirst({ where: { kind: "RUN", status: "RUNNING", updatedAt: { lt: new Date(Date.now()-120_000) } } });
  if (interrupted) await prisma.$transaction(async tx => {
    const changed = await tx.platformRecord.updateMany({ where: { id: interrupted.id, revision: interrupted.revision, status: "RUNNING" }, data: { status: "FAILED", revision: { increment: 1 }, data: json({ ...(interrupted.data as PlatformData), verified: false, errorReason: "Worker interrupted. Submit a new run from your saved program." }) } });
    if (changed.count) await tx.platformEvent.create({ data: { recordId: interrupted.id, actorId: "simulator-worker", action: "WORKER_INTERRUPTED", revision: interrupted.revision + 1 } });
  });
  const run = await prisma.platformRecord.findFirst({ where: { kind: "RUN", status: "QUEUED" }, orderBy: { createdAt: "asc" } });
  if (!run) return false;
  const claimed = await prisma.$transaction(async tx => {
    const result = await tx.platformRecord.updateMany({ where: { id: run.id, revision: run.revision, status: "QUEUED" }, data: { status: "RUNNING", revision: { increment: 1 } } });
    if (result.count) await tx.platformEvent.create({ data: { recordId: run.id, actorId: "simulator-worker", action: "START_RUN", revision: run.revision + 1 } });
    return result.count;
  });
  if (!claimed) return true;
  const data = run.data as PlatformData;
  let result: PlatformData;
  let status: string;
  try { result = runGridProgram(String(data.program)); status = result.succeeded ? "SUCCEEDED" : "FAILED"; }
  catch (error) { result = { errorReason: error instanceof Error ? error.message : "Run failed" }; status = "FAILED"; }
  await prisma.$transaction(async tx => {
    const changed = await tx.platformRecord.updateMany({ where: { id: run.id, status: "RUNNING", revision: run.revision + 1 }, data: { status, revision: { increment: 1 }, data: json({ ...data, ...result, verified: status === "SUCCEEDED", finishedAt: new Date().toISOString() }) } });
    if (changed.count) await tx.platformEvent.create({ data: { recordId: run.id, actorId: "simulator-worker", action: status, revision: run.revision + 2 } });
  });
  return true;
}
