import Link from "next/link";
import { PILOT_PROTOCOL } from "@/lib/platform-catalog";
export default function Evaluate() {
  return <div className="platform-page"><h1>ประเมินหุ่นยนต์ · Robot evaluation</h1><p>ส่งคำขอ กำหนดขอบเขต ยืนยันแผน นัดทดสอบ และรับรายงานส่วนตัว</p><section className="platform-card"><h2>โปรโตคอลนำร่อง · Pilot protocol</h2><p className="platform-notice">ข้อมูลเดโม · ใช้สำหรับทดสอบระบบงาน ไม่มีการรับรองหุ่นจริงจากตัวอย่างนี้</p><p>{PILOT_PROTOCOL.code} · {PILOT_PROTOCOL.conditions}</p><p>Precision: mm (lower is better) · Speed: seconds/cycle · Safety: pass required</p><p>{PILOT_PROTOCOL.safety}</p><Link href="/evaluate/physical/new">ส่งคำขอ · Request evaluation</Link></section><nav className="platform-links"><Link href="/me">My requests</Link><Link href="/leaderboards">Leaderboards</Link><Link href="/robots">Atlas robot IDs</Link></nav></div>;
}
