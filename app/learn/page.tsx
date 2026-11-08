import Link from "next/link";
import { ArrowRight, BookOpen, Check, GraduationCap, LockKeyhole } from "lucide-react";
import { LESSONS, type PlatformData } from "@/lib/platform-catalog";
import { getSessionUser } from "@/lib/session";
import { listRecords } from "@/lib/platform-store";
import styles from "./learn.module.css";

export default async function Page() {
  const user = await getSessionUser();
  const progress = user ? await listRecords("PROGRESS", user, "mine") : [];
  const completed = new Set(progress.map((record) => (record.data as PlatformData).lessonId).filter((id): id is string => typeof id === "string"));
  const nextLesson = LESSONS.find((lesson) => !completed.has(lesson.id));
  const progressPercent = Math.round((completed.size / LESSONS.length) * 100);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><GraduationCap size={16} aria-hidden="true" /> LEARN · ROBOTICS BASICS</span>
          <h1>เริ่มเรียนรู้<br />หุ่นยนต์ไปทีละขั้น</h1>
          <p>เส้นทางสั้น ๆ ตั้งแต่อ่านข้อมูลหุ่นยนต์ ทดลองคำสั่งแรก ไปจนถึงเข้าใจผลการทดลอง</p>
          <div className={styles.heroTags}><span>ผู้เริ่มต้น · Beginner</span><span>ไม่ต้องมีหุ่นยนต์จริง</span></div>
          <Link className={styles.primaryAction} href={nextLesson ? `/learn/${nextLesson.id}` : "/learn"}>
            {nextLesson ? "เริ่มเรียนต่อ · Continue learning" : "ทบทวนบทเรียน · Review lessons"}<ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <aside className={styles.progressCard} aria-label="ความคืบหน้าการเรียน">
          <div className={styles.progressTop}><span>YOUR LEARNING PATH</span><BookOpen size={18} aria-hidden="true" /></div>
          <strong className={styles.progressCount}>{completed.size}<span> / {LESSONS.length}</span></strong>
          <p>บทเรียนที่เรียนจบ</p>
          <div className={styles.progressTrack} role="progressbar" aria-label="ความคืบหน้า" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div>
          <div className={styles.progressFoot}><span>{progressPercent}% complete</span><span>{user ? "บันทึกในบัญชีแล้ว" : "เข้าสู่ระบบเพื่อบันทึก"}</span></div>
        </aside>
      </section>

      <section className={styles.lessonsSection} aria-labelledby="lessons-title">
        <header className={styles.sectionHeader}>
          <div><span className={styles.sectionEyebrow}>THREE SHORT LESSONS</span><h2 id="lessons-title">เส้นทางการเรียน</h2><p>เรียนตามลำดับเพื่อเชื่อมความรู้กับการทดลองจริง</p></div>
          {!user && <span className={styles.saveHint}><LockKeyhole size={14} aria-hidden="true" /> เข้าสู่ระบบเพื่อบันทึกความคืบหน้า</span>}
        </header>

        <ol className={styles.lessonGrid}>
          {LESSONS.map((lesson, index) => {
            const isComplete = completed.has(lesson.id);
            const isNext = !isComplete && nextLesson?.id === lesson.id;
            return (
              <li key={lesson.id}>
                <Link className={`${styles.lessonCard}${isNext ? ` ${styles.lessonCardNext}` : ""}`} href={`/learn/${lesson.id}`}>
                  <div className={styles.lessonTop}>
                    <span className={styles.lessonNumber}>0{index + 1}</span>
                    <span className={`${styles.lessonStatus}${isComplete ? ` ${styles.statusComplete}` : isNext ? ` ${styles.statusNext}` : ""}`}>
                      {isComplete ? <><Check size={13} aria-hidden="true" /> เรียนแล้ว</> : isNext ? "บทเรียนถัดไป" : "รอเรียน"}
                    </span>
                  </div>
                  <h3>{lesson.title.replace(/^\d+\s*·\s*/, "")}</h3>
                  <p>{lesson.goal}</p>
                  <div className={styles.lessonFooter}><span>{isComplete ? "ทบทวนบทเรียน" : isNext ? "เริ่มบทเรียน" : "ดูรายละเอียด"}</span><ArrowRight size={16} aria-hidden="true" /></div>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
