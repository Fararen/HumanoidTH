"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GRID_TASK, LESSONS } from "@/lib/platform-catalog";
import { runGridProgram } from "@/lib/grid-simulator";
import RunReplay from "@/components/platform/RunReplay";
import styles from "./try.module.css";

type Trial = { completed: string[]; program: string; team: string; members: string; draft: string };
const STORAGE_KEY = "humanoidth-browser-trial-v1";
const initial: Trial = { completed: [], program: GRID_TASK.starter, team: "", members: "", draft: "" };

export default function TryWorkspace() {
  const [data, setData] = useState<Trial>(initial);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ReturnType<typeof runGridProgram> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setData({ completed: Array.isArray(saved.completed) ? saved.completed.filter((id: unknown): id is string => typeof id === "string" && LESSONS.some(lesson => lesson.id === id)) : [], program: typeof saved.program === "string" ? saved.program : initial.program, team: typeof saved.team === "string" ? saved.team : "", members: typeof saved.members === "string" ? saved.members : "", draft: typeof saved.draft === "string" ? saved.draft : "" });
      }
    } catch { setMessage("ไม่สามารถอ่านข้อมูลที่บันทึกใน browser ได้ · Saved browser data is unavailable."); }
    setReady(true);
  }, []);

  function save(next: Trial, notice: string) {
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setMessage(notice); }
    catch { setMessage("บันทึกใน browser ไม่ได้ โปรดตรวจการตั้งค่า storage · Browser storage is unavailable."); }
  }
  function run() {
    try {
      const next = runGridProgram(data.program);
      setResult(next); setError("");
      save(data, "บันทึกโปรแกรมไว้ใน browser แล้ว · Program saved in this browser.");
    } catch { setResult(null); setError("ใช้คำสั่ง F, L หรือ R คั่นด้วยช่องว่าง จำนวน 1–100 คำสั่ง · Use 1–100 F, L or R commands separated by spaces."); }
  }

  return <main className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>HUMANOIDTH · TRY IT YOURSELF</span>
      <h1>ทดลองหุ่นยนต์<br /><span>ได้ทันที</span></h1>
      <p>เรียนรู้คำสั่ง ทดลองจำลองการนำทาง และฝึกเตรียมข้อมูลสำหรับแข่งขันหรือชุมชน</p>
      <div className={styles.heroActions}><a className={styles.primary} href="#simulator">เริ่มทดลอง Simulator ↓</a><a href="#lessons">ดูบทเรียน</a></div>
      <p className={styles.note}>ไม่ต้องเข้าสู่ระบบ · ผลทดลองเก็บใน browser นี้เท่านั้น · ไม่ส่งข้อมูลเข้าฐานข้อมูลจริง</p>
    </header>
    <nav className={styles.nav} aria-label="ส่วนทดลอง"><a href="#lessons">01 บทเรียน</a><a href="#simulator">02 Simulator</a><a href="#competition">03 แข่งขัน</a><a href="#community">04 ชุมชน</a></nav>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
    <section id="lessons" className={styles.section}><div className={styles.heading}><span>01 / LEARN</span><h2>เริ่มจากบทเรียนสั้น ๆ</h2><p>ทำเครื่องหมายเพื่อเก็บความคืบหน้าไว้ใน browser</p></div>
      <div className={styles.lessons}>{LESSONS.map(lesson => <article key={lesson.id}><label><input type="checkbox" disabled={!ready} checked={data.completed.includes(lesson.id)} onChange={event => save({ ...data, completed: event.target.checked ? [...data.completed, lesson.id] : data.completed.filter(id => id !== lesson.id) }, "บันทึกความคืบหน้าแล้ว · Progress saved.")} /><strong>{lesson.title}</strong></label><p>{lesson.goal}</p><details><summary>อ่านบทเรียน</summary>{lesson.body.map(text => <p key={text}>{text}</p>)}</details></article>)}</div>
    </section>
    <section id="simulator" className={styles.section}><div className={styles.heading}><span>02 / SIMULATE</span><h2>ลองเขียนคำสั่งนำทาง</h2><p>พาหุ่นยนต์จากมุมซ้ายบนไปจุดหมาย (4,4) โดยหลบช่องสีเข้ม</p></div>
      <div className={styles.simulator}><div><label className={styles.label} htmlFor="try-program">โปรแกรม · คำสั่ง F, L, R</label><textarea id="try-program" value={data.program} onChange={event => setData({ ...data, program: event.target.value })} rows={4} /><p className={styles.hint}>F เดินหน้า · L เลี้ยวซ้าย · R เลี้ยวขวา · คั่นแต่ละคำสั่งด้วยช่องว่าง</p><button type="button" disabled={!ready} onClick={run}>รันโปรแกรม · Run</button>{error && <p role="alert" className={styles.error}>{error}</p>}{result && <p className={styles.result} role="status">{result.succeeded ? "ถึงจุดหมายแล้ว" : "ยังไม่ถึงจุดหมาย"} · {result.steps} คำสั่ง · {result.score} คะแนน{result.reason && ` · ${result.reason}`}</p>}</div><RunReplay key={result ? JSON.stringify(result.events) : "empty"} events={result?.events ?? []} pending={false} /></div>
    </section>
    <section id="competition" className={styles.section}><div className={styles.heading}><span>03 / COMPETE</span><h2>เตรียมทีมทดลอง</h2><p>ลองกรอกข้อมูลสมัครแข่งขัน ข้อมูลนี้เป็นแบบฝึกหัดและยังไม่ได้ส่งสมัครจริง</p></div><form className={styles.form} onSubmit={event => { event.preventDefault(); save(data, "บันทึกร่างทีมใน browser แล้ว · Team draft saved."); }}><label>ชื่อทีม<input required maxLength={100} value={data.team} onChange={event => setData({ ...data, team: event.target.value })} /></label><label>สมาชิกและแนวคิด<textarea required maxLength={2000} rows={3} value={data.members} onChange={event => setData({ ...data, members: event.target.value })} /></label><button disabled={!ready}>บันทึกร่างทีม</button></form></section>
    <section id="community" className={styles.section}><div className={styles.heading}><span>04 / COMMUNITY</span><h2>ร่างเรื่องที่อยากแบ่งปัน</h2><p>ฝึกเขียนโพสต์เกี่ยวกับโปรเจกต์หุ่นยนต์ ร่างนี้ยังไม่เผยแพร่</p></div><form className={styles.form} onSubmit={event => { event.preventDefault(); save(data, "บันทึกร่างโพสต์ใน browser แล้ว · Post draft saved."); }}><label>ข้อความ<textarea required maxLength={5000} rows={5} value={data.draft} onChange={event => setData({ ...data, draft: event.target.value })} /></label><button disabled={!ready}>บันทึกร่างโพสต์</button></form></section>
    <footer className={styles.footer}><p>พร้อมสำรวจข้อมูลจริงหรือยัง?</p><Link href="/">กลับหน้าแรก · Explore HumanoidTH →</Link></footer>
  </main>;
}
