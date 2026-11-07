"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  Save,
  Send,
  ShieldCheck
} from "lucide-react";
import type { CompanyModelRecord, CompanyPublishedFields } from "@/lib/company-leaderboard";
import styles from "@/app/leaderboards/company/CompanyLeaderboard.module.css";

interface CompanyModelPortalClientProps {
  initialModel: CompanyModelRecord;
}

export default function CompanyModelPortalClient({
  initialModel
}: CompanyModelPortalClientProps) {
  const [model, setModel] = useState<CompanyModelRecord>(initialModel);
  const [companyName, setCompanyName] = useState(initialModel.companyName);
  const [contactName, setContactName] = useState(initialModel.contactName);
  const [contactEmail, setContactEmail] = useState(initialModel.contactEmail);
  const [contactPhone, setContactPhone] = useState(initialModel.contactPhone || "");
  const [modelName, setModelName] = useState(initialModel.modelName);
  const [version, setVersion] = useState(initialModel.version);
  const [hardwareSpec, setHardwareSpec] = useState(initialModel.hardwareSpec);
  const [firmwareVersion, setFirmwareVersion] = useState(initialModel.firmwareVersion);
  const [taskEvaluated, setTaskEvaluated] = useState(initialModel.taskEvaluated);

  const [publishedFields, setPublishedFields] = useState<CompanyPublishedFields>(
    initialModel.publishedFields
  );
  const [allowContact, setAllowContact] = useState<boolean>(initialModel.allowContact);
  const [isBusy, setIsBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCompanyAction = async (action: "SAVE_DRAFT" | "SUBMIT_FOR_REVIEW") => {
    setIsBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/company-models/${model.modelCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          modelName,
          version,
          hardwareSpec,
          firmwareVersion,
          taskEvaluated
        })
      });
      const data = await res.json();
      if (!data.success || !data.model) {
        setErrorMsg(data.error || "ไม่สามารถบันทึกข้อมูลได้");
        return;
      }
      setModel(data.model);
      setToastMsg(data.message || "อัปเดตข้อมูลเรียบร้อยแล้ว");
      setTimeout(() => setToastMsg(null), 4000);
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmPublish = async () => {
    setIsBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/company-models/${model.modelCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_PUBLISH",
          publishedFields,
          allowContact
        })
      });
      const data = await res.json();
      if (!data.success || !data.model) {
        setErrorMsg(data.error || "ไม่สามารถยืนยันการเผยแพร่ได้");
        return;
      }
      setModel(data.model);
      setToastMsg(data.message || "ยืนยันเผยแพร่ขึ้น Company Leaderboard สำเร็จ");
      setTimeout(() => setToastMsg(null), 4500);
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการยืนยันเผยแพร่");
    } finally {
      setIsBusy(false);
    }
  };

  const canConfirmListing =
    (model.workflowStatus === "PASSED" || model.workflowStatus === "PUBLISHED") &&
    model.safetyStatus === "PASSED";

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <Link
            href={`/leaderboards/company/${model.groupId}`}
            className={styles.secondaryBtn}
          >
            <ArrowLeft size={14} /> กลับไปตาราง Company Leaderboard
          </Link>
          <span className={styles.demoBadge}>
            <Database size={13} /> พอร์ทัลบริษัท (ข้อมูลเดโม · {model.modelCode})
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/ops/company/${model.modelCode}`} className={styles.secondaryBtn}>
            <ClipboardCheck size={14} /> สลับไปหน้าผู้ตรวจ (/ops/company/{model.modelCode})
          </Link>
          <Link href={`/robots/${model.modelCode}`} className={styles.secondaryBtn}>
            <Eye size={14} /> ดูหน้าโปรไฟล์ผู้ซื้อ (/robots/{model.modelCode})
          </Link>
        </div>
      </div>

      {toastMsg && (
        <div className={styles.toast} role="status">
          <span>{toastMsg}</span>
          <Link
            href={`/leaderboards/company/${model.groupId}`}
            style={{ color: "#ffffff", fontWeight: 800, textDecoration: "underline" }}
          >
            เปิดดูตารางอันดับทันที →
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className={styles.calloutWarn} role="alert">
          <strong>ไม่สามารถดำเนินการได้</strong>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Summary Card */}
      <section className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>
              {model.modelName} ({model.version})
            </h1>
            <p className={styles.pageLead}>
              บริษัท: <strong>{model.companyName}</strong> · โปรโตคอล:{" "}
              <span className={styles.monoCode}>{model.protocolCode}</span> · กลุ่มงาน:{" "}
              {model.groupName}
            </p>
          </div>

          <div className={styles.headerActions}>
            {model.workflowStatus === "PUBLISHED" && (
              <span className={styles.passBadge}>
                <CheckCircle2 size={14} /> เผยแพร่บน Company Leaderboard แล้ว
              </span>
            )}
            {model.workflowStatus === "PASSED" && (
              <span className={styles.reviewBadge}>
                <ShieldCheck size={14} /> ผ่านเกณฑ์แล้ว · รอบริษัทยืนยันเผยแพร่ด้านล่าง
              </span>
            )}
            {model.workflowStatus === "SUBMITTED" && (
              <span className={styles.reviewBadge}>
                <ClipboardCheck size={14} /> ส่งตรวจแล้ว · รอผู้ตรวจบันทึกผล
              </span>
            )}
            {model.workflowStatus === "NEEDS_REVISION" && (
              <span className={styles.warnBadge}>
                <AlertTriangle size={14} /> ต้องปรับปรุงตามเกณฑ์โปรโตคอล
              </span>
            )}
            {model.workflowStatus === "DRAFT" && (
              <span className={styles.draftBadge}>ร่างคำขอ (Draft)</span>
            )}
          </div>
        </div>

        {/* Evaluator Feedback Banner (Especially visible for Model C or Passed Model B) */}
        {model.workflowStatus === "NEEDS_REVISION" ? (
          <div className={styles.calloutWarn}>
            <strong>
              เหตุผลที่ต้องแก้ไขจากผู้ตรวจประเมิน ({model.evaluatorName || "ผู้ตรวจโปรโตคอล"}):
            </strong>
            <span>{model.evaluatorNotes}</span>
            <span style={{ fontSize: 12 }}>
              คำแนะนำ: บริษัทสามารถปรับปรุงค่าพารามิเตอร์เฟิร์มแวร์หรือฮาร์ดแวร์ในแบบฟอร์มด้านล่าง แล้วกด{" "}
              <strong>&ldquo;ส่งตรวจซ้ำ (Resubmit for Review)&rdquo;</strong> เพื่อส่งกลับไปยังคิวผู้ตรวจได้ทันที
            </span>
          </div>
        ) : (
          <div className={styles.calloutSuccess}>
            <strong>
              ผลการตรวจและหมายเหตุจากผู้ตรวจ ({model.evaluatorName || "ผู้ตรวจโปรโตคอล"}):
            </strong>
            <span>{model.evaluatorNotes || "พร้อมสำหรับการส่งตรวจตามโปรโตคอล"}</span>
          </div>
        )}

        <dl className={styles.protocolStrip}>
          <div className={styles.specCell}>
            <dt>ผลประเมิน Safety (เกณฑ์ผ่าน)</dt>
            <dd>
              {model.safetyStatus === "PASSED"
                ? "ผ่านตามเกณฑ์ตัวอย่าง"
                : "ต้องปรับปรุงตามเกณฑ์ตัวอย่าง"}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>ค่าคลาดเคลื่อนตำแหน่ง (Precision)</dt>
            <dd>
              {model.precisionMm !== null ? `${model.precisionMm.toFixed(1)} มม.` : "รอผลวัด"}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>เวลาเฉลี่ยต่อรอบ (Speed)</dt>
            <dd>
              {model.speedSec !== null ? `${model.speedSec.toFixed(1)} วินาทีต่อรอบ` : "รอผลวัด"}
            </dd>
          </div>
          <div className={styles.specCell}>
            <dt>รายงานผลทดสอบที่อ้างอิง</dt>
            <dd>{model.sampleReportTitle || "รายงานตัวอย่างตามโปรโตคอล"}</dd>
          </div>
        </dl>
      </section>

      {/* Main 2-Column Layout: Left = Edit/Resubmit Request, Right = #listing Preview & Publish Confirmation */}
      <div className={styles.twoColGrid}>
        {/* Left Column: Model Submission & Revision Form */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                ข้อมูลรุ่นและเวอร์ชันที่ยื่นประเมิน (แก้ไขหรือส่งตรวจซ้ำได้)
              </h2>
              <span className={styles.sectionSub}>
                เมื่อแก้ไขฮาร์ดแวร์หรือเฟิร์มแวร์แล้ว สามารถกดบันทึกร่างหรือส่งให้ผู้ตรวจทวนผลได้ทันที
              </span>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.label}>
              <span>ชื่อบริษัท</span>
              <input
                type="text"
                className={styles.input}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>ชื่อผู้ติดต่อ</span>
              <input
                type="text"
                className={styles.input}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>อีเมลติดต่อ</span>
              <input
                type="email"
                className={styles.input}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>โทรศัพท์ติดต่อ</span>
              <input
                type="text"
                className={styles.input}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>ชื่อรุ่นหุ่นยนต์</span>
              <input
                type="text"
                className={styles.input}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>เวอร์ชันที่ยื่นตรวจ</span>
              <input
                type="text"
                className={styles.input}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>เฟิร์มแวร์ควบคุม (Firmware Version)</span>
              <input
                type="text"
                className={styles.input}
                value={firmwareVersion}
                onChange={(e) => setFirmwareVersion(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>รายละเอียดฮาร์ดแวร์และเซนเซอร์ความปลอดภัย</span>
              <textarea
                rows={3}
                className={styles.textarea}
                value={hardwareSpec}
                onChange={(e) => setHardwareSpec(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>ขอบเขตงานที่ประเมินตามโปรโตคอล</span>
              <input
                type="text"
                className={styles.input}
                value={taskEvaluated}
                onChange={(e) => setTaskEvaluated(e.target.value)}
              />
            </label>

            <div
              className={styles.fieldFull}
              style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", paddingTop: 6 }}
            >
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={isBusy}
                onClick={() => void handleCompanyAction("SAVE_DRAFT")}
              >
                <Save size={14} /> บันทึกเป็นร่าง (Save Draft)
              </button>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={isBusy}
                  onClick={() => void handleCompanyAction("SUBMIT_FOR_REVIEW")}
                >
                  <Send size={14} />
                  {model.workflowStatus === "NEEDS_REVISION"
                    ? "ส่งตรวจซ้ำหลังแก้ไข (Resubmit)"
                    : "ส่งให้ผู้ตรวจทวนผล (Submit for Review)"}
                </button>
                <Link
                  href={`/ops/company/${model.modelCode}`}
                  className={styles.secondaryBtn}
                >
                  ไปที่หน้าผู้ตรวจ <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: #listing Public Listing Preview & Confirm Publish */}
        <section id="listing" className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                ตัวอย่างการเผยแพร่และยืนยันขึ้นตาราง (#listing)
              </h2>
              <span className={styles.sectionSub}>
                เลือกข้อมูลสาธารณะที่อนุญาตให้ผู้ซื้อเปิดดูเมื่อผลประเมินผ่านและเวอร์ชันตรงกับรายงานที่ตรวจแล้ว
              </span>
            </div>
          </div>

          <div className={styles.checkboxList}>
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={publishedFields.showHardwareSpec}
                onChange={(e) =>
                  setPublishedFields((prev) => ({
                    ...prev,
                    showHardwareSpec: e.target.checked
                  }))
                }
              />
              <span>แสดงข้อมูลจำเพาะฮาร์ดแวร์ ({hardwareSpec.slice(0, 42)}…)</span>
            </label>

            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={publishedFields.showFirmwareVersion}
                onChange={(e) =>
                  setPublishedFields((prev) => ({
                    ...prev,
                    showFirmwareVersion: e.target.checked
                  }))
                }
              />
              <span>แสดงเวอร์ชันเฟิร์มแวร์ที่ผ่านการรับรอง ({firmwareVersion})</span>
            </label>

            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={publishedFields.showTestConditions}
                onChange={(e) =>
                  setPublishedFields((prev) => ({
                    ...prev,
                    showTestConditions: e.target.checked
                  }))
                }
              />
              <span>แสดงเงื่อนไขและสภาพแวดล้อมการทดสอบตามโปรโตคอล</span>
            </label>

            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={publishedFields.showEvidenceLinks}
                onChange={(e) =>
                  setPublishedFields((prev) => ({
                    ...prev,
                    showEvidenceLinks: e.target.checked
                  }))
                }
              />
              <span>อนุญาตให้ผู้ซื้อเปิดดูรายการหลักฐานและรายงานผลตัวอย่าง ({model.evidenceLinks.length} รายการ)</span>
            </label>

            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={allowContact}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAllowContact(checked);
                  setPublishedFields((prev) => ({
                    ...prev,
                    showContactButton: checked
                  }));
                }}
              />
              <span>เปิดปุ่มแสดงข้อมูลติดต่อฝ่ายขายของบริษัทบนหน้าโปรไฟล์รุ่น</span>
            </label>
          </div>

          {/* Live Buyer Preview Box */}
          <div
            style={{
              background: "#f6f8f6",
              border: "1px solid #d2dfd6",
              borderRadius: 10,
              padding: "14px 16px",
              display: "grid",
              gap: 8,
              fontSize: 12.5
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>ตัวอย่างแถวที่จะปรากฏบน Company Leaderboard:</strong>
              <span className={styles.demoBadge}>ข้อมูลเดโม</span>
            </div>
            <div>
              <strong>{modelName}</strong> ({version}) · {companyName}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={styles.monoCode}>
                Safety: {model.safetyStatus === "PASSED" ? "ผ่านตามเกณฑ์ตัวอย่าง" : "ต้องปรับปรุง"}
              </span>
              <span className={styles.monoCode}>
                Precision: {model.precisionMm !== null ? `${model.precisionMm.toFixed(1)} มม.` : "—"}
              </span>
              <span className={styles.monoCode}>
                Speed: {model.speedSec !== null ? `${model.speedSec.toFixed(1)} วินาที` : "—"}
              </span>
            </div>
            {publishedFields.showHardwareSpec && (
              <div style={{ color: "#465a4f" }}>ฮาร์ดแวร์ที่เปิดเผย: {hardwareSpec}</div>
            )}
            {allowContact && (
              <div style={{ color: "#1f4733", fontWeight: 700 }}>
                ผู้ติดต่อที่อนุญาตให้แสดง: {contactName} ({contactEmail})
              </div>
            )}
          </div>

          {!canConfirmListing && (
            <div className={styles.calloutWarn}>
              <strong>ยังไม่สามารถกดยืนยันเผยแพร่ขึ้นตารางสาธารณะได้</strong>
              <span>
                รุ่นนี้ต้องผ่านการตรวจอนุมัติจากผู้ตรวจ (สถานะ <code>PASSED</code>) และผ่านเกณฑ์{" "}
                <code>Safety</code> ก่อน กรุณาส่งตรวจและเปิดหน้า{" "}
                <Link href={`/ops/company/${model.modelCode}`} style={{ color: "#6e1a1a", fontWeight: 800 }}>
                  /ops/company/{model.modelCode}
                </Link>{" "}
                เพื่อบันทึกผลผ่านจากฝั่งผู้ตรวจ
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canConfirmListing || isBusy}
              onClick={() => void handleConfirmPublish()}
            >
              <CheckCircle2 size={15} />
              {model.isPublished
                ? "อัปเดตการตั้งค่าเผยแพร่ (แสดง 1 รายการต่อรุ่นและเวอร์ชัน)"
                : "ยืนยันเผยแพร่ขึ้น Company Leaderboard"}
            </button>

            <Link
              href={`/leaderboards/company/${model.groupId}`}
              className={styles.secondaryBtn}
            >
              เปิดดูตารางอันดับ <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
