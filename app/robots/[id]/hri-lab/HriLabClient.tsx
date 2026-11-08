"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Navigation,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  XCircle
} from "lucide-react";
import styles from "./HriLab.module.css";
import { HRI_SCENE_VERSION, HRI_SIMULATION_MODE, HRI_CASES, startHriRun, actOnHriRun, advanceHriRun, hriOutcome, hriCsvCell, type HriRun, type HriSavedRun } from "@/lib/hri-simulation";
export type { HriSavedRun } from "@/lib/hri-simulation";

export type HriAtlasRobot = {
  id: string;
  canonicalName: string;
  manufacturer: string | null;
  developerOrg: string | null;
  robotType: string;
  thailandStatus: string;
  primaryUseCase: string | null;
  officialUrl: string | null;
  description: string | null;
  publicLocations: string[];
  sources: Array<{
    id: string;
    title: string;
    url: string;
    platform: string;
  }>;
  contributions: Array<{
    id: string;
    title: string;
    type: string;
    url: string | null;
  }>;
};

interface HriLabClientProps {
  requestedRobotId: string;
  initialRobot: HriAtlasRobot | null;
  allRobots: Array<{ id: string; canonicalName: string; robotType: string }>;
  initialRuns: HriSavedRun[];
  initialLoadError: string | null;
  initialHistoryError?: string | null;
  lang: "th" | "en";
}

const SCENE_VERSION = HRI_SCENE_VERSION;
const SIMULATION_MODE = HRI_SIMULATION_MODE;

function formatRobotLabel(raw: string | null | undefined) {
  if (!raw) return "—";
  return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HriLabClient({
  requestedRobotId, initialRobot, allRobots, initialRuns, initialLoadError, initialHistoryError
}: HriLabClientProps) {
  const router = useRouter();
  const robot = initialRobot;
  const [run, setRun] = useState<HriRun | null>(null);
  const runRef = useRef<HriRun | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [savedRuns, setSavedRuns] = useState(initialRuns);
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<"log" | "verification" | "architecture">("log");
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const attemptedRuns = useRef(new Set<string>());
  const saving = useRef(false);
  const phase = run?.phase ?? "READY";
  const runCode = run?.runCode ?? "…";
  const events = run?.events ?? [];
  const robotProgress = Math.round(run?.progress ?? 0);
  const errorReason = run?.errorReason ?? initialLoadError;
  const sceneVersion = run?.sceneVersion ?? SCENE_VERSION;
  const simulationMode = run?.simulationMode ?? SIMULATION_MODE;
  const currentOutcome = useMemo(() => run ? hriOutcome(run.events, run.errorReason) : null, [run]);
  const canAct = phase === "GREETING" || phase === "GUIDING";

  function updateRun(next: HriRun) {
    runRef.current = next;
    setRun(next);
    const outcome = hriOutcome(next.events, next.errorReason);
    if (outcome) setElapsedSec(outcome.durationSec);
  }

  function beginRun() {
    const next = startHriRun({
      runCode: `M01-RUN-${crypto.randomUUID()}`,
      robotId: requestedRobotId, robotName: robot?.canonicalName ?? `Unknown Model (${requestedRobotId})`,
      tick: performance.now(), startedAt: new Date().toISOString(),
      errorReason: initialLoadError || (!robot ? "ไม่พบรุ่นในทะเบียน Atlas" : null)
    });
    setElapsedSec(0);
    setSaveError(null);
    setSavedCode(null);
    setToastNotice(null);
    setCopiedSummary(false);
    updateRun(next);
  }

  useEffect(() => {
    setSavedRuns(initialRuns);
    beginRun();
  }, [requestedRobotId, initialRobot, initialLoadError, initialRuns]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = runRef.current;
      if (!current || (current.phase !== "GREETING" && current.phase !== "GUIDING")) return;
      const tick = performance.now();
      const next = advanceHriRun(current, tick);
      if (next !== current) updateRun(next);
      if (!hriOutcome(next.events, next.errorReason)) {
        setElapsedSec(Math.max(0, Math.round((tick - next.startedTick) / 100) / 10));
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  async function persistRunToBackend(completed: HriRun) {
    if (saving.current) return;
    const outcome = hriOutcome(completed.events, completed.errorReason);
    if (!outcome?.testCasePassed) return;
    saving.current = true;
    setIsSavingRun(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/hri-runs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          runCode: completed.runCode, robotId: completed.robotId, robotName: completed.robotName,
          sceneVersion: completed.sceneVersion, simulationMode: completed.simulationMode,
          events: completed.events, errorReason: completed.errorReason
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.run) throw new Error("Save rejected");
      const saved: HriSavedRun = { ...data.run, events: data.run.eventsJson };
      setSavedRuns(previous => [saved, ...previous.filter(item => item.runCode !== saved.runCode)]);
      if (runRef.current?.runCode === completed.runCode) setSavedCode(completed.runCode);
    } catch {
      if (runRef.current?.runCode === completed.runCode) {
        setSaveError("บันทึกฐานข้อมูลไม่สำเร็จ ผลรอบนี้ยังอยู่ในหน้านี้ กรุณาลองบันทึกอีกครั้งหรือส่งออก Run Log ก่อนออกจากหน้า");
      }
    } finally {
      saving.current = false;
      setIsSavingRun(false);
    }
  }

  useEffect(() => {
    if (!run || !hriOutcome(run.events, run.errorReason) || attemptedRuns.current.has(run.runCode)) return;
    attemptedRuns.current.add(run.runCode);
    void persistRunToBackend(run);
  }, [run]);

  function act(action: "navigate" | "staff" | "cancel" | "fail") {
    if (runRef.current) updateRun(actOnHriRun(runRef.current, action, performance.now()));
  }
  const handleStartNavigation = () => act("navigate");
  const handleRequestStaff = () => act("staff");
  const handleCancelInteraction = () => act("cancel");
  const handleSimulateLoadFailure = () => act("fail");
  const handleResetSimulation = () => {
    if (saving.current) return;
    if (!robot || initialLoadError) { router.refresh(); return; }
    beginRun();
  };

  function openSavedRun(item: HriSavedRun) {
    if (phase === "GUIDING" || saving.current) return;
    attemptedRuns.current.add(item.runCode);
    const phases: Record<HriSavedRun["testCaseType"], HriRun["phase"]> = {
      NAVIGATION_SUCCESS: "ARRIVED", STAFF_HANDOFF: "HANDOFF_STAFF", USER_CANCEL: "CANCELLED", LOAD_ERROR: "ERROR_RECOVERY"
    };
    updateRun({ ...item, phase: phases[item.testCaseType], progress: item.navigationSucceeded ? 100 : 0,
      startedAt: item.createdAt, startedTick: performance.now() });
    setSaveError(null);
    setSavedCode(item.runCode);
  }

  function download(contents: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const handleExportJson = () => {
    const payload = {
      deliverable: "M01 · HumanoidTH HRI Living Lab", runCode,
      exportedAt: new Date().toISOString(),
      persistence: savedCode === runCode ? "SAVED" : "LOCAL_ONLY",
      atlasProvenance: {
        dataClassification: robot ? "REAL_ATLAS_RECORD" : "UNAVAILABLE",
        robotId: run?.robotId ?? requestedRobotId, canonicalName: run?.robotName ?? null,
        manufacturer: robot?.manufacturer || robot?.developerOrg || null,
        robotType: robot?.robotType || null, sources: robot?.sources || []
      },
      simulationResult: {
        dataClassification: "HRI_SIMULATION_SCENARIO", sceneVersion, simulationMode, phase,
        testCaseType: currentOutcome?.testCaseType || "IN_PROGRESS",
        terminalStatus: currentOutcome?.terminalStatus || phase,
        testCasePassed: currentOutcome?.testCasePassed ?? false,
        navigationSucceeded: currentOutcome?.navigationSucceeded ?? false,
        durationSec: currentOutcome?.durationSec ?? elapsedSec, errorReason,
        measurement: "Browser interaction seconds, including decision time; not physical robot performance"
      }, events
    };
    download(JSON.stringify(payload, null, 2), `${runCode}.json`, "application/json;charset=utf-8");
  };

  const handleExportCsv = () => {
    const headers = ["run_code", "robot_id", "robot_name", "scene_version", "simulation_mode", "test_case_passed", "navigation_succeeded", "terminal_status", "total_duration_sec", "event_seq", "event_time_sec", "actor", "action", "detail", "error_reason", "persistence"];
    const rows = events.map(event => [
      runCode, run?.robotId ?? requestedRobotId, run?.robotName, sceneVersion, simulationMode,
      currentOutcome?.testCasePassed ?? false, currentOutcome?.navigationSucceeded ?? false,
      currentOutcome?.terminalStatus ?? phase, currentOutcome?.durationSec ?? elapsedSec,
      event.seq, event.timeSec, event.actor, event.action, event.detail, errorReason,
      savedCode === runCode ? "SAVED" : "LOCAL_ONLY"
    ]);
    download("\uFEFF" + [headers, ...rows].map(row => row.map(hriCsvCell).join(",")).join("\n"), `${runCode}-events.csv`, "text/csv;charset=utf-8");
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText([
        "M01 · HRI Simulation", runCode, run?.robotName, sceneVersion, simulationMode,
        currentOutcome?.terminalStatus ?? phase,
        `Test case passed: ${currentOutcome?.testCasePassed ?? false}`,
        `Navigation succeeded: ${currentOutcome?.navigationSucceeded ?? false}`,
        `Interaction duration: ${currentOutcome?.durationSec ?? elapsedSec}s (includes user decision time)`,
        `Persistence: ${savedCode === runCode ? "SAVED" : "LOCAL_ONLY"}`
      ].join("\n"));
      setCopiedSummary(true);
    } catch { setToastNotice("คัดลอกไม่สำเร็จ กรุณาส่งออก JSON หรือ CSV แทน"); }
  };

  const verificationRuns = savedRuns.filter(item => item.robotId === requestedRobotId && item.sceneVersion === sceneVersion && item.simulationMode === simulationMode);
  const observedRuns = currentOutcome && run && !verificationRuns.some(item => item.runCode === runCode)
    ? [{ ...run, ...currentOutcome }, ...verificationRuns] : verificationRuns;

  // Compute SVG robot position along the 2D floorplan
  // Start Reception: (110, 175) -> Main Corridor -> Activity Room A-102: (510, 105)
  // Staff Handoff Counter: (290, 260)
  const robotCoords = useMemo(() => {
    if (phase === "HANDOFF_STAFF") {
      return { x: 290, y: 248, zone: "เคาน์เตอร์เจ้าหน้าที่ (Staff Counter)" };
    }
    if (phase === "ERROR_RECOVERY") {
      return { x: 110, y: 175, zone: "โหมดกู้คืนระบบ (Fault Recovery)" };
    }
    if (robotProgress <= 0) {
      return { x: 110, y: 175, zone: "จุดต้อนรับ (Reception Zone)" };
    }
    if (robotProgress >= 100) {
      return { x: 510, y: 105, zone: "ห้องกิจกรรมบำบัด A-102" };
    }
    // Interpolate along L-shaped path: (110,175) -> (370,175) for 0..65%, then (370,175) -> (510,105) for 65..100%
    if (robotProgress <= 65) {
      const ratio = robotProgress / 65;
      const x = Math.round(110 + ratio * (370 - 110));
      return { x, y: 175, zone: "โถงทางเดินหลัก (Main Corridor)" };
    }
    const ratio = (robotProgress - 65) / 35;
    const x = Math.round(370 + ratio * (510 - 370));
    const y = Math.round(175 + ratio * (105 - 175));
    return { x, y, zone: "ทางเข้าห้องกิจกรรม A-102" };
  }, [phase, robotProgress]);

  const statusToneClass = useMemo(() => {
    if (phase === "ARRIVED") return styles.statusSuccess;
    if (phase === "HANDOFF_STAFF") return styles.statusHandoff;
    if (phase === "CANCELLED") return styles.statusCancelled;
    if (phase === "ERROR_RECOVERY") return styles.statusError;
    if (phase === "GUIDING") return styles.statusActive;
    return styles.statusReady;
  }, [phase]);

  return (
    <div className={styles.console} lang="th">
      {/* 1. Top Navigation & Model Switcher Strip */}
      <div className={styles.topBar}>
        <div className={styles.navGroup}>
          <Link href="/robots" className={styles.backLink}>
            <ArrowLeft size={15} />
            กลับไปหน้ารายการหุ่นยนต์ (/robots)
          </Link>
          {robot && (
            <Link href={`/robots/${robot.id}`} className={styles.profileLink}>
              ดูหน้าโปรไฟล์รุ่น {robot.canonicalName}
            </Link>
          )}
        </div>

        <div className={styles.navGroup}>
          <label className={styles.switcherLabel}>
            <span>สลับรุ่นหุ่นยนต์จากทะเบียน:</span>
            <select
              className={styles.switcherSelect}
              disabled={isSavingRun}
              value={robot?.id || "__invalid_test__"}
              onChange={(e) => {
                const nextId = e.target.value;
                if (nextId === "__invalid_test__") {
                  router.push("/robots/invalid-model-id-test-case-4/hri-lab");
                } else {
                  router.push(`/robots/${nextId}/hri-lab`);
                }
              }}
            >
              {allRobots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.canonicalName} ({formatRobotLabel(r.robotType)})
                </option>
              ))}
              <option value="__invalid_test__">
                [ทดสอบกรณีที่ 4] รหัสรุ่นไม่ถูกต้อง (Invalid Model ID)
              </option>
            </select>
          </label>
        </div>
      </div>

      {/* Toast Notification */}
      {toastNotice && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={16} />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 2. Dual-Provenance Header Ledger: Separates Real Atlas Record vs HRI Simulation */}
      <section className={styles.headerLedger} aria-label="การแยกแยะแหล่งที่มาของข้อมูล">
        {/* Left Pane: Real Registry Facts */}
        <div className={styles.ledgerPane}>
          <div className={styles.provenanceRow}>
            <span className={styles.sourcePill}>
              <Database size={13} />
              ข้อมูลจากทะเบียนจริง (HumanoidTH Atlas)
            </span>
            <span className={styles.monoTag}>ID: {robot?.id || requestedRobotId}</span>
          </div>

          {robot ? (
            <>
              <h1 className={styles.modelTitle}>{robot.canonicalName}</h1>
              <p className={styles.leadText}>
                {robot.description ||
                  "ข้อมูลจำเพาะและหลักฐานของหุ่นยนต์รุ่นนี้ดึงมาจากฐานข้อมูลทะเบียน HumanoidTH Atlas โดยตรง"}
              </p>

              <dl className={styles.specStrip}>
                <div className={styles.specItem}>
                  <dt>ผู้ผลิต / ผู้พัฒนา</dt>
                  <dd>{robot.manufacturer || robot.developerOrg || "ไม่ระบุ"}</dd>
                </div>
                <div className={styles.specItem}>
                  <dt>ประเภท / สถานะในไทย</dt>
                  <dd>
                    {formatRobotLabel(robot.robotType)} · {formatRobotLabel(robot.thailandStatus)}
                  </dd>
                </div>
                <div className={styles.specItem}>
                  <dt>พื้นที่ใช้งานสาธารณะ</dt>
                  <dd>
                    {robot.publicLocations.length > 0
                      ? robot.publicLocations.slice(0, 2).join(", ")
                      : "ยังไม่ระบุสถานที่เปิดเผย"}
                  </dd>
                </div>
              </dl>

              <ul className={styles.sourceList} aria-label="แหล่งข้อมูลอ้างอิงในทะเบียน">
                <li>
                  <strong>แหล่งอ้างอิง ({robot.sources.length}):</strong>
                </li>
                {robot.sources.length > 0 ? (
                  robot.sources.slice(0, 3).map((src) => (
                    <li key={src.id}>
                      <a href={src.url} target="_blank" rel="noopener noreferrer">
                        {src.title.length > 42 ? `${src.title.slice(0, 42)}…` : src.title}
                        <ExternalLink size={11} />
                      </a>
                    </li>
                  ))
                ) : (
                  <li>ไม่มีลิงก์งานวิจัยแนบโดยตรง</li>
                )}
                {robot.officialUrl && (
                  <li>
                    <a href={robot.officialUrl} target="_blank" rel="noopener noreferrer">
                      เว็บไซต์ทางการผู้พัฒนา
                      <ExternalLink size={11} />
                    </a>
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div className={styles.errorCallout}>
              <strong>ไม่พบข้อมูลหุ่นยนต์รหัส &ldquo;{requestedRobotId}&rdquo; ในทะเบียนจริง</strong>
              <p style={{ margin: "6px 0 0" }}>
                ระบบไม่สามารถดึงข้อมูลจำเพาะจากฐานข้อมูลได้ กรุณาใช้ปุ่มกู้คืนด้านล่างเพื่อลองโหลดใหม่หรือกลับไปเลือกหุ่นยนต์จากหน้าทะเบียน
              </p>
            </div>
          )}
        </div>

        {/* Right Pane: Simulation Context */}
        <div className={styles.ledgerPaneSim}>
          <div className={styles.provenanceRow}>
            <span className={styles.simPill}>
              <Compass size={13} />
              สถานการณ์จำลอง HRI (Simulation Scenario)
            </span>
            <span className={styles.monoTag}>{sceneVersion}</span>
          </div>

          <h2 className={styles.simTitle}>
            M01 · จุดต้อนรับและคัดกรองผู้มาติดต่อ ศูนย์สุขภาวะ
          </h2>
          <p className={styles.leadText}>
            จำลองเหตุการณ์เมื่อผู้มาติดต่อเดินเข้าสู่โถงต้อนรับศูนย์สุขภาวะ หุ่นยนต์จะกล่าวทักทายและเสนอทางเลือกความช่วยเหลือ 3 รูปแบบ โดยแยกบันทึกเหตุการณ์จำลองออกจากข้อเท็จจริงในทะเบียนอย่างชัดเจน
          </p>

          <dl className={styles.specStrip}>
            <div className={styles.specItem}>
              <dt>รหัสรอบการทดลอง</dt>
              <dd className={styles.monoTag}>{runCode}</dd>
            </div>
            <div className={styles.specItem}>
              <dt>โหมดการจำลอง</dt>
              <dd>2D Wayfinding State Machine</dd>
            </div>
            <div className={styles.specItem}>
              <dt>เวลาที่ใช้ไป (Elapsed)</dt>
              <dd style={{ fontVariantNumeric: "tabular-nums" }}>{elapsedSec.toFixed(1)} วินาที</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 3. Main 2-Column Instrument Stage: Architectural Blueprint + Operator Console */}
      <div className={styles.stageGrid}>
        {/* Left: SVG Architectural Floorplan */}
        <section className={styles.blueprintPanel} aria-label="แผนผังจำลองการเคลื่อนที่ 2 มิติ">
          <div className={styles.panelHeader}>
            <h2 className={styles.panelHeading}>
              แผนผังจุดต้อนรับศูนย์สุขภาวะ (Wellness Center Floorplan)
            </h2>
            <span className={styles.telemetryMeta}>
              ตำแหน่งไอคอน: X={robotCoords.x} · Y={robotCoords.y} (หน่วยภาพ SVG ไม่ใช่เมตร)
            </span>
          </div>

          <div className={styles.svgWrap}>
            <svg
              viewBox="0 0 640 310"
              className={styles.blueprintSvg}
              role="img"
              aria-label="แผนผัง 2 มิติแสดงตำแหน่งหุ่นยนต์ในจุดต้อนรับศูนย์สุขภาวะ"
            >
              <defs>
                <pattern id="minorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#dfe9e2"
                    strokeWidth="0.75"
                  />
                </pattern>
                <pattern id="majorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#minorGrid)" />
                  <path
                    d="M 100 0 L 0 0 0 100"
                    fill="none"
                    stroke="#cad8cf"
                    strokeWidth="1.1"
                  />
                </pattern>
              </defs>

              {/* Architectural Grid Background */}
              <rect width="640" height="310" fill="url(#majorGrid)" />

              {/* Scale Bar & North Indicator */}
              <g transform="translate(20, 20)">
                <line x1="0" y1="8" x2="80" y2="8" stroke="#465a4f" strokeWidth="1.5" />
                <line x1="0" y1="4" x2="0" y2="12" stroke="#465a4f" strokeWidth="1.5" />
                <line x1="40" y1="5" x2="40" y2="11" stroke="#465a4f" strokeWidth="1" />
                <line x1="80" y1="4" x2="80" y2="12" stroke="#465a4f" strokeWidth="1.5" />
                <text x="0" y="22" fill="#465a4f" fontSize="9.5" fontFamily="monospace">
                  SCALE 0 — 4m — 8m
                </text>
              </g>

              {/* Zone 1: Reception Entrance (Left) */}
              <rect
                x="36"
                y="115"
                width="148"
                height="120"
                rx="8"
                fill="#ffffff"
                stroke="#86a593"
                strokeWidth="1.75"
              />
              <text x="50" y="138" fill="#1c2420" fontSize="11.5" fontWeight="700">
                1. จุดต้อนรับ (Reception)
              </text>
              <text x="50" y="153" fill="#52665b" fontSize="9.5">
                จุดเริ่มต้นคัดกรองผู้มาติดต่อ
              </text>

              {/* Main Wayfinding Corridor (Center) */}
              <rect
                x="184"
                y="142"
                width="240"
                height="66"
                fill="#eef4f0"
                stroke="#9bb5a5"
                strokeWidth="1.25"
                strokeDasharray="5 3"
              />
              <text x="236" y="160" fill="#3f5247" fontSize="10" fontWeight="600">
                โถงทางเดินหลัก (ระยะทาง 12 เมตร)
              </text>

              {/* Zone 2: Staff Handoff Counter (Bottom Center) */}
              <rect
                x="210"
                y="222"
                width="175"
                height="68"
                rx="8"
                fill={phase === "HANDOFF_STAFF" ? "#f9f1df" : "#ffffff"}
                stroke={phase === "HANDOFF_STAFF" ? "#c28b2c" : "#9bb5a5"}
                strokeWidth={phase === "HANDOFF_STAFF" ? "2.2" : "1.5"}
              />
              <text x="224" y="244" fill="#4a3512" fontSize="11" fontWeight="700">
                2. เคาน์เตอร์เจ้าหน้าที่ (Staff)
              </text>
              <text x="224" y="260" fill="#6b5530" fontSize="9.5">
                จุดรับช่วงต่อกรณีต้องการเจ้าหน้าที่
              </text>

              {/* Zone 3: Activity & Wellness Room A-102 (Top Right) */}
              <rect
                x="424"
                y="46"
                width="180"
                height="126"
                rx="8"
                fill={phase === "ARRIVED" ? "#e4f4ea" : "#ffffff"}
                stroke={phase === "ARRIVED" ? "#1f6b43" : "#86a593"}
                strokeWidth={phase === "ARRIVED" ? "2.4" : "1.75"}
              />
              <text x="440" y="72" fill="#143d27" fontSize="11.5" fontWeight="700">
                3. ห้องกิจกรรมบำบัด A-102
              </text>
              <text x="440" y="88" fill="#3f594a" fontSize="9.5">
                Activity &amp; Wellness Destination
              </text>

              {/* Planned Trajectory Path 1: Navigation to Room A-102 */}
              <path
                d="M 110 175 L 370 175 L 510 105"
                fill="none"
                stroke={
                  phase === "GUIDING" || phase === "ARRIVED" ? "#1f6b43" : "#b2c5b9"
                }
                strokeWidth={phase === "GUIDING" || phase === "ARRIVED" ? "3" : "2"}
                strokeDasharray={phase === "ARRIVED" ? "none" : "6 4"}
              />

              {/* Planned Trajectory Path 2: Handoff to Staff */}
              <path
                d="M 110 175 L 290 248"
                fill="none"
                stroke={phase === "HANDOFF_STAFF" ? "#c28b2c" : "#cbd8d0"}
                strokeWidth={phase === "HANDOFF_STAFF" ? "2.5" : "1.5"}
                strokeDasharray="4 4"
              />

              {/* Waypoint Nodes */}
              <circle cx="110" cy="175" r="5" fill="#465a4f" />
              <circle cx="370" cy="175" r="4" fill="#6a8274" />
              <circle cx="510" cy="105" r="6" fill="#1f6b43" />
              <circle cx="290" cy="248" r="5" fill="#b07d28" />

              {/* Visitor Marker at Reception */}
              <g transform="translate(76, 196)">
                <circle cx="0" cy="0" r="7" fill="#334155" />
                <text x="12" y="4" fill="#334155" fontSize="9.5" fontWeight="700">
                  ผู้มาติดต่อ (Visitor)
                </text>
              </g>

              {/* Live Robot Telemetry Marker */}
              <g
                transform={`translate(${robotCoords.x}, ${robotCoords.y})`}
                style={{ transition: "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)" }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="18"
                  fill={
                    phase === "ERROR_RECOVERY"
                      ? "rgba(185, 28, 28, 0.16)"
                      : phase === "HANDOFF_STAFF"
                      ? "rgba(194, 139, 44, 0.18)"
                      : "rgba(31, 107, 67, 0.16)"
                  }
                />
                <circle
                  cx="0"
                  cy="0"
                  r="11"
                  fill={
                    phase === "ERROR_RECOVERY"
                      ? "#991b1b"
                      : phase === "HANDOFF_STAFF"
                      ? "#b45309"
                      : "#1f5239"
                  }
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  R1
                </text>
                <rect
                  x="-54"
                  y="-34"
                  width="108"
                  height="18"
                  rx="4"
                  fill="#1c2420"
                />
                <text
                  x="0"
                  y="-22"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {robot?.canonicalName.slice(0, 16) || "Fault State"}
                </text>
              </g>
            </svg>
          </div>

          <div className={styles.telemetryFooter}>
            <span>ตำแหน่งปัจจุบัน: <strong>{robotCoords.zone}</strong></span>
            <span>ความคืบหน้าเส้นทางนำทาง: <strong>{robotProgress}%</strong></span>
            <span>เหตุการณ์ที่บันทึกแล้ว: <strong>{events.length} รายการ</strong></span>
          </div>
        </section>

        {/* Right: Operator Action & Telemetry Control Panel */}
        <section className={styles.controlPanel} aria-label="แผงควบคุมการตัดสินใจของผู้ใช้">
          <div className={styles.panelHeader}>
            <h2 className={styles.panelHeading}>
              เลือกการตอบสนองของผู้รับบริการ (User Interaction)
            </h2>
            <span className={styles.telemetryMeta}>Run: {runCode}</span>
          </div>

          {/* Current Robot Speech / System State Readout */}
          <div className={`${styles.statusReadout} ${statusToneClass}`} role="status" aria-label="สถานะการจำลอง" aria-live="polite">
            <div className={styles.statusTopRow}>
              <span>สถานะปัจจุบัน: {currentOutcome?.terminalStatus || phase}</span>
              <span aria-hidden="true">T+{elapsedSec.toFixed(1)}s</span>
            </div>

            {phase === "GREETING" && (
              <>
                <h3 className={styles.statusHeadline}>
                  {robot?.canonicalName}: &ldquo;ต้องการให้ช่วยนำทางไปยังห้องกิจกรรมบำบัด หรือติดต่อเจ้าหน้าที่ครับ?&rdquo;
                </h3>
                <p className={styles.statusDescription}>
                  เลือกปุ่มคำสั่งด้านล่างเพื่อทดสอบพฤติกรรมของหุ่นยนต์และบันทึกผลลัพธ์ลงใน Run Log
                </p>
              </>
            )}

            {phase === "GUIDING" && (
              <>
                <h3 className={styles.statusHeadline}>
                  กำลังนำทางไปยังห้องกิจกรรมบำบัด A-102 ({robotProgress}%)
                </h3>
                <p className={styles.statusDescription}>
                  หุ่นยนต์กำลังเคลื่อนที่ไปตามโถงทางเดินหลัก คุณสามารถกดปุ่ม &ldquo;ยกเลิก&rdquo; หรือ &ldquo;ขอเจ้าหน้าที่&rdquo; ได้ตลอดเวลา
                </p>
              </>
            )}

            {phase === "ARRIVED" && (
              <>
                <h3 className={styles.statusHeadline}>
                  ภารกิจนำทางสำเร็จ: ถึงหน้าห้องกิจกรรมบำบัด A-102 เรียบร้อยแล้ว
                </h3>
                <p className={styles.statusDescription}>
                  {currentOutcome?.summaryTh || "ยังยืนยันลำดับเหตุการณ์ไม่ได้"}
                </p>
              </>
            )}

            {phase === "HANDOFF_STAFF" && (
              <>
                <h3 className={styles.statusHeadline}>
                  ส่งต่อเจ้าหน้าที่ประจำเคาน์เตอร์ต้อนรับเรียบร้อยแล้ว
                </h3>
                <p className={styles.statusDescription}>
                  {currentOutcome?.summaryTh || "ยังยืนยันลำดับเหตุการณ์ไม่ได้"} · ภารกิจนำทางไม่สำเร็จ
                </p>
              </>
            )}

            {phase === "CANCELLED" && (
              <>
                <h3 className={styles.statusHeadline}>
                  ผู้ใช้ยกเลิกคำขอ · ไอคอนหุ่นหยุดและกลับสู่จุดพักในฉากจำลอง
                </h3>
                <p className={styles.statusDescription}>
                  {currentOutcome?.summaryTh || "ยังยืนยันลำดับเหตุการณ์ไม่ได้"} · ยกเลิกก่อนถึงปลายทาง
                </p>
              </>
            )}

            {phase === "ERROR_RECOVERY" && (
              <>
                <h3 className={styles.statusHeadline}>
                  ตรวจพบข้อผิดพลาดในการโหลดข้อมูลรุ่นหรือฉากจำลอง
                </h3>
                <p className={styles.statusDescription}>
                  {errorReason || "ไม่พบรหัสรุ่นหุ่นยนต์ที่ร้องขอในทะเบียน"}
                </p>
              </>
            )}
          </div>

          {/* 3 Primary User Interaction Choices (Cases 1, 2, 3) */}
          <div className={styles.actionList}>
            <button
              type="button"
              className={styles.actionBtnPrimary}
              onClick={handleStartNavigation}
              disabled={!robot || phase !== "GREETING"}
            >
              <span className={styles.btnLabelGroup}>
                <Navigation size={16} />
                <span>ให้หุ่นช่วยนำทางไปห้องกิจกรรม (A-102)</span>
              </span>
              <span className={styles.kbdKey}>กรณีที่ 1</span>
            </button>

            <button
              type="button"
              className={styles.actionBtnSecondary}
              onClick={handleRequestStaff}
              disabled={!robot || !canAct}
            >
              <span className={styles.btnLabelGroup}>
                <UserCheck size={16} />
                <span>ขอเจ้าหน้าที่มารับช่วงต่อ (Staff Handoff)</span>
              </span>
              <span className={styles.kbdKeyDark}>กรณีที่ 2</span>
            </button>

            <button
              type="button"
              className={styles.actionBtnDanger}
              onClick={handleCancelInteraction}
              disabled={!robot || !canAct}
            >
              <span className={styles.btnLabelGroup}>
                <XCircle size={16} />
                <span>ยกเลิกคำขอและให้หุ่นหยุดทำงาน (Cancel)</span>
              </span>
              <span className={styles.kbdKeyDark}>กรณีที่ 3</span>
            </button>
          </div>

          {/* Fault Injection / Error Recovery Bar (Case 4) */}
          {phase === "ERROR_RECOVERY" ? (
            <div className={styles.recoveryBar}>
              <span>ทางเลือกกู้คืนระบบ (กรณีทดสอบที่ 4):</span>
              <div className={styles.recoveryActions}>
                <button
                  type="button"
                  className={styles.recoveryBtn}
                  onClick={handleResetSimulation}
                  disabled={isSavingRun || canAct}
                >
                  ลองโหลดใหม่ (Retry)
                </button>
                <Link href="/robots" className={styles.recoveryLink}>
                  กลับไปหน้า /robots
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={styles.actionBtnGhost}
                style={{ flex: 1 }}
                onClick={handleResetSimulation}
                  disabled={isSavingRun || canAct}
              >
                <span className={styles.btnLabelGroup}>
                  <RefreshCw size={14} />
                  <span>เริ่มรอบการทดลองใหม่</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.actionBtnGhost}
                style={{ flex: 1 }}
                onClick={handleSimulateLoadFailure}
                disabled={!canAct}
              >
                <span className={styles.btnLabelGroup}>
                  <AlertTriangle size={14} />
                  <span>จำลองกรณีโหลดไม่สำเร็จ (กรณีที่ 4)</span>
                </span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 4. Bottom Verification & Telemetry Ledger */}
      <section className={styles.ledgerSection} aria-label="บันทึกผลการรันและการทวนสอบ">
        <div className={styles.tabToolbar}>
          <div className={styles.tabList} role="tablist" aria-label="รายงานการจำลอง"
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
              const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
              const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
              event.preventDefault(); tabs[next]?.focus(); tabs[next]?.click();
            }}>
            <button
              type="button"
              role="tab"
              id="hri-tab-log" aria-controls="hri-panel-log" tabIndex={activeBottomTab === "log" ? 0 : -1}
              aria-selected={activeBottomTab === "log"}
              className={`${styles.tabBtn} ${activeBottomTab === "log" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveBottomTab("log")}
            >
              <FileText size={15} />
              บันทึกเหตุการณ์และผลลัพธ์ (Run Log · {events.length})
            </button>
            <button
              type="button"
              role="tab"
              id="hri-tab-verification" aria-controls="hri-panel-verification" tabIndex={activeBottomTab === "verification" ? 0 : -1}
              aria-selected={activeBottomTab === "verification"}
              className={`${styles.tabBtn} ${activeBottomTab === "verification" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveBottomTab("verification")}
            >
              <ShieldCheck size={15} />
              ตารางทวนสอบ 4 กรณีทดสอบ (Expected vs Actual)
            </button>
            <button
              type="button"
              role="tab"
              id="hri-tab-architecture" aria-controls="hri-panel-architecture" tabIndex={activeBottomTab === "architecture" ? 0 : -1}
              aria-selected={activeBottomTab === "architecture"}
              className={`${styles.tabBtn} ${activeBottomTab === "architecture" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveBottomTab("architecture")}
            >
              <Database size={15} />
              ขอบเขตงานและแนวทางขยายระบบ (M01 Scope)
            </button>
          </div>

          <div className={styles.exportGroup}>
            <button type="button" className={styles.utilityBtn} onClick={handleCopySummary} disabled={!run}>
              {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
              {copiedSummary ? "คัดลอกสรุปแล้ว" : "คัดลอกสรุปผล"}
            </button>
            <button type="button" className={styles.utilityBtn} onClick={handleExportJson} disabled={!run}>
              <Download size={14} />
              ส่งออก JSON
            </button>
            <button type="button" className={styles.utilityBtn} onClick={handleExportCsv} disabled={!run}>
              <FileSpreadsheet size={14} />
              ส่งออก CSV
            </button>
          </div>
        </div>

        <p className={styles.measurementNote}>เวลานี้เป็นเวลาปฏิสัมพันธ์ในฉากจำลอง รวมเวลาที่ผู้ใช้เลือก ไม่ใช่ความเร็วหรือผลทดสอบหุ่นจริง การส่งต่อและผู้รับบริการเป็นข้อมูลสมมติ ไม่มีข้อสรุปด้านสุขภาพจากเดโมนี้</p>
        {initialHistoryError && <p role="alert">{initialHistoryError}</p>}
        {saveError && <div role="alert" className={styles.saveNotice}>
          <p>{saveError}</p>
          <button type="button" className={styles.utilityBtn} disabled={isSavingRun} onClick={() => run && void persistRunToBackend(run)}>ลองบันทึกอีกครั้ง</button>
        </div>}
        <p role="status" aria-label="สถานะการบันทึก">{isSavingRun ? "กำลังบันทึก Run Log…" : savedCode === runCode ? "บันทึก Run Log ในฐานข้อมูลแล้ว" : currentOutcome ? "Run Log อยู่ในหน้านี้ ยังไม่ได้ยืนยันการบันทึกฐานข้อมูล" : "กำลังรอการตัดสินใจของผู้ใช้"}</p>

        {/* Summary Metrics Strip: Explicitly separates Test Case Passed vs Navigation Succeeded */}
        <dl className={styles.metricsStrip}>
          <div className={styles.metricCell}>
            <dt>รหัสรอบการรัน / รุ่นหุ่นยนต์</dt>
            <dd>
              {runCode} · {robot?.canonicalName || requestedRobotId}
            </dd>
          </div>
          <div className={styles.metricCell}>
            <dt>เวอร์ชันฉาก / โหมดจำลอง</dt>
            <dd>{sceneVersion}</dd>
          </div>
          <div className={styles.metricCell}>
            <dt>ผ่านกรณีทดสอบ (Test Case Passed)</dt>
            <dd>
              {currentOutcome ? (
                <span className={currentOutcome.testCasePassed ? styles.passPill : styles.neutralPill}>
                  {currentOutcome.testCasePassed ? "ลำดับเหตุการณ์ตรงตามคาด (PASS)" : "ลำดับเหตุการณ์ไม่ตรงตามคาด (FAIL)"}
                </span>
              ) : (
                <span className={styles.neutralPill}>รอเลือกการตัดสินใจ</span>
              )}
            </dd>
          </div>
          <div className={styles.metricCell}>
            <dt>ภารกิจนำทางสำเร็จ (Navigation Succeeded)</dt>
            <dd>
              {currentOutcome?.navigationSucceeded ? (
                <span className={styles.passPill}>นำทางถึงจุดหมาย (YES)</span>
              ) : (
                <span className={styles.neutralPill}>
                  {phase === "HANDOFF_STAFF"
                    ? "ส่งต่อเจ้าหน้าที่ (NO)"
                    : phase === "CANCELLED"
                    ? "ผู้ใช้ยกเลิก (NO)"
                    : phase === "ERROR_RECOVERY"
                    ? "โหมดกู้คืน (NO)"
                    : "ยังไม่เริ่มนำทาง"}
                </span>
              )}
            </dd>
          </div>
          <div className={styles.metricCell}>
            <dt>เวลาที่ใช้ไปทั้งหมด</dt>
            <dd>{elapsedSec.toFixed(1)} วินาที {isSavingRun ? "(กำลังบันทึก…)" : ""}</dd>
          </div>
        </dl>

        {/* Tab 1: Ordered Event Log Table */}
        {activeBottomTab === "log" && (
          <div role="tabpanel" id="hri-panel-log" aria-labelledby="hri-tab-log" tabIndex={0}>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>เวลา (วินาที)</th>
                    <th>ผู้กระทำ (Actor)</th>
                    <th>รหัสเหตุการณ์ (Action)</th>
                    <th>รายละเอียดเหตุการณ์</th>
                    <th>สถานะหลังเหตุการณ์</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.seq}>
                      <td>#{ev.seq}</td>
                      <td>{ev.timeSec.toFixed(1)}s</td>
                      <td>
                        <span className={styles.actorTag}>{ev.actor}</span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{ev.action}</td>
                      <td>{ev.detail}</td>
                      <td>
                        <span className={styles.monoTag}>{ev.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {savedRuns.length > 0 && (
              <div className={styles.historyBar}>
                <span className={styles.historyLabel}>
                  ประวัติการรันที่บันทึกในฐานข้อมูล ({savedRuns.length}):
                </span>
                {savedRuns.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.historyChip} ${
                      item.runCode === runCode ? styles.historyChipActive : ""
                    }`}
                    disabled={phase === "GUIDING" || isSavingRun}
                    onClick={() => openSavedRun(item)}
                  >
                    {item.runCode} · {item.terminalStatus} ({item.durationSec}s)
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeBottomTab === "verification" && (
          <div className={styles.tableWrap} role="tabpanel" id="hri-panel-verification" aria-labelledby="hri-tab-verification" tabIndex={0}>
            <p>ผลจากรุ่น เวอร์ชันฉาก และโหมดเดียวกัน: {observedRuns.filter(item => hriOutcome(item.events, item.errorReason)?.testCasePassed).length} / {observedRuns.length} รอบมีลำดับเหตุการณ์ตรงตามคาด (รวมรอบในหน้านี้ที่ยังไม่บันทึก)</p>
            <table className={styles.dataTable}>
              <thead><tr><th>กรณีทดสอบ</th><th>ผลที่คาดหวัง</th><th>ผลที่พบจริงล่าสุด</th><th>ผ่านกรณี / นำทางสำเร็จ</th></tr></thead>
              <tbody>{HRI_CASES.map(definition => {
                const observed = observedRuns.find(item => item.testCaseType === definition.type);
                const verified = observed ? hriOutcome(observed.events, observed.errorReason) : null;
                return <tr key={definition.type}>
                  <td>{definition.label}</td><td>{definition.expected}</td>
                  <td>{observed ? <>{observed.runCode}<br />{observed.terminalStatus} · {verified?.durationSec ?? observed.durationSec}s</> : "ยังไม่ได้ทดสอบ (Not run)"}</td>
                  <td>{observed ? <>{verified?.testCasePassed ? "PASS" : "FAIL"} / {verified?.navigationSucceeded ? "YES" : "NO"}</> : "—"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Scope & Expansion Notes */}
        {activeBottomTab === "architecture" && (
          <div className={styles.docSplit} role="tabpanel" id="hri-panel-architecture" aria-labelledby="hri-tab-architecture" tabIndex={0}>
            <div className={styles.docColumn}>
              <h3>สิ่งที่ทำจริงในรอบนี้ (In-Scope M01)</h3>
              <ul className={styles.docList}>
                <li>
                  เชื่อมปุ่ม <code>ทดลอง HRI</code> จากการ์ดในหน้า <code>/robots</code> และหน้าโปรไฟล์หุ่นยนต์เข้าสู่ฉากจำลองจุดต้อนรับศูนย์สุขภาวะ
                </li>
                <li>
                  แสดงข้อมูลจากทะเบียนจริง (ชื่อรุ่น, ผู้พัฒนา, สถานะในไทย, แหล่งข้อมูลอ้างอิง) แยกจากป้าย{" "}
                  <code>สถานการณ์จำลอง HRI</code> อย่างชัดเจน
                </li>
                <li>
                  รองรับการตัดสินใจของผู้ใช้ครบทั้ง 3 ทางเลือก (นำทาง, ขอเจ้าหน้าที่, ยกเลิก) และการกู้คืนเมื่อโหลดรุ่นไม่สำเร็จ
                </li>
                <li>
                  บันทึก Run Log ลงฐานข้อมูล PostgreSQL (<code>HriSimulationRun</code>) และส่งออกไฟล์ JSON / CSV ได้ทันที
                </li>
              </ul>
            </div>
            <div className={styles.docColumn}>
              <h3>แนวทางขยายต่อในอนาคต (Next Iteration)</h3>
              <ul className={styles.docList}>
                <li>
                  เชื่อมต่อโมเดล 3D URDF / WebGL หรือสะพานเชื่อม ROS 2 (<code>rosbridge_suite</code>) สำหรับหุ่นยนต์ที่มีไฟล์จำลองทางกายภาพ
                </li>
                <li>
                  เพิ่มการจำลองสิ่งกีดขวางแบบไดนามิกในโถงทางเดินศูนย์สุขภาวะ (Dynamic Crowd Avoidance)
                </li>
                <li>
                  เพิ่มหน้าเปรียบเทียบสถิติเวลาตอบสนอง HRI ระหว่างหุ่นยนต์หลายรุ่นในทะเบียน HumanoidTH
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
