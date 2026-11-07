import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Building2, Check, LockKeyhole, Sparkles } from "lucide-react";
import { loginAsSubscriber } from "@/app/actions";
import { hasDashboardSubscription } from "@/lib/subscription";
import styles from "./Subscription.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dashboard subscription | Thailand Humanoid Atlas",
  robots: { index: false, follow: false }
};

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams;
  const destination = params.from === "/analytics" ? "/analytics" : "/dashboard";
  const cookieStore = await cookies();
  const email = cookieStore.get("user_email")?.value;
  const lang = cookieStore.get("lang")?.value === "th" ? "th" : "en";
  const active = await hasDashboardSubscription();
  if (active) redirect(destination);

  const th = lang === "th";
  const copy = th ? {
    kicker: "ATLAS SUBSCRIPTION",
    title: "เลือกแผนสมาชิก",
    lead: "เลือกสิทธิ์ที่เหมาะกับการสำรวจและติดตามระบบนิเวศหุ่นยนต์",
    freeName: "สมาชิกฟรี", freePrice: "฿0", freePeriod: "ตลอดไป", freeLead: "สำรวจ Atlas และร่วมกิจกรรมชุมชน",
    plusName: "Atlas Plus", plusPrice: "กำหนดราคา", plusPeriod: "ต่อรอบบิล", plusLead: "ปลดล็อก Dashboard และ Analytics",
    orgName: "Organization", orgPrice: "ติดต่อทีมงาน", orgPeriod: "สำหรับองค์กร", orgLead: "สิทธิ์ใช้งานสำหรับทีมและบริษัท",
    freeFeatures: ["สำรวจข้อมูลสาธารณะ", "เข้าร่วม Community", "ส่งข้อมูลและติดตามโปรไฟล์"],
    plusFeatures: ["Ecosystem Dashboard", "Analytics และกราฟข้อมูล", "ตัวกรองและข้อมูลสดจาก Atlas"],
    orgFeatures: ["ทุกฟีเจอร์ของ Atlas Plus", "พื้นที่ทำงานบริษัท", "จัดการบัญชีทีม"],
    recommended: "แนะนำ", chooseFree: "เลือกสมาชิกฟรี", checkoutButton: "รอเปิดระบบชำระเงิน",
    status: "ยังไม่มี subscription ที่ใช้งานอยู่ในบัญชีนี้",
    signedOut: "สมัครสมาชิกหรือเข้าสู่บัญชีก่อน เพื่อผูกสิทธิ์กับบัญชีของคุณ",
    register: "สมัครสมาชิก", profile: "ไปที่โปรไฟล์",
    checkout: "ระบบชำระเงินยังไม่ได้เชื่อมต่อ กรุณาติดต่อผู้ดูแล Atlas เพื่อเปิดใช้ subscription",
    mock: "ทดลอง Atlas Plus ด้วยบัญชีตัวอย่าง", back: "กลับหน้าหลัก"
  } : {
    kicker: "ATLAS SUBSCRIPTION",
    title: "Choose a plan",
    lead: "Pick the access level that fits how you explore Thailand's robotics ecosystem.",
    freeName: "Free", freePrice: "฿0", freePeriod: "forever", freeLead: "Explore Atlas and take part in the community.",
    plusName: "Atlas Plus", plusPrice: "Pricing soon", plusPeriod: "per billing cycle", plusLead: "Unlock Dashboard and Analytics.",
    orgName: "Organization", orgPrice: "Contact us", orgPeriod: "for teams", orgLead: "Access for robotics companies and research teams.",
    freeFeatures: ["Browse public Atlas data", "Join the community", "Submit records and track your profile"],
    plusFeatures: ["Ecosystem Dashboard", "Analytics and data visualizations", "Filters and live Atlas data"],
    orgFeatures: ["Everything in Atlas Plus", "Company workspace", "Team account management"],
    recommended: "Recommended", chooseFree: "Choose Free", checkoutButton: "Available when billing is connected",
    status: "This account does not have an active subscription.",
    signedOut: "Create or open an account first so access can be attached to your account.",
    register: "Sign up", profile: "Open profile",
    checkout: "Live subscription checkout is not connected yet. Contact the Atlas administrator to activate a subscription.",
    mock: "Try Atlas Plus with the mock subscriber", back: "Back to Atlas"
  };

  return <main className={styles.page}>
    <div className={styles.heading}><span>{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.lead}</p></div>
    <p className={styles.statusNote}><LockKeyhole size={15} aria-hidden="true" />{copy.status}</p>
    <section className={styles.planGrid} aria-label={th ? "แผนสมาชิก" : "Subscription plans"}>
      <article className={styles.planCard}>
        <div className={styles.planIcon}><BarChart3 size={19} aria-hidden="true" /></div>
        <h2>{copy.freeName}</h2><p className={styles.planLead}>{copy.freeLead}</p>
        <div className={styles.price}>{copy.freePrice}<small>{copy.freePeriod}</small></div>
        <ul>{copy.freeFeatures.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul>
        <Link className={styles.secondary} href={email ? "/profile" : "/register"}>{copy.chooseFree} <ArrowRight size={15} aria-hidden="true" /></Link>
      </article>
      <article className={`${styles.planCard} ${styles.featured}`}>
        <span className={styles.recommended}>{copy.recommended}</span>
        <div className={styles.planIcon}><Sparkles size={19} aria-hidden="true" /></div>
        <h2>{copy.plusName}</h2><p className={styles.planLead}>{copy.plusLead}</p>
        <div className={styles.price}>{copy.plusPrice}<small>{copy.plusPeriod}</small></div>
        <ul>{copy.plusFeatures.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul>
        <button className={styles.disabledButton} type="button" disabled>{copy.checkoutButton}</button>
        {process.env.NODE_ENV !== "production" && <form action={loginAsSubscriber}><button className={styles.mockButton} type="submit"><BarChart3 size={16} aria-hidden="true" />{copy.mock}</button></form>}
      </article>
      <article className={styles.planCard}>
        <div className={styles.planIcon}><Building2 size={19} aria-hidden="true" /></div>
        <h2>{copy.orgName}</h2><p className={styles.planLead}>{copy.orgLead}</p>
        <div className={styles.price}>{copy.orgPrice}<small>{copy.orgPeriod}</small></div>
        <ul>{copy.orgFeatures.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul>
        <Link className={styles.secondary} href="/profile">{copy.profile} <ArrowRight size={15} aria-hidden="true" /></Link>
      </article>
    </section>
    <p className={styles.checkoutNote}>{copy.checkout}</p>
    {!email && <p className={styles.signedOutNote}>{copy.signedOut} <Link href="/register">{copy.register}</Link></p>}
    <Link className={styles.back} href="/">{copy.back}</Link>
  </main>;
}
