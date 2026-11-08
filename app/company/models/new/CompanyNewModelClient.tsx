"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Database, Save, Send } from "lucide-react";
import styles from "@/app/leaderboards/company/CompanyLeaderboard.module.css";

export default function CompanyNewModelClient() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Eastern Automation Lab (อีสเทิร์น ออโตเมชัน)");
  const [contactName, setContactName] = useState("นันทิดา พงศ์ไพศาล (Product Manager)");
  const [contactEmail, setContactEmail] = useState("contact-demo@easternauto.th");
  const [contactPhone, setContactPhone] = useState("038-000-220 (ข้อมูลเดโม)");
  const [modelName, setModelName] = useState("รุ่นตัวอย่าง D · EEC-PickBot Lite");
  const [version, setVersion] = useState("v1.0.0");
  const [robotClass, setRobotClass] = useState("6-DOF Industrial Collaborative Manipulator");
  const [hardwareSpec, setHardwareSpec] = useState(
    "แขนกล 6 แกน Payload 5 kg · กล้อง 3D Structured Light บนข้อมือ · กริปเปอร์ไฟฟ้าควบคุมแรงบีบอัตโนมัติ"
  );
  const [firmwareVersion, setFirmwareVersion] = useState("EEC-MotionCore v1.0.0");
  const [taskEvaluated, setTaskEvaluated] = useState(
    "หยิบวางชิ้นงานในภาคการผลิตตามโปรโตคอล TH-IND-PP-2026.1 (50 รอบต่อเนื่อง)"
  );
  const [protocolCode, setProtocolCode] = useState("TH-IND-PP-2026.1");
  const [pilotIndicatorNote, setPilotIndicatorNote] = useState(
    "ต้องการให้ผู้ซื้อเห็นผลความแม่นยำการหยิบวางชิ้นงาน (Precision มม.) และความเร็วเฉลี่ยต่อรอบ (Speed วินาที) พร้อมใบรับรอง Safety"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveOrSubmit = async (targetStatus: "DRAFT" | "SUBMITTED") => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/company-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: "industrial-pick-place",
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          modelName,
          version,
          robotClass,
          hardwareSpec,
          firmwareVersion,
          taskEvaluated,
          protocolCode,
          workflowStatus: targetStatus
        })
      });
      const data = await res.json();
      if (!data.success || !data.model) {
        setErrorMsg(data.error || "ไม่สามารถบันทึกข้อมูลรุ่นหุ่นยนต์ได้");
        return;
      }
      router.push(`/company/models/${data.model.id}`);
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <Link href="/leaderboards/company/industrial-pick-place" className={styles.secondaryBtn}>
            <ArrowLeft size={14} /> กลับไปตาราง Company Leaderboard
          </Link>
          <span className={styles.demoBadge}>
            <Database size={13} /> ข้อมูลเดโม (M02 · /company/models/new)
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/company/models/m02-model-b" className={styles.secondaryBtn}>
            เปิดร่างรุ่นตัวอย่าง B ที่มีอยู่แล้ว (m02-model-b)
          </Link>
          <Link href="/company/models/m02-model-c" className={styles.secondaryBtn}>
            เปิดรุ่นตัวอย่าง C ที่ต้องแก้ไข (m02-model-c)
          </Link>
        </div>
      </div>

      <section className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>
              ยื่นข้อมูลรุ่นหุ่นยนต์เพื่อรับการประเมินและขึ้น Company Leaderboard
            </h1>
            <p className={styles.pageLead}>
              กรอกข้อมูลขั้นต่ำของรุ่น ได้แก่ บริษัท ผู้ติดต่อ ชื่อรุ่น ฮาร์ดแวร์ เฟิร์มแวร์ งาน และโปรโตคอลที่ขอใช้ โดยสามารถบันทึกเป็นฉบับร่างหรือส่งให้ผู้ตรวจทวนผลได้ทันที
            </p>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className={styles.calloutWarn} role="alert">
          <strong>ไม่สามารถบันทึกคำขอได้</strong>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.twoColGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>
              ข้อมูลขั้นต่ำของรุ่นและโปรโตคอลที่ขอประเมิน
            </h2>
            <span className={styles.sectionSub}>บังคับกรอกทุกช่องที่มีเครื่องหมาย *</span>
          </div>

          <form
            className={styles.formGrid}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSaveOrSubmit("SUBMITTED");
            }}
          >
            <label className={styles.label}>
              <span>ชื่อบริษัทผู้พัฒนา / ผู้นำเข้า *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>ชื่อผู้ติดต่อประสานงาน *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>อีเมลผู้ติดต่อ *</span>
              <input
                type="email"
                required
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
              <span>ชื่อรุ่นหุ่นยนต์ (Model Name) *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>เวอร์ชันของรุ่น (Version) *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>คลาสหุ่นยนต์ (Robot Class) *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={robotClass}
                onChange={(e) => setRobotClass(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>เวอร์ชันเฟิร์มแวร์ / ซอฟต์แวร์ควบคุม (Firmware) *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={firmwareVersion}
                onChange={(e) => setFirmwareVersion(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>ข้อมูลจำเพาะฮาร์ดแวร์และอุปกรณ์ปลายแขน (Hardware Specification) *</span>
              <textarea
                rows={3}
                required
                className={styles.textarea}
                value={hardwareSpec}
                onChange={(e) => setHardwareSpec(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              <span>กลุ่มงานและโปรโตคอลที่ขอใช้ *</span>
              <select
                className={styles.select}
                value={protocolCode}
                onChange={(e) => setProtocolCode(e.target.value)}
              >
                <option value="TH-IND-PP-2026.1">
                  TH-IND-PP-2026.1 · หุ่นยนต์หยิบวางชิ้นงานในภาคการผลิต (Pick &amp; Place)
                </option>
              </select>
            </label>

            <label className={styles.label}>
              <span>งานที่ประเมิน (Evaluated Task) *</span>
              <input
                type="text"
                required
                className={styles.input}
                value={taskEvaluated}
                onChange={(e) => setTaskEvaluated(e.target.value)}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldFull}`}>
              <span>
                ตัวชี้วัดและหลักฐานที่บริษัทต้องการให้ผู้ซื้อเห็นในการทดลองนำร่อง (สำหรับกำหนดขอบเขต M03)
              </span>
              <textarea
                rows={2}
                className={styles.textarea}
                value={pilotIndicatorNote}
                onChange={(e) => setPilotIndicatorNote(e.target.value)}
              />
            </label>

            <div
              className={styles.fieldFull}
              style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6 }}
            >
              <button
                type="button"
                className={styles.secondaryBtn}
                disabled={isSubmitting}
                onClick={() => void handleSaveOrSubmit("DRAFT")}
              >
                <Save size={14} /> บันทึกร่างคำขอ (Save Draft)
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                <Send size={14} /> ส่งให้ผู้ตรวจประเมิน (Submit for Review)
              </button>
            </div>
          </form>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.sectionTitle}>ขั้นตอนเข้าสู่ Company Leaderboard</h2>
          </div>

          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10, fontSize: 13, lineHeight: 1.55, color: "#36473e" }}>
            <li>
              <strong>1. บริษัทยื่นข้อมูลรุ่นและโปรโตคอล:</strong> บันทึกร่างหรือส่งคำขอพร้อมระบุเวอร์ชันฮาร์ดแวร์และเฟิร์มแวร์ที่ใช้ทดสอบ
            </li>
            <li>
              <strong>2. ผู้ตรวจทวนผลตามโปรโตคอล:</strong> ผู้ตรวจตรวจสอบว่ารุ่นและเวอร์ชันตรงกับรายงานผลทดสอบ และผ่านเกณฑ์ <strong>Safety</strong> หรือไม่
            </li>
            <li>
              <strong>3. บริษัทตรวจตัวอย่างและยืนยันเผยแพร่:</strong> เมื่อผลผ่านแล้ว บริษัทเลือกฟิลด์และหลักฐานที่จะเปิดเผยต่อสาธารณะ แล้วกดยืนยันขึ้นตาราง
            </li>
            <li>
              <strong>4. ผู้ซื้อเปรียบเทียบและติดต่อ:</strong> รุ่นที่ยืนยันแล้วจะถูกจัดอันดับตามค่าคลาดเคลื่อนตำแหน่ง <strong>Precision (มม.)</strong> จากน้อยไปมาก
            </li>
          </ol>

          <div className={styles.calloutSuccess} style={{ marginTop: 8 }}>
            <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Building2 size={15} /> ทางลัดสำหรับซ้อมเดโม 4 นาที
            </strong>
            <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              หากต้องการเดินเดโมของ <strong>รุ่นตัวอย่าง B (EEC-PickBot X2)</strong> จากสถานะร่างไปจนถึงขึ้นตารางอันดับที่ 2 ต่อจากรุ่น A สามารถกดเปิด{" "}
              <Link href="/company/models/m02-model-b" style={{ color: "#114228", fontWeight: 800 }}>
                /company/models/m02-model-b
              </Link>{" "}
              ได้ทันที
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
