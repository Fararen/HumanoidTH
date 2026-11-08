import Link from "next/link";
export default function Page() { return <div className="platform-page"><h1>ตารางอันดับ · Leaderboards</h1><div className="platform-grid">
  <section className="platform-card"><h2>Company</h2><p>รุ่นที่ผ่านเกณฑ์และได้รับอนุญาตให้เผยแพร่</p><Link href="/leaderboards/company/industrial-pick-place">เปิดอันดับบริษัท · Company rankings</Link></section>
  <section className="platform-card"><h2>Benchmark</h2><p>เปรียบเทียบภายใต้โปรโตคอลและเวอร์ชันเดียวกัน</p><Link href="/leaderboards/benchmark/physical-pick-place-pilot-v1">Physical pilot</Link> · <Link href="/leaderboards/benchmark/simulation-grid-navigation-grid-v1">Simulation</Link></section>
  <section className="platform-card"><h2>Competition</h2><p>ผลที่กรรมการรับรองและผู้จัดประกาศแล้ว แยกรุ่นและรอบ</p><Link href="/competitions">เลือกรายการแข่งขัน · Choose competition</Link></section>
  </div></div>; }
