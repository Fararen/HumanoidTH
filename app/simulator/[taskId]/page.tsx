import Link from "next/link";
import { notFound } from "next/navigation";
import { GRID_TASK } from "@/lib/platform-catalog";
import RunReplay from "@/components/platform/RunReplay";
export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  if ((await params).taskId !== GRID_TASK.id) notFound();
    return <div className="platform-page"><h1>ฝึกนำทาง · Grid navigation</h1><p>ใช้คำสั่ง F L R เพื่อไปจาก (0,0) ถึง (4,4) โดยไม่ชนสิ่งกีดขวาง เริ่มหันไปทางขวา จำกัด {GRID_TASK.maxSteps} คำสั่ง</p><p>คะแนน = 100 ลบจำนวนคำสั่งที่เกิน 9 เมื่อถึงจุดหมาย ผลล้มเหลวได้ 0 คะแนน เวอร์ชัน {GRID_TASK.version}</p><RunReplay events={[]} pending={false} /><Link href={`/simulator/${GRID_TASK.id}/workspace`}>เปิด Workspace · Start coding</Link> · <Link href="/try#simulator">ทดลองโดยไม่ต้องเข้าสู่ระบบ · Try without signing in</Link> · <Link href="/learn/navigation">อ่านบทเรียน · Tutorial</Link></div>;
}
