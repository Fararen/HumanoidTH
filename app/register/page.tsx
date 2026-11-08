import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, BadgeCheck, Database, UserRound, Users } from "lucide-react";
import RegisterAccountForm from "@/app/profile/RegisterAccountForm";
import styles from "@/app/profile/Profile.module.css";

export const metadata: Metadata = {
  title: "Create an account | Thailand Humanoid Atlas",
  description: "Create an Atlas account to join the community and track your robotics contributions.",
  robots: { index: false, follow: false }
};

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "th";
  const th = lang === "th";
  const copy = th ? {
    kicker: "เข้าร่วม HUMANOIDTH ATLAS",
    title: "สร้างบัญชีเพื่อร่วมพัฒนาระบบนิเวศหุ่นยนต์",
    lead: "ติดตามผลงาน ส่งข้อมูล และเข้าร่วมกิจกรรมชุมชนได้ในที่เดียว",
    track: "ติดตามสถานะข้อมูลที่ส่ง",
    evidence: "เก็บประวัติและหลักฐานผลงาน",
    community: "เชื่อมต่องานกับชุมชน",
    formKicker: "เริ่มต้นใช้งาน",
    formTitle: "สมัครสมาชิก Atlas",
    formLead: "เลือกประเภทบัญชีและกรอกอีเมลเพื่อดำเนินการต่อ",
    existing: "มีบัญชีแล้ว? ใช้อีเมลเดิมเพื่อเข้าสู่โปรไฟล์",
    profile: "ไปที่โปรไฟล์"
  } : {
    kicker: "JOIN HUMANOIDTH ATLAS",
    title: "Create an account to help map robotics in Thailand",
    lead: "Track your contributions, submit research and robot records, and take part in the community.",
    track: "Track submitted records",
    evidence: "Keep your work and evidence together",
    community: "Connect your work with the community",
    formKicker: "GET STARTED",
    formTitle: "Create your Atlas account",
    formLead: "Choose an account type and enter your email to continue.",
    existing: "Already have an account? Sign in with your email and password.",
    profile: "Open profile"
  };

  return <div className={styles.profilePage}>
    <header className={styles.pageHeading}>
      <div><span className={styles.kicker}>{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.lead}</p></div>
      <Link className={styles.headingLink} href="/sign-in">{copy.profile} <ArrowRight size={16} aria-hidden="true" /></Link>
    </header>
    <div className={styles.signedOutLayout}>
      <section className={styles.welcomeCard}>
        <span className={styles.welcomeIcon}><UserRound size={22} aria-hidden="true" /></span>
        <span className={styles.kicker}>{th ? "พื้นที่ทำงานของคุณ" : "YOUR ATLAS WORKSPACE"}</span>
        <h2>{th ? "ผลงานของคุณช่วยให้ภาพรวมชัดขึ้น" : "Your work helps complete the picture."}</h2>
        <p>{copy.lead}</p>
        <div className={styles.benefitList}>
          <span><BadgeCheck size={17} aria-hidden="true" />{copy.track}</span>
          <span><Database size={17} aria-hidden="true" />{copy.evidence}</span>
          <span><Users size={17} aria-hidden="true" />{copy.community}</span>
        </div>
      </section>
      <section className={styles.authCard}>
        <div className={styles.cardHeading}><span className={styles.kicker}>{copy.formKicker}</span><h2>{copy.formTitle}</h2><p>{copy.formLead}</p></div>
        <RegisterAccountForm lang={lang} />
        <p className={styles.registerHint}>{copy.existing}</p>
      </section>
    </div>
  </div>;
}
