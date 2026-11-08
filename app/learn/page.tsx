import Link from "next/link";
import { LESSONS } from "@/lib/platform-catalog";
import { getSessionUser } from "@/lib/session";
import { listRecords } from "@/lib/platform-store";
export default async function Page() {
  const user=await getSessionUser();
  const progress=user ? await listRecords("PROGRESS", user, "mine") : [];
  return <div className="platform-page"><h1>เริ่มเรียนหุ่นยนต์ · Learn robotics</h1><p>เส้นทางมือใหม่ · ใช้คอมพิวเตอร์หรือมือถือและเว็บเบราว์เซอร์ ไม่ต้องมีหุ่นยนต์จริง</p><p>เป้าหมาย: อ่านแหล่งข้อมูล เขียนคำสั่งแรก และอธิบายผลจากการทดลอง</p><div className="platform-grid">{LESSONS.map(lesson => <Link className="platform-card" key={lesson.id} href={`/learn/${lesson.id}`}><h2>{lesson.title}</h2><p>{lesson.goal}</p><strong>{progress.some(record => (record.data as Record<string,unknown>).lessonId === lesson.id) ? "เรียนแล้ว · Completed" : "เริ่มเรียน · Start"}</strong></Link>)}</div></div>;
}
