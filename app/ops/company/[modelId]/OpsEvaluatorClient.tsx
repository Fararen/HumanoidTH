"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  ShieldCheck
} from "lucide-react";
import type { CompanyModelRecord } from "@/lib/company-leaderboard";
import styles from "@/app/leaderboards/company/CompanyLeaderboard.module.css";

interface OpsEvaluatorClientProps {
  initialModel: CompanyModelRecord;
}

export default function OpsEvaluatorClient({ initialModel }: OpsEvaluatorClientProps) {
  const [model, setModel] = useState<CompanyModelRecord>(initialModel);
  const [safetyStatus, setSafetyStatus] = useState<"PASSED" | "NEEDS_IMPROVEMENT">(
    initialModel.safetyStatus === "PASSED" ? "PASSED" : "NEEDS_IMPROVEMENT"
  );
  const [precisionMm, setPrecisionMm] = useState<string>(
    initialModel.precisionMm !== null ? String(initialModel.precisionMm) : "3.1"
  );
  const [speedSec, setSpeedSec] = useState<string>(
    initialModel.speedSec !== null ? String(initialModel.speedSec) : "4.2"
  );
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>(
    initialModel.evaluatorNotes ||
      "ตรวจทานเวอร์ชันฮาร์ดแวร์และเฟิร์มแวร์ตรงกับรายงานผลทดสอบตัวอย่างแล้ว"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDecision = async (decision: "PASSED" | "NEEDS_REVISION") => {
    setIsSaving(true);
    try {
      const nextSafety = safetyStatus;
      const defaultNote =
        decision === "PASSED"
          ? `ผู้ตรวจยืนยันว่าเวอร์ชัน ${model.version} (${model.firmwareVersion}) ตรงกับรายงานผลทดสอบตัวอย่าง ผ่านเกณฑ์ Safety, Precision ${precisionMm} มม. และ Speed ${speedSec} วินาที อนุญาตให้บริษัทตรวจสอบตัวอย่างและยืนยันเผยแพร่ได้`
          : evaluatorNotes ||
            "ไม่ผ่านเกณฑ์ Safety ตามโปรโตคอลตัวอย่าง กรุณาปรับปรุงเวลาหยุดฉุกเฉินและส่งตรวจซ้ำ";

      const res = await fetch(`/api/company-models/${model.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EVALUATOR_DECISION",
          decision,
          safetyStatus: nextSafety,
          precisionMm: parseFloat(precisionMm),
          speedSec: parseFloat(speedSec),
          evaluatorNotes: defaultNote
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not save review");
      if (data.success && data.model) {
        setModel(data.model);
        setSafetyStatus(data.model.safetyStatus === "PASSED" ? "PASSED" : "NEEDS_IMPROVEMENT");
        setEvaluatorNotes(data.model.evaluatorNotes || defaultNote);
        setToastMsg(data.message);
        setTimeout(() => setToastMsg(null), 4500);
      }
    } catch (error) {
      setToastMsg(error instanceof Error ? error.message : "Could not save review; retry");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <Link
            href={`/leaderboards/company/${model.groupId}`}
            className={styles.secondaryBtn}
          >
            <ArrowLeft size={14} /> กลับไปตาราง Company Leaderboard
          </Link>
          <span className={styles.demoBadge}>
            <Database size={13} /> หน้าผู้ตรวจประเมิน (ข้อมูลเดโม · /ops/company/{model.modelCode})
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={`/company/models/${model.id}#listing`}
            className={styles.primaryBtn}
          >
            <Building2 size={14} /> ไปหน้ายืนยันเผยแพร่ของบริษัท (#listing)
          </Link>
        </div>
      </div>

      {toastMsg && (
        <div className={styles.toast} role="status">
          <span>{toastMsg}</span>
          <Link
            href={`/company/models/${model.id}#listing`}
            style={{ color: "#ffffff", fontWeight: 800, textDecoration: "underline" }}
          >
            ไปหน้ายืนยันเผยแพร่ของบริษัท →
          </Link>
        </div>
      )}

      <section className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>
              ทวนสอบผลตามโปรโตคอล: {model.modelName} ({model.version})
            </h1>
            <p className={styles.pageLead}>
              ผู้ตรวจที่ได้รับมอบหมาย: <strong>{model.evaluatorName}</strong> · บริษัทที่ยื่น:{" "}
              <strong>{model.companyName}</strong>
            </p>
          </div>
          <span className={styles.monoCode}>โปรโตคอล {model.protocolCode}</span>
        </div>

        <dl className={styles.protocolStrip}>
          <div className={styles.specCell}>
            <dt>สถานะคำขอปัจจุบัน</dt>
            <dd>{model.workflowStatus}</dd>
          </div>
          <div className={styles.specCell}>
            <dt>รุ่นและเวอร์ชันเฟิร์มแวร์ที่บริษัทยื่น</dt>
            <dd>
              {model.version} · {model.firmwareVersion}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>คลาสหุ่นยนต์และฮาร์ดแวร์</dt>
            <dd>{model.robotClass}</dd>
          </div>
          <div className={styles.specCell}>
            <dt>ผู้ติดต่อประสานงานบริษัท</dt>
            <dd>
              {model.contactName} ({model.contactEmail})
            </dd>
          </div>
        </dl>
      </section>

      <div className={styles.twoColGrid}>
        {/* Left: Pilot Protocol Report & Version Verification */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                เปรียบเทียบข้อมูลรุ่นที่บริษัทยื่นกับรายงานผลทดสอบตัวอย่าง
              </h2>
              <span className={styles.sectionSub}>
                ตรวจสอบว่าเวอร์ชันฮาร์ดแวร์และเฟิร์มแวร์ตรงกับรายงานที่ห้องปฏิบัติการวัดผลไว้หรือไม่
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#f6f8f6",
              border: "1px solid #d2dfd6",
              borderRadius: 10,
              padding: "16px 18px",
              display: "grid",
              gap: 10,
              fontSize: 13
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={16} style={{ color: "#244e39" }} />
              <strong>{model.sampleReportTitle || "รายงานผลทดสอบตัวอย่างตามโปรโตคอล"}</strong>
            </div>
            <p style={{ margin: 0, lineHeight: 1.55, color: "#36473e" }}>
              {model.sampleReportSummary}
            </p>
            <div style={{ borderTop: "1px solid #dce6df", paddingTop: 10, display: "grid", gap: 6 }}>
              <div>
                <strong>ฮาร์ดแวร์ที่บันทึกในรายงาน:</strong> {model.hardwareSpec}
              </div>
              <div>
                <strong>เงื่อนไขการทดสอบ:</strong> {model.testConditions}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 750, margin: "0 0 8px" }}>
              รายการเอกสารและหลักฐานประกอบ ({model.evidenceLinks.length} รายการ)
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 13 }}>
              {model.evidenceLinks.map((ev) => (
                <li key={ev.id}>
                  <strong>{ev.title}</strong> ({ev.type})
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Right: Evaluator Decision Form */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                บันทึกผลการตรวจประเมินของผู้ตรวจ (Evaluator Decision)
              </h2>
              <span className={styles.sectionSub}>
                เลือกบันทึกผล &ldquo;ผ่านเกณฑ์&rdquo; เพื่อให้บริษัทไปกดยืนยันเผยแพร่ หรือ &ldquo;ขอแก้ไข&rdquo; พร้อมระบุเหตุผล
              </span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>ผลการตรวจเกณฑ์ความปลอดภัย (Safety Gate)</span>
              <select
                className={styles.select}
                value={safetyStatus}
                onChange={(e) =>
                  setSafetyStatus(e.target.value as "PASSED" | "NEEDS_IMPROVEMENT")
                }
              >
                <option value="PASSED">ผ่านตามเกณฑ์ตัวอย่าง (PASSED)</option>
                <option value="NEEDS_IMPROVEMENT">
                  ต้องปรับปรุงตามเกณฑ์ตัวอย่าง (NEEDS_IMPROVEMENT)
                </option>
              </select>
            </label>

            <label className={styles.label}>
              <span>ค่าคลาดเคลื่อนตำแหน่ง Precision (มม.)</span>
              <input
                type="number"
                step="0.1"
                className={styles.input}
                value={precisionMm}
                onChange={(e) => setPrecisionMm(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>เวลาเฉลี่ยต่อรอบ Speed (วินาทีต่อรอบ)</span>
              <input
                type="number"
                step="0.1"
                className={styles.input}
                value={speedSec}
                onChange={(e) => setSpeedSec(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>ความเห็นและเหตุผลของผู้ตรวจ (แสดงในพอร์ทัลบริษัททันที)</span>
              <textarea
                rows={4}
                className={styles.textarea}
                value={evaluatorNotes}
                onChange={(e) => setEvaluatorNotes(e.target.value)}
              />
            </label>

            <div
              className={styles.fieldFull}
              style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", paddingTop: 6 }}
            >
              <button
                type="button"
                className={styles.dangerBtn}
                disabled={isSaving}
                onClick={() => void handleDecision("NEEDS_REVISION")}
              >
                <AlertTriangle size={15} /> บันทึกผล: ขอให้บริษัทแก้ไข (Needs Revision)
              </button>

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={isSaving}
                onClick={() => void handleDecision("PASSED")}
              >
                <ShieldCheck size={15} /> บันทึกผล: ผ่านเกณฑ์ตามโปรโตคอล (Approve &amp; Pass)
              </button>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #e4ece7",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8
            }}
          >
            <span style={{ fontSize: 12.5, color: "#465a4f" }}>
              หลังกดบันทึกผลแล้ว สามารถสลับกลับไปที่หน้าบริษัทเพื่อดูสถานะที่เปลี่ยนไปได้ทันที
            </span>
            <Link
              href={`/company/models/${model.id}#listing`}
              className={styles.secondaryBtn}
            >
              เปิดหน้าบริษัท (#listing) <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
