import { z } from "zod";

export const HRI_SCENE_VERSION = "HRI-WELLNESS-RECEPTION-v1.1";
export const HRI_SIMULATION_MODE = "WEB_INTERACTIVE_2D_STATE_MACHINE";
export type HriPhase = "READY" | "GREETING" | "GUIDING" | "ARRIVED" | "HANDOFF_STAFF" | "CANCELLED" | "ERROR_RECOVERY";
export type HriRunEvent = {
  seq: number;
  timeSec: number;
  actor: "SYSTEM" | "ROBOT" | "USER" | "STAFF";
  action: string;
  detail: string;
  status: string;
};
export type HriTestCase = "NAVIGATION_SUCCESS" | "STAFF_HANDOFF" | "USER_CANCEL" | "LOAD_ERROR";
export type HriSavedRun = {
  id: string;
  runCode: string;
  robotId: string;
  robotName: string;
  sceneVersion: string;
  simulationMode: string;
  testCaseType: HriTestCase;
  terminalStatus: string;
  testCasePassed: boolean;
  navigationSucceeded: boolean;
  durationSec: number;
  errorReason: string | null;
  events: HriRunEvent[];
  createdAt: string;
};
export type HriRun = Omit<HriSavedRun, "id" | "createdAt" | "testCaseType" | "terminalStatus" | "testCasePassed" | "navigationSucceeded" | "durationSec"> & {
  phase: HriPhase;
  startedAt: string;
  startedTick: number;
  progress: number;
};

export const HRI_CASES = [
  { type: "NAVIGATION_SUCCESS", label: "ให้หุ่นช่วยนำทาง", terminalStatus: "ARRIVED_AT_DESTINATION", expected: "เลือกนำทาง → เคลื่อนตามเส้นทาง → ถึงจุดหมายจำลอง" },
  { type: "STAFF_HANDOFF", label: "ขอเจ้าหน้าที่", terminalStatus: "HANDED_OFF_TO_STAFF", expected: "เลือกขอเจ้าหน้าที่ → แจ้งเจ้าหน้าที่ → ส่งต่อในฉากจำลอง" },
  { type: "USER_CANCEL", label: "ยกเลิก", terminalStatus: "CANCELLED_BY_USER", expected: "เลือกยกเลิก → หยุดการเคลื่อนที่ → จบรอบเป็นยกเลิก" },
  { type: "LOAD_ERROR", label: "โหลดหรือรันไม่สำเร็จ", terminalStatus: "RECOVERY_READY", expected: "บันทึกข้อผิดพลาดและเหตุผล → แสดงทางลองใหม่หรือกลับทะเบียน" }
] as const;

const eventDefinitions: Record<string, [HriRunEvent["actor"], string]> = {
  INIT_SIMULATION: ["SYSTEM", "PENDING"],
  LOAD_ATLAS_PROVENANCE: ["SYSTEM", "READY"],
  RECEPTION_GREETING: ["ROBOT", "GREETING"],
  SELECT_OPTION_1_NAVIGATE: ["USER", "GUIDING"],
  START_WAYFINDING_PATH: ["ROBOT", "GUIDING"],
  PASS_CORRIDOR_CHECKPOINT: ["ROBOT", "GUIDING"],
  DESTINATION_REACHED: ["ROBOT", "ARRIVED_AT_DESTINATION"],
  SELECT_OPTION_2_STAFF: ["USER", "HANDOFF_PENDING"],
  NOTIFY_RECEPTION_STAFF: ["ROBOT", "HANDED_OFF_TO_STAFF"],
  STAFF_ACKNOWLEDGED: ["STAFF", "HANDED_OFF_TO_STAFF"],
  SELECT_OPTION_3_CANCEL: ["USER", "CANCELLING"],
  SAFE_STANDBY_RETURN: ["ROBOT", "CANCELLED_BY_USER"],
  MODEL_LOAD_FAILED: ["SYSTEM", "ERROR_RECOVERY"],
  FAULT_INJECTION_LOAD_ERROR: ["SYSTEM", "ERROR_RECOVERY"],
  SHOW_RECOVERY_ACTIONS: ["SYSTEM", "RECOVERY_READY"]
};

function append(run: HriRun, tick: number, action: string, detail: string): HriRun {
  const [actor, status] = eventDefinitions[action];
  const timeSec = Math.max(run.events.at(-1)?.timeSec ?? 0, Math.round((tick - run.startedTick) / 100) / 10);
  return { ...run, events: [...run.events, { seq: run.events.length + 1, timeSec, actor, action, detail, status }] };
}

export function startHriRun(input: { runCode: string; robotId: string; robotName: string; tick: number; startedAt: string; errorReason?: string | null }): HriRun {
  let run: HriRun = {
    runCode: input.runCode, robotId: input.robotId, robotName: input.robotName,
    sceneVersion: HRI_SCENE_VERSION, simulationMode: HRI_SIMULATION_MODE,
    startedAt: input.startedAt, startedTick: input.tick, events: [], progress: 0,
    errorReason: input.errorReason || null, phase: input.errorReason ? "ERROR_RECOVERY" : "GREETING"
  };
  if (input.errorReason) {
    run = append(run, input.tick, "INIT_SIMULATION", `เปิดฉากสำหรับรหัสรุ่น ${input.robotId}`);
    run = append(run, input.tick, "MODEL_LOAD_FAILED", input.errorReason);
    return append(run, input.tick, "SHOW_RECOVERY_ACTIONS", "แสดงสาเหตุ พร้อมปุ่มลองโหลดใหม่และกลับทะเบียน");
  }
  run = append(run, input.tick, "LOAD_ATLAS_PROVENANCE", `ใช้ข้อมูลรุ่น ${input.robotName} (${input.robotId}) จากทะเบียน Atlas`);
  return append(run, input.tick, "RECEPTION_GREETING", "ฉากจำลอง: ยินดีต้อนรับ ต้องการให้หุ่นช่วยนำทางหรือขอเจ้าหน้าที่?");
}

export function actOnHriRun(run: HriRun, action: "navigate" | "staff" | "cancel" | "fail", tick: number): HriRun {
  if (run.phase !== "GREETING" && run.phase !== "GUIDING") return run;
  if (action === "navigate") {
    if (run.phase !== "GREETING") return run;
    let next = append(run, tick, "SELECT_OPTION_1_NAVIGATE", "ผู้ใช้เลือกให้หุ่นช่วยนำทางไปห้องกิจกรรม A-102");
    next = append(next, tick, "START_WAYFINDING_PATH", "เริ่มเคลื่อนไอคอนตามเส้นทางในฉากจำลอง");
    return { ...next, phase: "GUIDING", progress: 0 };
  }
  if (action === "staff") {
    let next = append(run, tick, "SELECT_OPTION_2_STAFF", "ผู้ใช้เลือกขอเจ้าหน้าที่");
    next = append(next, tick, "NOTIFY_RECEPTION_STAFF", "ฉากจำลอง: แจ้งเจ้าหน้าที่ประจำจุดต้อนรับ");
    next = append(next, tick, "STAFF_ACKNOWLEDGED", "ฉากจำลอง: เจ้าหน้าที่รับช่วงต่อ ไม่มีการติดต่อเจ้าหน้าที่จริง");
    return { ...next, phase: "HANDOFF_STAFF", progress: 0 };
  }
  if (action === "cancel") {
    let next = append(run, tick, "SELECT_OPTION_3_CANCEL", "ผู้ใช้ยกเลิกการขอความช่วยเหลือ");
    next = append(next, tick, "SAFE_STANDBY_RETURN", "หยุดไอคอนหุ่นและกลับจุดเริ่มในฉากจำลอง");
    return { ...next, phase: "CANCELLED", progress: 0 };
  }
  const errorReason = "ข้อผิดพลาดที่ผู้ทดสอบจำลอง: โหลดฉากไม่สำเร็จ (Fault injection)";
  let next = append(run, tick, "FAULT_INJECTION_LOAD_ERROR", errorReason);
  next = append(next, tick, "SHOW_RECOVERY_ACTIONS", "แสดงสาเหตุ พร้อมปุ่มลองใหม่และกลับทะเบียน");
  return { ...next, phase: "ERROR_RECOVERY", progress: 0, errorReason };
}

export function advanceHriRun(run: HriRun, tick: number): HriRun {
  if (run.phase !== "GUIDING") return run;
  const start = run.events.find(event => event.action === "START_WAYFINDING_PATH")!;
  const progress = Math.min(100, Math.max(run.progress, (tick - run.startedTick - start.timeSec * 1000) / 40));
  let next = { ...run, progress };
  if (progress >= 50 && !run.events.some(event => event.action === "PASS_CORRIDOR_CHECKPOINT")) {
    next = append(next, tick, "PASS_CORRIDOR_CHECKPOINT", "ไอคอนผ่านจุดกึ่งกลางเส้นทางในฉากจำลอง");
  }
  if (progress >= 100) {
    next = append(next, tick, "DESTINATION_REACHED", "ไอคอนถึงห้องกิจกรรม A-102 ในฉากจำลอง");
    next.phase = "ARRIVED";
  }
  return next;
}

export function hriOutcome(events: HriRunEvent[], errorReason: string | null) {
  const terminalStatus = events.at(-1)?.status;
  const definition = HRI_CASES.find(item => item.terminalStatus === terminalStatus);
  if (!definition) return null;
  const actions = events.map(event => event.action);
  let cursor = 0;
  const consume = (...expected: string[]) => {
    if (expected.every((action, index) => actions[cursor + index] === action)) { cursor += expected.length; return true; }
    return false;
  };
  let valid = false;
  if (consume("INIT_SIMULATION", "MODEL_LOAD_FAILED", "SHOW_RECOVERY_ACTIONS")) {
    valid = definition.type === "LOAD_ERROR" && Boolean(errorReason);
  } else if (consume("LOAD_ATLAS_PROVENANCE", "RECEPTION_GREETING")) {
    const guided = consume("SELECT_OPTION_1_NAVIGATE", "START_WAYFINDING_PATH");
    const checkpoint = guided && consume("PASS_CORRIDOR_CHECKPOINT");
    if (definition.type === "NAVIGATION_SUCCESS") valid = guided && checkpoint && consume("DESTINATION_REACHED");
    if (definition.type === "STAFF_HANDOFF") valid = consume("SELECT_OPTION_2_STAFF", "NOTIFY_RECEPTION_STAFF", "STAFF_ACKNOWLEDGED");
    if (definition.type === "USER_CANCEL") valid = consume("SELECT_OPTION_3_CANCEL", "SAFE_STANDBY_RETURN");
    if (definition.type === "LOAD_ERROR") valid = Boolean(errorReason) && consume("FAULT_INJECTION_LOAD_ERROR", "SHOW_RECOVERY_ACTIONS");
  }
  valid = valid && cursor === events.length && events[0]?.timeSec === 0 && events.every((event, index) =>
    event.seq === index + 1 && Number.isFinite(event.timeSec) && event.timeSec >= 0 &&
    event.timeSec >= (events[index - 1]?.timeSec ?? 0) &&
    eventDefinitions[event.action]?.[0] === event.actor && eventDefinitions[event.action]?.[1] === event.status
  );
  return {
    testCaseType: definition.type, terminalStatus: definition.terminalStatus,
    testCasePassed: valid, navigationSucceeded: valid && definition.type === "NAVIGATION_SUCCESS",
    durationSec: Math.round(((events.at(-1)?.timeSec ?? 0) - (events[0]?.timeSec ?? 0)) * 10) / 10,
    summaryTh: `${definition.label}: ${valid ? "ลำดับเหตุการณ์ตรงตามคาด" : "ลำดับเหตุการณ์ไม่ตรงตามคาด"}`
  };
}

const eventSchema = z.object({
  seq: z.number().int().positive(), timeSec: z.number().finite().min(0).max(86400),
  actor: z.enum(["SYSTEM", "ROBOT", "USER", "STAFF"]),
  action: z.string().min(1).max(80), detail: z.string().min(1).max(2000), status: z.string().min(1).max(80)
}).strict();
export const hriRunInputSchema = z.object({
  runCode: z.string().regex(/^M01-RUN-[0-9a-f-]{36}$/i),
  robotId: z.string().min(1).max(200), robotName: z.string().min(1).max(300),
  sceneVersion: z.literal(HRI_SCENE_VERSION), simulationMode: z.literal(HRI_SIMULATION_MODE),
  errorReason: z.string().min(1).max(2000).nullable(), events: z.array(eventSchema).min(3).max(100)
});

/** Ignore submitted scores/duration: derive these from the ordered event trace. */
export function validateHriRun(input: unknown) {
  const parsed = hriRunInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid HRI run fields" };
  const outcome = hriOutcome(parsed.data.events, parsed.data.errorReason);
  if (!outcome?.testCasePassed) return { ok: false as const, error: "Invalid or incomplete HRI event sequence" };
  if (outcome.testCaseType !== "LOAD_ERROR" && parsed.data.errorReason) return { ok: false as const, error: "Unexpected error reason" };
  const { summaryTh: _summary, ...metrics } = outcome;
  return { ok: true as const, data: { ...parsed.data, ...metrics } };
}

export function hriCsvCell(value: unknown) {
  const text = String(value ?? "");
  // Quote all fields, and prevent spreadsheet formulas in registry text.
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
}
