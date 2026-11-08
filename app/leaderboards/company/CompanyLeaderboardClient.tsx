"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  FilePlus2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import type { CompanyModelRecord } from "@/lib/company-leaderboard";
import styles from "./CompanyLeaderboard.module.css";

interface GroupMeta {
  groupId: string;
  groupName: string;
  groupNameEn: string;
  protocolCode: string;
  robotClass: string;
  taskDescription: string;
  testConditions: string;
  safetyRule: string;
  rankingRule: string;
}

interface CompanyLeaderboardClientProps {
  groupMeta: GroupMeta;
  initialModels: CompanyModelRecord[];
  isDatabaseAvailable: boolean;
}

export default function CompanyLeaderboardClient({
  groupMeta,
  initialModels,
  isDatabaseAvailable
}: CompanyLeaderboardClientProps) {
  const [models, setModels] = useState<CompanyModelRecord[]>(initialModels);
  const [roleView, setRoleView] = useState<"BUYER" | "COMPANY" | "EVALUATOR">("BUYER");
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Public leaderboard only includes models that passed safety & evaluator review AND were confirmed published by the company,
  // sorted by Precision (mm) ascending, then Speed (sec/cycle) ascending.
  const publishedLeaderboard = useMemo(() => {
    const seenModelVersion = new Set<string>();
    return models
      .filter((m) => {
        if (!m.isPublished || m.workflowStatus !== "PUBLISHED" || m.safetyStatus !== "PASSED") {
          return false;
        }
        const key = `${m.modelCode}::${m.version}`;
        if (seenModelVersion.has(key)) return false;
        seenModelVersion.add(key);
        return true;
      })
      .sort((a, b) => {
        const precA = a.precisionMm ?? 999;
        const precB = b.precisionMm ?? 999;
        if (precA !== precB) return precA - precB;
        return (a.speedSec ?? 999) - (b.speedSec ?? 999);
      });
  }, [models]);

  const handleResetDemo = async () => {
    if (!isDatabaseAvailable) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/company-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_DEMO" })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setModels(data.models);
        setToastMessage("รีเซ็ตข้อมูลเดโม (รุ่น A, B, C) กลับสู่สถานะเริ่มต้นสำหรับรอบนำเสนอถัดไปเรียบร้อยแล้ว");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch {
      // Ignore error
    } finally {
      setIsResetting(false);
    }
  };

  const renderWorkflowBadge = (status: CompanyModelRecord["workflowStatus"]) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className={styles.passBadge}>
            <CheckCircle2 size={13} /> เผยแพร่บนตารางแล้ว
          </span>
        );
      case "PASSED":
        return (
          <span className={styles.reviewBadge}>
            <ShieldCheck size={13} /> ผ่านเกณฑ์ · รอบริษัทยืนยันเผยแพร่
          </span>
        );
      case "SUBMITTED":
        return (
          <span className={styles.reviewBadge}>
            <ClipboardCheck size={13} /> ส่งตรวจแล้ว · รอผู้ตรวจทวนผล
          </span>
        );
      case "NEEDS_REVISION":
        return (
          <span className={styles.warnBadge}>
            <AlertTriangle size={13} /> ขอแก้ไข · ต้องปรับปรุงตามเกณฑ์
          </span>
        );
      default:
        return (
          <span className={styles.draftBadge}>
            ร่างคำขอ (Draft)
          </span>
        );
    }
  };

  return (
    <div className={styles.page}>
      {/* 1. Demo Role & Reset Toolbar */}
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <span className={styles.demoBadge}>
            <Database size={13} /> ข้อมูลเดโม (M02 · Company Leaderboard)
          </span>
          <span className={styles.demoNote}>
            ตารางใช้งานจริงแสดงเฉพาะผลทดสอบหุ่นจริงที่รับรองตามโปรโตคอลและได้รับอนุญาตให้เผยแพร่
          </span>
          {!isDatabaseAvailable && <span className={styles.demoBadge} role="status">โหมดอ่านอย่างเดียว: ฐานข้อมูลผลประเมินยังไม่ได้ติดตั้ง</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className={styles.roleTabs} role="tablist" aria-label="สลับมุมมองบทบาทในเดโม">
            <button
              type="button"
              role="tab"
              aria-selected={roleView === "BUYER"}
              className={`${styles.roleTab} ${roleView === "BUYER" ? styles.roleTabActive : ""}`}
              onClick={() => setRoleView("BUYER")}
            >
              <Eye size={13} /> มุมมองผู้ซื้อ (Public Buyer)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={roleView === "COMPANY"}
              className={`${styles.roleTab} ${roleView === "COMPANY" ? styles.roleTabActive : ""}`}
              onClick={() => setRoleView("COMPANY")}
            >
              <Building2 size={13} /> มุมมองบริษัท (Company Portal)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={roleView === "EVALUATOR"}
              className={`${styles.roleTab} ${roleView === "EVALUATOR" ? styles.roleTabActive : ""}`}
              onClick={() => setRoleView("EVALUATOR")}
            >
              <ClipboardCheck size={13} /> มุมมองผู้ตรวจ (Evaluator Queue)
            </button>
          </div>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleResetDemo}
            disabled={isResetting || !isDatabaseAvailable}
            title={isDatabaseAvailable ? "รีเซ็ตข้อมูลรุ่น A, B, C กลับสู่สถานะเริ่มต้นก่อนซ้อมรอบถัดไป" : "ต้องติดตั้งตาราง CompanyModelEvaluation ก่อนจึงจะรีเซ็ตข้อมูลได้"}
          >
            <RefreshCw size={13} />
            {isResetting ? "กำลังรีเซ็ต…" : isDatabaseAvailable ? "รีเซ็ตสถานะเดโม (A–C)" : "รีเซ็ตไม่ได้ในโหมดอ่านอย่างเดียว"}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className={styles.toast} role="status">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Header & Protocol Specification Ledger (Visible before scrolling) */}
      <section className={styles.headerCard} aria-label="ข้อมูลกลุ่มงานและเกณฑ์โปรโตคอล">
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>{groupMeta.groupName}</h1>
            <p className={styles.pageLead}>{groupMeta.taskDescription}</p>
          </div>

          <div className={styles.headerActions}>
            <Link href="/company/models/new" className={styles.primaryBtn}>
              <FilePlus2 size={15} /> ส่งรุ่นประเมินเข้าตาราง (/company/models/new)
            </Link>
          </div>
        </div>

        <dl className={styles.protocolStrip}>
          <div className={styles.specCell}>
            <dt>รหัสโปรโตคอลและคลาสหุ่นยนต์</dt>
            <dd>
              <span className={styles.monoCode}>{groupMeta.protocolCode}</span> · {groupMeta.robotClass}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>เกณฑ์คัดกรองความปลอดภัย (Safety Gate)</dt>
            <dd>ต้องผ่านเกณฑ์ตัวอย่าง (Protective Stop ≤ 150 ms) จึงจะขึ้นตารางได้</dd>
          </div>
          <div className={styles.specCell}>
            <dt>ตัวชี้วัดหลักที่ใช้เรียงอันดับ (Primary Metric)</dt>
            <dd>ค่าคลาดเคลื่อนตำแหน่ง Precision (มม.) เรียงจากน้อยไปมาก</dd>
          </div>
          <div className={styles.specCell}>
            <dt>ตัวชี้วัดประกอบและสภาพแวดล้อมทดสอบ</dt>
            <dd>เวลาเฉลี่ยต่อรอบ Speed (วินาทีต่อรอบ) · ทดสอบต่อเนื่อง 50 รอบ</dd>
          </div>
        </dl>
      </section>

      {/* 3. Public Company Leaderboard Table (Only Passed + Confirmed Published models) */}
      <section className={styles.panel} aria-label="ตารางอันดับหุ่นยนต์ที่ผ่านเกณฑ์และเผยแพร่แล้ว">
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              ตารางอันดับ Company Leaderboard (เฉพาะรุ่นที่ผ่านเกณฑ์และบริษัทยืนยันเผยแพร่แล้ว)
            </h2>
            <span className={styles.sectionSub}>
              เรียงตามค่าคลาดเคลื่อนตำแหน่ง Precision (มม.) น้อยไปมาก · แสดงรายการสาธารณะเพียง 1 รายการต่อรุ่นและเวอร์ชัน
            </span>
          </div>
          <span className={styles.demoBadge}>
            แสดงผลสาธารณะ {publishedLeaderboard.length} รุ่น · ข้อมูลเดโม
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>รุ่นหุ่นยนต์และเวอร์ชัน</th>
                <th>บริษัทผู้พัฒนา</th>
                <th>Safety (เกณฑ์ผ่าน)</th>
                <th>Precision (มม. · น้อยกว่าดีกว่า)</th>
                <th>Speed (วินาทีต่อรอบ)</th>
                <th>โปรโตคอล / ข้อมูล</th>
                <th>โปรไฟล์และหลักฐาน</th>
              </tr>
            </thead>
            <tbody>
              {publishedLeaderboard.map((item, idx) => (
                <tr key={`${item.id}-${item.version}`}>
                  <td className={styles.rankCell}>
                    <span className={idx === 0 ? styles.rankBadgeTop : undefined}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{item.modelName}</strong>
                    <div style={{ fontSize: 11.5, color: "#52665b", marginTop: 2 }}>
                      เวอร์ชัน <span className={styles.monoCode}>{item.version}</span> · {item.robotClass}
                    </div>
                  </td>
                  <td>{item.companyName}</td>
                  <td>
                    <span className={styles.passBadge}>
                      <CheckCircle2 size={13} /> ผ่านตามเกณฑ์ตัวอย่าง
                    </span>
                  </td>
                  <td>
                    <span className={styles.metricValue}>
                      {item.precisionMm !== null ? `${item.precisionMm.toFixed(1)} มม.` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={styles.metricValue}>
                      {item.speedSec !== null ? `${item.speedSec.toFixed(1)} วินาที` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className={styles.monoCode}>{item.protocolCode}</span>{" "}
                    <span className={styles.demoBadge}>ข้อมูลเดโม</span>
                  </td>
                  <td>
                    <Link href={`/robots/${item.id}`} className={styles.secondaryBtn}>
                      เปิดโปรไฟล์และหลักฐาน <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Company & Evaluator Workflow Queue (Demonstrating Models A, B, C end-to-end) */}
      <section className={styles.panel} aria-label="สถานะคำขอประเมินและการเผยแพร่รายรุ่น">
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {roleView === "EVALUATOR"
                ? "คิวงานผู้ตรวจประเมินตามโปรโตคอล (Evaluator Review Queue · /ops/company/:modelId)"
                : roleView === "COMPANY"
                ? "รายการคำขอประเมินในพอร์ทัลบริษัท (Company Portal · ร่าง, ส่งตรวจ, ต้องแก้ และยืนยันเผยแพร่)"
                : "เส้นทางนำร่องตั้งแต่ส่งรุ่นประเมิน ตรวจผล ไปจนถึงการยืนยันขึ้นตาราง (M02 Workflow)"}
            </h2>
            <span className={styles.sectionSub}>
              รุ่นที่ขอแก้ไข (เช่น รุ่น C) หรือรุ่นที่ยังไม่ยืนยันเผยแพร่ (เช่น รุ่น B ในสถานะเริ่มต้น) จะแสดงในพอร์ทัลบริษัทและยังไม่ปรากฏบนตารางสาธารณะด้านบน
            </span>
          </div>
          <span className={styles.sectionSub}>ทั้งหมด {models.length} รายการในระบบเดโม</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>รหัสรุ่น / เวอร์ชัน</th>
                <th>รุ่นและบริษัท</th>
                <th>สถานะในวงจรอนุมัติ</th>
                <th>ผลวัดในห้องปฏิบัติการ (Safety / Precision / Speed)</th>
                <th>หมายเหตุผู้ตรวจประเมิน</th>
                <th>ทางลัดดำเนินการตามบทบาท</th>
              </tr>
            </thead>
            <tbody>
              {models.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.monoCode}>{item.modelCode}</span>
                    <div style={{ fontSize: 11.5, color: "#52665b", marginTop: 3 }}>
                      {item.version}
                    </div>
                  </td>
                  <td>
                    <strong>{item.modelName}</strong>
                    <div style={{ fontSize: 12, color: "#465a4f" }}>{item.companyName}</div>
                  </td>
                  <td>{renderWorkflowBadge(item.workflowStatus)}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      {item.safetyStatus === "PASSED" ? (
                        <span className={styles.passBadge}>Safety: ผ่าน</span>
                      ) : (
                        <span className={styles.warnBadge}>Safety: ต้องปรับปรุง</span>
                      )}
                      <span className={styles.monoCode}>
                        {item.precisionMm !== null ? `${item.precisionMm.toFixed(1)} มม.` : "—"}
                      </span>
                      <span className={styles.monoCode}>
                        {item.speedSec !== null ? `${item.speedSec.toFixed(1)} วินาที` : "—"}
                      </span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.45 }}>
                    {item.evaluatorNotes || "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <Link
                        href={`/company/models/${item.id}`}
                        className={styles.secondaryBtn}
                      >
                        <Building2 size={13} /> พอร์ทัลบริษัท
                      </Link>
                      <Link
                        href={`/ops/company/${item.id}`}
                        className={styles.secondaryBtn}
                      >
                        <SlidersHorizontal size={13} /> หน้าผู้ตรวจ (/ops)
                      </Link>
                      {(item.workflowStatus === "PASSED" || item.workflowStatus === "PUBLISHED") && (
                        <Link
                          href={`/company/models/${item.id}#listing`}
                          className={styles.primaryBtn}
                        >
                          ตรวจตัวอย่างและเผยแพร่
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
