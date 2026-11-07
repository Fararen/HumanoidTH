"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  ShieldCheck
} from "lucide-react";
import type { CompanyModelRecord } from "@/lib/company-leaderboard";
import styles from "@/app/leaderboards/company/CompanyLeaderboard.module.css";

interface CompanyProductProfileClientProps {
  model: CompanyModelRecord;
}

export default function CompanyProductProfileClient({
  model
}: CompanyProductProfileClientProps) {
  const [showContactModal, setShowContactModal] = useState(false);

  const publicEvidence = model.evidenceLinks.filter((ev) => ev.publicAllowed);

  return (
    <div className={styles.page}>
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <Link
            href={`/leaderboards/company/${model.groupId}`}
            className={styles.secondaryBtn}
          >
            <ArrowLeft size={14} /> กลับไปตาราง Company Leaderboard ({model.groupName})
          </Link>
          <span className={styles.demoBadge}>
            <Database size={13} /> ข้อมูลเดโม (M02 · โปรไฟล์ผลประเมินรายรุ่น /robots/{model.modelCode})
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/company/models/${model.modelCode}`} className={styles.secondaryBtn}>
            <Building2 size={14} /> จัดการในพอร์ทัลบริษัท
          </Link>
        </div>
      </div>

      {/* Unpublished Warning for Buyer View */}
      {!model.isPublished && (
        <div className={styles.calloutWarn}>
          <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={15} /> รุ่นนี้ยังไม่ได้รับการยืนยันเผยแพร่สู่สาธารณะ (สถานะปัจจุบัน: {model.workflowStatus})
          </strong>
          <span>
            ผู้ซื้อทั่วไปจะเห็นเฉพาะรุ่นที่ผ่านเกณฑ์โปรโตคอลและบริษัทยืนยันเผยแพร่แล้วเท่านั้น หากต้องการเปิดเผยรุ่นนี้ กรุณาไปที่{" "}
            <Link
              href={`/company/models/${model.modelCode}#listing`}
              style={{ color: "#6e1a1a", fontWeight: 800 }}
            >
              หน้ายืนยันการเผยแพร่ของบริษัท (#listing)
            </Link>
          </span>
        </div>
      )}

      {/* Header & Metrics Summary (Visible immediately before scrolling) */}
      <section className={styles.headerCard} aria-label="ข้อมูลสรุปผลประเมินรายรุ่น">
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>
              {model.modelName} ({model.version})
            </h1>
            <p className={styles.pageLead}>
              บริษัทผู้พัฒนา: <strong>{model.companyName}</strong> · คลาสหุ่นยนต์: {model.robotClass} · ประเมินเมื่อ{" "}
              {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
                new Date(model.evaluatedAt)
              )}
            </p>
          </div>

          <div className={styles.headerActions}>
            {model.isPublished &&
            model.allowContact &&
            model.publishedFields.showContactButton ? (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setShowContactModal((prev) => !prev)}
              >
                <Mail size={15} />
                {showContactModal
                  ? "ซ่อนข้อมูลติดต่อบริษัท"
                  : "เปิดข้อมูลติดต่อที่บริษัทอนุญาต"}
              </button>
            ) : (
              <span className={styles.draftBadge}>
                บริษัทไม่ได้เปิดเผยช่องทางติดต่อสาธารณะสำหรับรายการนี้
              </span>
            )}
          </div>
        </div>

        {showContactModal &&
          model.isPublished &&
          model.allowContact &&
          model.publishedFields.showContactButton && (
            <div className={styles.calloutSuccess} role="region" aria-label="ข้อมูลติดต่อผู้ขาย">
              <strong>ข้อมูลติดต่อฝ่ายขายและวิศวกรรมที่บริษัทอนุญาตให้เปิดเผย (ข้อมูลเดโม):</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13, marginTop: 4 }}>
                <span>
                  <strong>ผู้ประสานงาน:</strong> {model.contactName}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Mail size={14} /> {model.contactEmail}
                </span>
                {model.contactPhone && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Phone size={14} /> {model.contactPhone}
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Key Protocol Metrics Strip */}
        <dl className={styles.protocolStrip}>
          <div className={styles.specCell}>
            <dt>เกณฑ์ความปลอดภัย (Safety Gate)</dt>
            <dd>
              {model.safetyStatus === "PASSED" ? (
                <span className={styles.passBadge}>
                  <CheckCircle2 size={13} /> ผ่านตามเกณฑ์ตัวอย่าง
                </span>
              ) : (
                <span className={styles.warnBadge}>
                  <AlertTriangle size={13} /> ต้องปรับปรุงตามเกณฑ์ตัวอย่าง
                </span>
              )}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>ค่าคลาดเคลื่อนตำแหน่ง Precision (มม.)</dt>
            <dd className={styles.metricValue}>
              {model.precisionMm !== null ? `${model.precisionMm.toFixed(1)} มม.` : "—"}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>เวลาเฉลี่ยต่อรอบ Speed (วินาทีต่อรอบ)</dt>
            <dd className={styles.metricValue}>
              {model.speedSec !== null ? `${model.speedSec.toFixed(1)} วินาที` : "—"}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>โปรโตคอลและกลุ่มงานที่ประเมิน</dt>
            <dd>
              <span className={styles.monoCode}>{model.protocolCode}</span> · ข้อมูลเดโม
            </dd>
          </div>
        </dl>
      </section>

      {/* Main 2-Column Details: Left = Evaluated Task, Conditions & Specs, Right = Authorized Evidence */}
      <div className={styles.twoColGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>
              ขอบเขตงาน เงื่อนไขการทดสอบ และข้อมูลจำเพาะที่บริษัทอนุญาตให้เผยแพร่
            </h2>
          </div>

          <dl style={{ display: "grid", gap: 14, margin: 0 }}>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: "#52665b" }}>
                งานที่ประเมิน (Evaluated Task)
              </dt>
              <dd style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>
                {model.taskEvaluated}
              </dd>
            </div>

            {model.publishedFields.showTestConditions && (
              <div>
                <dt style={{ fontSize: 12, fontWeight: 700, color: "#52665b" }}>
                  วันและเงื่อนไขของผลทดสอบ (Test Conditions &amp; Protocol Scope)
                </dt>
                <dd style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>
                  {model.testConditions}
                </dd>
              </div>
            )}

            {model.publishedFields.showHardwareSpec && (
              <div>
                <dt style={{ fontSize: 12, fontWeight: 700, color: "#52665b" }}>
                  ฮาร์ดแวร์และอุปกรณ์ปลายแขนที่ใช้ในรอบรับรองผล
                </dt>
                <dd style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55 }}>
                  {model.hardwareSpec}
                </dd>
              </div>
            )}

            {model.publishedFields.showFirmwareVersion && (
              <div>
                <dt style={{ fontSize: 12, fontWeight: 700, color: "#52665b" }}>
                  เวอร์ชันเฟิร์มแวร์และซอฟต์แวร์ควบคุมที่ผ่านการตรวจทาน
                </dt>
                <dd style={{ margin: "4px 0 0", fontSize: 13.5 }}>
                  <span className={styles.monoCode}>{model.firmwareVersion}</span> (ตรงกับเวอร์ชันรุ่น{" "}
                  <span className={styles.monoCode}>{model.version}</span>)
                </dd>
              </div>
            )}
          </dl>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>
              หลักฐานและรายงานผลที่อนุญาตให้เผยแพร่ ({publicEvidence.length})
            </h2>
          </div>

          {model.publishedFields.showEvidenceLinks && publicEvidence.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  background: "#f6f8f6",
                  border: "1px solid #d2dfd6",
                  borderRadius: 9,
                  padding: "12px 14px",
                  fontSize: 12.5,
                  lineHeight: 1.5
                }}
              >
                <strong style={{ display: "flex", alignItems: "center", gap: 6, color: "#1c2420" }}>
                  <ShieldCheck size={15} style={{ color: "#244e39" }} />
                  {model.sampleReportTitle}
                </strong>
                <p style={{ margin: "6px 0 0", color: "#465a4f" }}>{model.sampleReportSummary}</p>
              </div>

              {publicEvidence.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #dce6df",
                    borderRadius: 8,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 12.5
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={15} style={{ color: "#244e39", flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: "block", color: "#1c2420" }}>{item.title}</strong>
                      <span style={{ fontSize: 11, color: "#52665b" }}>
                        ประเภทหลักฐาน: {item.type} · ข้อมูลเดโม
                      </span>
                    </div>
                  </div>
                  <Link href={item.url} className={styles.secondaryBtn}>
                    เปิดดู <ExternalLink size={12} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "#52665b" }}>
              บริษัทยังไม่ได้เปิดเผยไฟล์หลักฐานต่อสาธารณะสำหรับรุ่นนี้
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
