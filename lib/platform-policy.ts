import { GRID_TASK, LESSONS, PILOT_PROTOCOL, type PlatformData, type PlatformKind, type PlatformUser } from "./platform-catalog";
import { runGridProgram } from "./grid-simulator";

export class WorkflowError extends Error { constructor(message: string, public status = 400) { super(message); } }
export type WorkRecord = { id: string; kind: string; ownerId: string; assignedToId: string | null; parentId: string | null; title: string; status: string; revision: number; isPublished: boolean; data: unknown; createdAt?: Date; updatedAt?: Date };
export function text(data: PlatformData, key: string, required = true, max = 4000): string {
  const value = data[key];
  if (value !== undefined && typeof value !== "string") throw new WorkflowError(`Invalid ${key}`);
  const result = ((value as string) || "").trim();
  if ((required && !result) || result.length > max) throw new WorkflowError(`Provide ${key} (${max} characters maximum)`);
  return result;
}
export function number(data: PlatformData, key: string, min = 0, max = 100) {
  if (data[key] === "" || data[key] === null || data[key] === undefined) throw new WorkflowError(`Provide ${key}`);
  const result = Number(data[key]);
  if (!Number.isFinite(result) || result < min || result > max) throw new WorkflowError(`Invalid ${key}`);
  return result;
}
export function urls(value: unknown): string[] {
  const lines = typeof value === "string" ? value.split(/\n/).map(line => line.trim()).filter(Boolean) : Array.isArray(value) ? value : [];
  if (lines.length > 20 || lines.some(line => typeof line !== "string" || line.length > 2048 || !/^https?:\/\//.test(line))) throw new WorkflowError("Use at most 20 http(s) source URLs");
  for (const line of lines) { try { new URL(line); } catch { throw new WorkflowError("Invalid source URL"); } }
  return lines;
}
function timestamp(data: PlatformData, key: string) {
  const raw = text(data, key, true, 100);
  if (!/(Z|[+-]\d\d:\d\d)$/.test(raw) || !Number.isFinite(Date.parse(raw))) throw new WorkflowError(`${key} must include a timezone`);
  return new Date(raw).toISOString();
}
export function initialData(kind: PlatformKind, input: PlatformData, user: PlatformUser): { data: PlatformData; status: string } {
  if (kind === "EVALUATION") {
    return { status: "DRAFT", data: { robotId: text(input, "robotId", true, 200), version: text(input, "version", true, 100), firmwareVersion: text(input, "firmwareVersion", true, 100), hardwareSpec: text(input, "hardwareSpec"), contactEmail: text(input, "contactEmail", true, 200), companyModelId: text(input, "companyModelId", false, 200), documents: urls(input.documents), protocol: PILOT_PROTOCOL, isDemoData: true, mode: "PHYSICAL" } };
  }
  if (kind === "PROGRAM") {
    const program = text(input, "program", true, 1000).toUpperCase(); runGridProgram(program);
    return { status: "DRAFT", data: { program, taskId: GRID_TASK.id, sceneVersion: GRID_TASK.version, mode: "SIMULATION" } };
  }
  if (kind === "RUN") return { status: "QUEUED", data: {} }; // Server fills the validated program snapshot.
  if (kind === "COMPETITION") {
    if (!["ADMIN", "ORGANIZER"].includes(user.role)) throw new WorkflowError("Organizer required", 403);
    const format = text(input, "format", true, 20);
    if (!["ONLINE", "ONSITE", "HYBRID"].includes(format)) throw new WorkflowError("Invalid competition format");
    const closesAt = timestamp(input, "closesAt"), appealsUntil = timestamp(input, "appealsUntil");
    if (Date.parse(appealsUntil) <= Date.parse(closesAt)) throw new WorkflowError("Appeals must close after entry submissions");
    const onlineAppealsUntil = format === "HYBRID" ? timestamp(input, "onlineAppealsUntil") : appealsUntil;
    if (format === "HYBRID" && (Date.parse(onlineAppealsUntil) <= Date.parse(closesAt) || Date.parse(onlineAppealsUntil) >= Date.parse(appealsUntil))) throw new WorkflowError("Hybrid online appeals must close between submissions and the final appeal deadline");
    return { status: "DRAFT", data: { format, rules: text(input, "rules"), closesAt, appealsUntil, onlineAppealsUntil, venue: text(input, "venue", true, 500), onsiteAt: text(input, "onsiteAt", false, 200), qualifyScore: number(input, "qualifyScore"), rulesVersion: "v1", taskId: GRID_TASK.id, sceneVersion: GRID_TASK.version, robotClass: GRID_TASK.robotClass, tieRule: "score descending; earliest application, then entry ID", isDemoData: true, resultsVersion: 0 } };
  }
  if (kind === "ENTRY") return { status: "APPLIED", data: { teamName: text(input, "teamName", true, 200), members: text(input, "members"), repoUrl: urls(input.repoUrl)[0] || "", round: "ONLINE" } };
  if (kind === "PROGRESS") {
    const lessonId = text(input, "lessonId", true, 100);
    if (!LESSONS.some(lesson => lesson.id === lessonId)) throw new WorkflowError("Lesson not found", 404);
    return { status: "COMPLETED", data: { lessonId } };
  }
  if (kind === "DRAFT") {
    const type = text(input, "type", true, 50);
    if (!["DISCUSSION", "NEWS", "RESEARCH", "SHOWCASE", "QUESTION"].includes(type)) throw new WorkflowError("Invalid post type");
    return { status: "DRAFT", data: { content: text(input, "content", true, 20000), type, sources: urls(input.sources), tags: text(input, "tags", false, 500) } };
  }
  return { status: "OPEN", data: { postId: text(input, "postId", true, 200), reason: text(input, "reason", true, 2000) } };
}

export function transition(record: WorkRecord, action: string, input: PlatformData, user: PlatformUser, parent?: WorkRecord | null, now = Date.now()) {
  const data = { ...(record.data as PlatformData) };
  let status = record.status, published = record.isPublished;
  const owner = record.ownerId === user.id;
  const admin = user.role === "ADMIN";
  const assigned = record.assignedToId === user.id;
  const parentData = (parent?.data || {}) as PlatformData;
  const organizer = parent?.ownerId === user.id || admin;
  const judge = admin || (user.role === "JUDGE" && parent?.assignedToId === user.id);
  const require = (allowed: boolean, message = "Action not permitted", code = 403) => { if (!allowed) throw new WorkflowError(message, code); };
  const at = (...states: string[]) => require(states.includes(status), "This action is unavailable in the current state", 409);
  const reason = () => text(input, "reason", true, 2000);
  if (action === "ASSIGN") {
    require(admin || (record.kind === "COMPETITION" && owner && user.role === "ORGANIZER"));
    return { data, status, isPublished: published, assignedToId: text(input, "assignedToId", true, 200) };
  }
  if (record.kind === "EVALUATION") {
    const lab = admin || (assigned && user.role === "LAB");
    if (action === "SAVE") { require(owner); at("DRAFT", "NEEDS_INFO"); Object.assign(data, initialData("EVALUATION", input, user).data); }
    else if (action === "SUBMIT") { require(owner); at("DRAFT", "NEEDS_INFO"); status = "SUBMITTED"; }
    else if (action === "REQUEST_INFO") { require(lab); at("SUBMITTED", "PLANNED"); data.reviewNotes = reason(); status = "NEEDS_INFO"; }
    else if (action === "PLAN") { require(lab); at("SUBMITTED"); data.costTHB = number(input, "costTHB", 0, 1e7); data.appointment = timestamp(input, "appointment"); data.planNotes = reason(); status = "PLANNED"; }
    else if (action === "CONFIRM") { require(owner); at("PLANNED"); data.planConfirmedAt = new Date(now).toISOString(); status = "CONFIRMED"; }
    else if (action === "RECEIVE") { require(lab); at("CONFIRMED"); data.intakeNotes = reason(); status = "RECEIVED"; }
    else if (action === "START_TEST") { require(lab); at("RECEIVED"); status = "TESTING"; }
    else if (action === "RECORD_RESULTS") {
      require(lab); at("TESTING");
      if (!Array.isArray(input.rounds) || input.rounds.length !== 5) throw new WorkflowError("Record exactly five pilot rounds");
      const rounds = input.rounds.map((value: PlatformData) => ({ precisionMm: number(value, "precisionMm", 0, 10000), speedSec: number(value, "speedSec", 0.001, 86400), safetyPassed: value.safetyPassed === true, evidenceUrl: urls(value.evidenceUrl)[0] || "" }));
      if (rounds.some(round => !round.evidenceUrl)) throw new WorkflowError("Each round needs an evidence URL");
      data.rounds = rounds; data.precisionMm = rounds.reduce((sum, round) => sum + round.precisionMm, 0) / rounds.length;
      data.speedSec = rounds.reduce((sum, round) => sum + round.speedSec, 0) / rounds.length;
      data.safetyPassed = rounds.every(round => round.safetyPassed); status = "REVIEW";
    } else if (action === "CERTIFY") { require(lab); at("REVIEW"); data.certificationNotes = reason(); data.certifiedBy = user.id; data.certifiedAt = new Date(now).toISOString(); status = "CERTIFIED"; }
    else if (action === "RETURN_ROBOT") { require(lab); at("CERTIFIED"); data.returnNotes = reason(); data.returnedAt = new Date(now).toISOString(); }
    else if (action === "PUBLISH") { require(owner); at("CERTIFIED"); require(data.safetyPassed === true, "Only safety-passing results can enter the benchmark", 409); data.publicFields = { showFirmwareVersion: input.showFirmwareVersion === true, showEvidence: input.showEvidence === true }; published = true; }
    else if (action === "WITHDRAW") { require(owner); published = false; }
    else throw new WorkflowError("Unknown evaluation action");
  } else if (record.kind === "PROGRAM") {
    require(owner); at("DRAFT"); if (action !== "SAVE") throw new WorkflowError("Unknown program action");
    Object.assign(data, initialData("PROGRAM", input, user).data);
  } else if (record.kind === "RUN") {
    require(owner);
    if (action === "CANCEL") { at("QUEUED", "RUNNING"); status = "CANCELLED"; data.errorReason = "Cancelled by owner"; }
    else if (action === "PUBLISH") { at("SUCCEEDED"); require(data.purpose === "EVALUATION" && data.verified === true && !record.parentId, "Only verified non-competition evaluations can enter the benchmark", 409); data.publicFields = { showProgram: input.showProgram === true }; published = true; }
    else if (action === "WITHDRAW") published = false;
    else throw new WorkflowError("Unknown run action");
  } else if (record.kind === "COMPETITION") {
    require(owner || admin);
    if (action === "SAVE") { at("DRAFT"); Object.assign(data, initialData("COMPETITION", input, user).data); }
    else if (action === "OPEN") { at("DRAFT"); require(Boolean(record.assignedToId), "Assign a judge before opening", 409); require(Date.parse(String(data.closesAt)) > now, "The entry deadline has passed", 409); status = "OPEN"; published = true; }
    else if (action === "CLOSE") { at("OPEN"); status = "CLOSED"; }
    else if (action === "PUBLISH_RESULTS") { at("CLOSED", "RESULTS_PUBLISHED"); status = "RESULTS_PUBLISHED"; data.resultsVersion = Number(data.resultsVersion || 0) + 1; }
    else throw new WorkflowError("Unknown competition action");
  } else if (record.kind === "ENTRY") {
    if (!parent || parent.kind !== "COMPETITION") throw new WorkflowError("Competition not found", 404);
    if (action === "SAVE") { require(owner); at("NEEDS_REVISION"); require(parent.status === "OPEN" && Date.parse(String(parentData.closesAt)) >= now, "Entry window closed", 409); Object.assign(data, initialData("ENTRY", input, user).data); status = "APPLIED"; }
    else if (action === "REQUEST_INFO") { require(organizer); at("APPLIED"); data.reviewNotes = reason(); status = "NEEDS_REVISION"; }
    else if (action === "ACCEPT") { require(organizer); at("APPLIED"); status = "ELIGIBLE"; data.round = parentData.format === "ONSITE" ? "ONSITE" : "ONLINE"; }
    else if (action === "REJECT") { require(organizer); at("APPLIED", "NEEDS_REVISION"); data.reviewNotes = reason(); status = "REJECTED"; }
    else if (action === "CHECK_IN") { require(organizer); at("ELIGIBLE", "QUALIFIED"); require(data.round === "ONSITE", "On-site round required", 409); data.checkInNotes = reason(); status = "CHECKED_IN"; }
    else if (action === "SCORE") {
      require(judge); at("ELIGIBLE", "CHECKED_IN");
      if (data.round === "ONSITE") { require(status === "CHECKED_IN", "Check in the team before scoring", 409); data.score = number(input, "score"); data.evidenceUrl = urls(input.evidenceUrl)[0] || ""; require(Boolean(data.evidenceUrl), "Evidence URL required", 400); }
      // Online scores are attached by the server only after validating a submitted run.
      else { require(typeof input.verifiedScore === "number", "A verified competition run is required", 409); data.score = input.verifiedScore; data.runId = input.verifiedRunId; }
      data.judgeNotes = reason(); data.scoredAt = new Date(now).toISOString(); status = "PROVISIONAL";
    } else if (action === "APPEAL") { require(owner); at("PROVISIONAL"); const deadline = parentData.format === "HYBRID" && data.round === "ONLINE" ? parentData.onlineAppealsUntil : parentData.appealsUntil; require(now <= Date.parse(String(deadline)), "Appeal window closed", 409); data.appeal = reason(); status = "APPEALED"; }
    else if (action === "RESOLVE_APPEAL") { require(judge); at("APPEALED"); data.appealDecision = reason(); data.score = number(input, "score"); status = "PROVISIONAL"; }
    else if (action === "FINALIZE") {
      require(judge); at("PROVISIONAL"); const deadline = parentData.format === "HYBRID" && data.round === "ONLINE" ? parentData.onlineAppealsUntil : parentData.appealsUntil; require(now > Date.parse(String(deadline)), "Wait until the appeal window closes", 409);
      if (parentData.format === "HYBRID" && data.round === "ONLINE" && Number(data.score) >= Number(parentData.qualifyScore)) { data.onlineScore = data.score; data.round = "ONSITE"; data.score = null; status = "QUALIFIED"; }
      else status = "FINAL";
    } else if (action === "AMEND_SCORE") { require(judge); at("FINAL"); data.amendmentReason = reason(); data.score = number(input, "score"); }
    else throw new WorkflowError("Unknown entry action");
  } else if (record.kind === "DRAFT") {
    require(owner); at("DRAFT");
    if (action === "SAVE") Object.assign(data, initialData("DRAFT", input, user).data);
    else if (action === "PUBLISH") { if (["NEWS", "RESEARCH"].includes(String(data.type)) && (!Array.isArray(data.sources) || !data.sources.length)) throw new WorkflowError("News and research require source references"); status = "PUBLISHED"; }
    else throw new WorkflowError("Unknown draft action");
  } else if (record.kind === "REPORT") {
    require(admin || user.role === "MODERATOR"); at("OPEN");
    if (!["HIDE", "RESTORE", "DISMISS"].includes(action)) throw new WorkflowError("Unknown moderation action");
    data.decision = action; data.moderatorNotes = reason(); data.decidedBy = user.id; status = "RESOLVED";
  } else throw new WorkflowError("This record is read only", 409);
  return { data, status, isPublished: published, assignedToId: record.assignedToId };
}
