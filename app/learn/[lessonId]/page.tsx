import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS } from "@/lib/platform-catalog";
import { getSessionUser } from "@/lib/session";
import { CreateForm } from "@/components/platform/Forms";
export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const id=(await params).lessonId, index=LESSONS.findIndex(lesson => lesson.id === id), lesson=LESSONS[index];
  if (!lesson) notFound();
  const user=await getSessionUser();
  return <article className="platform-page"><Link href="/learn">← เส้นทางการเรียน</Link><h1>{lesson.title}</h1><p><strong>เป้าหมาย: {lesson.goal}</strong></p><section className="platform-card">{lesson.body.map((paragraph,index) => <p key={paragraph}><b>{index+1}.</b> {paragraph}</p>)}</section><Link href={lesson.href}>เปิดงานฝึก · Open exercise</Link>
    {user ? <CreateForm kind="PROGRESS" title={lesson.title} fields={[]} defaults={{ lessonId: id }} redirect={false} label="บันทึกว่าเรียนแล้ว · Mark completed" /> : <p><Link href={`/sign-in?from=/learn/${id}`}>เข้าสู่ระบบเพื่อบันทึกความคืบหน้า</Link></p>}
    <nav className="platform-links">{index > 0 && <Link href={`/learn/${LESSONS[index-1].id}`}>บทก่อนหน้า</Link>}{index < LESSONS.length-1 && <Link href={`/learn/${LESSONS[index+1].id}`}>บทถัดไป</Link>}<Link href="/competitions">การแข่งขันที่เปิดรับ</Link></nav>
  </article>;
}
