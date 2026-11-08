import Link from "next/link";
import { ArrowRight, Award, Bot, FlaskConical, Trophy } from "lucide-react";
import styles from "./all-leaderboards.module.css";

type Ranking = { name: string; detail: string; score: string; metric: string };
type Board = {
  id: string;
  category: string;
  title: string;
  description: string;
  href: string;
  action: string;
  metricLabel: string;
  icon: typeof Bot;
  rankings: Ranking[];
};

const boards: Board[] = [
  {
    id: "company",
    category: "COMPANY",
    title: "Industrial pick & place",
    description: "ผลทดสอบรุ่นหุ่นยนต์ที่ผ่านเกณฑ์และได้รับอนุญาตให้เผยแพร่",
    href: "/leaderboards/company/industrial-pick-place",
    action: "ดู Company leaderboard",
    metricLabel: "ความแม่นยำ · mm (ยิ่งน้อยยิ่งดี)",
    icon: Bot,
    rankings: [
      { name: "EEC PickBot X2", detail: "EEC Robotics · PICK-PLACE v1", score: "1.8", metric: "mm" },
      { name: "SUT Arm A", detail: "Suranaree Robotics Lab · PICK-PLACE v1", score: "2.4", metric: "mm" },
      { name: "KMITL Cobot 3", detail: "KMITL Automation · PICK-PLACE v1", score: "3.1", metric: "mm" },
    ],
  },
  {
    id: "benchmark",
    category: "BENCHMARK",
    title: "Grid navigation · grid-v1",
    description: "เปรียบเทียบผลจากฉากและโปรโตคอลจำลองเวอร์ชันเดียวกัน",
    href: "/leaderboards/benchmark/simulation-grid-navigation-grid-v1",
    action: "ดู Simulation benchmark",
    metricLabel: "คะแนนภารกิจ · / 100",
    icon: FlaskConical,
    rankings: [
      { name: "Chula RoboNav", detail: "Chulalongkorn University · 18 steps", score: "96", metric: "/100" },
      { name: "FIBO Pathfinders", detail: "KMUTT · 20 steps", score: "92", metric: "/100" },
      { name: "Lanna Motion Lab", detail: "Chiang Mai University · 22 steps", score: "88", metric: "/100" },
    ],
  },
  {
    id: "competition",
    category: "COMPETITION",
    title: "Thailand Humanoid Navigation",
    description: "อันดับตัวอย่างจากรอบแข่งขันสำหรับแสดงรูปแบบคะแนนและทีม",
    href: "/competitions",
    action: "ดูการแข่งขันทั้งหมด",
    metricLabel: "คะแนนรวม · / 1,000",
    icon: Trophy,
    rankings: [
      { name: "Team Chula RoboCup", detail: "รอบ Online · 14 submissions", score: "982", metric: "/1,000" },
      { name: "FIBO Humanoid", detail: "รอบ Online · 12 submissions", score: "954", metric: "/1,000" },
      { name: "KMUTT Motion Team", detail: "รอบ Online · 11 submissions", score: "927", metric: "/1,000" },
    ],
  },
];

export default function Page() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><Award size={14} aria-hidden="true" /> ATLAS SCOREBOARD</span>
          <h1>All leaderboards</h1>
          <p>ดูผลทดสอบ Benchmark และการแข่งขันหุ่นยนต์ไทยในที่เดียว</p>
        </div>
        <div className={styles.demoFlag}><span aria-hidden="true">●</span> ข้อมูลจำลองสำหรับแสดงตัวอย่าง UI</div>
        <nav className={styles.boardNav} aria-label="ประเภทตารางอันดับ">
          {boards.map((board) => <a href={`#${board.id}`} key={board.id}>{board.category}<ArrowRight size={13} aria-hidden="true" /></a>)}
        </nav>
      </header>

      <div className={styles.notice} role="note">
        <span className={styles.noticeDot} aria-hidden="true" />
        <p><strong>ตัวอย่างเท่านั้น</strong> คะแนน ทีม และผลในหน้านี้เป็นข้อมูลจำลอง ไม่ใช่ผลรับรองจากห้องทดสอบหรือผู้จัดการแข่งขัน</p>
      </div>

      <section className={styles.summary} aria-label="สรุปตารางอันดับ">
        <div><span>LEADERBOARD TYPES</span><strong>03</strong><small>Company · Benchmark · Competition</small></div>
        <div><span>RANKINGS SHOWN</span><strong>09</strong><small>ตัวอย่าง 3 อันดับต่อประเภท</small></div>
        <div><span>SCORING RULE</span><strong>By protocol</strong><small>เทียบเฉพาะภารกิจและเวอร์ชันเดียวกัน</small></div>
      </section>

      <div className={styles.sectionHeading}>
        <div><span className={styles.eyebrow}>RANKING PREVIEW</span><h2>อันดับล่าสุด</h2></div>
        <span className={styles.updated}><span aria-hidden="true" /> ตัวอย่างข้อมูล</span>
      </div>

      <div className={styles.boardList}>
        {boards.map((board) => {
          const Icon = board.icon;
          return (
            <section className={styles.board} id={board.id} key={board.id} aria-labelledby={`${board.id}-title`}>
              <header className={styles.boardHeader}>
                <div className={styles.boardIdentity}>
                  <span className={styles.boardIcon}><Icon size={19} aria-hidden="true" /></span>
                  <div><span className={styles.boardCategory}>{board.category} · DEMO</span><h3 id={`${board.id}-title`}>{board.title}</h3></div>
                </div>
                <p>{board.description}</p>
              </header>
              <div className={styles.metricLabel}>{board.metricLabel}</div>
              <ol className={styles.rankingList}>
                {board.rankings.map((item, index) => (
                  <li key={item.name}>
                    <span className={`${styles.rank} ${index === 0 ? styles.rankFirst : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.rankName}><strong>{item.name}</strong><small>{item.detail}</small></span>
                    <span className={styles.rankScore}><strong>{item.score}</strong><small>{item.metric}</small></span>
                  </li>
                ))}
              </ol>
              <footer className={styles.boardFooter}><span>ข้อมูลตัวอย่าง · Ruleset v1</span><Link href={board.href}>{board.action}<ArrowRight size={15} aria-hidden="true" /></Link></footer>
            </section>
          );
        })}
      </div>
    </main>
  );
}
