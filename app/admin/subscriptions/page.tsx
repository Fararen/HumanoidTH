import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { DASHBOARD_PLAN, MANUAL_SUBSCRIPTION_PROVIDER, effectiveSubscriptionStatus } from "@/lib/subscription-policy";
import SubscriptionForm from "./SubscriptionForm";
import styles from "./Subscriptions.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage subscriptions | Thailand Humanoid Atlas", robots: { index: false, follow: false } };

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const th = (await cookies()).get("lang")?.value === "th";
  const query = (await searchParams).q;
  const q = (Array.isArray(query) ? query[0] : query ?? "").trim().slice(0, 254);
  let admin: Awaited<ReturnType<typeof getSessionUser>> = null;
  let offline = false;
  try { admin = await getSessionUser(); } catch { offline = true; }
  if (!offline && admin?.role !== "ADMIN") redirect("/admin-login?from=/admin/subscriptions");
  const demo = Boolean(admin?.id.startsWith("demo:"));
  const configured = Boolean(process.env.ADMIN_BASIC_USER && process.env.ADMIN_BASIC_PASSWORD);
  const canEdit = !offline && !demo && configured && admin?.email === process.env.ADMIN_BASIC_USER;
  let subscriptions: Array<{
    id: string; plan: string; status: string; provider: string | null; currentPeriodEnd: Date | null;
    user: { email: string; name: string | null };
  }> = [];
  if (!offline && !demo) {
    try {
      subscriptions = await prisma.subscription.findMany({
        where: { plan: DASHBOARD_PLAN, ...(q ? { user: { email: { contains: q, mode: "insensitive" as const } } } : {}) },
        orderBy: { updatedAt: "desc" }, take: 50,
        select: { id: true, plan: true, status: true, provider: true, currentPeriodEnd: true, user: { select: { email: true, name: true } } }
      });
    } catch (error) {
      console.error("Failed to load subscription management:", error);
      offline = true;
    }
  }
  const statusLabels: Record<string, string> = th
    ? { ACTIVE: "ใช้งานอยู่", CANCELED: "ยกเลิกแล้ว", PAST_DUE: "ค้างชำระ", EXPIRED: "หมดอายุ" }
    : { ACTIVE: "Active", CANCELED: "Canceled", PAST_DUE: "Past due", EXPIRED: "Expired" };
  const formatEnd = (date: Date) => new Date(date.getTime() - 1).toLocaleString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });

  return <div className={styles.page}>
    <header className={styles.heading}><div><h1>{th ? "จัดการสมาชิก Atlas Plus" : "Manage Atlas Plus members"}</h1><p>{th ? "เปิดสิทธิ์ กำหนดวันหมดอายุ และยกเลิกสิทธิ์ Dashboard กับ Analytics" : "Grant, set expiry, and revoke Dashboard and Analytics access."}</p></div><Link href="/admin">{th ? "กลับหน้าผู้ดูแล" : "Back to administration"}</Link></header>
    {offline && <p role="alert" className={styles.notice}>{th ? "โหลดข้อมูลสมาชิกไม่ได้ กรุณาตรวจสอบฐานข้อมูลและ migration ของ Subscription" : "Could not load members. Check the database connection and Subscription migration."}</p>}
    {!offline && !canEdit && <p className={styles.notice}>{th ? "การแก้ไขต้องใช้บัญชีแอดมินจริงที่ตรงกับ ADMIN_BASIC_USER และตั้งค่า ADMIN_BASIC_PASSWORD บัญชีตัวอย่างเปิดสิทธิ์จริงไม่ได้" : "Editing requires a real administrator matching ADMIN_BASIC_USER and a configured ADMIN_BASIC_PASSWORD. Demo accounts cannot grant access."}</p>}
    <div className={styles.layout}>
      <section className={styles.panel}><h2>{th ? "เปิดหรือต่ออายุสิทธิ์" : "Grant or renew access"}</h2><SubscriptionForm th={th} disabled={!canEdit || offline} /></section>
      <section className={styles.panel}>
        <h2>{th ? "รายการสิทธิ์ล่าสุด" : "Recent subscriptions"}</h2>
        <form className={styles.search} action="/admin/subscriptions"><label><span>{th ? "ค้นหาอีเมล" : "Search email"}</span><input name="q" defaultValue={q} maxLength={254} /></label><button type="submit">{th ? "ค้นหา" : "Search"}</button></form>
        <p className={styles.hint}>{th ? "แสดงสูงสุด 50 รายการล่าสุด เวลาไทย (UTC+7)" : "Showing up to 50 recent records. Times are in Bangkok (UTC+7)."}</p>
        {!offline && subscriptions.length === 0 && <p>{th ? "ยังไม่พบรายการสิทธิ์" : "No subscriptions found."}</p>}
        {subscriptions.map((subscription) => <article className={styles.record} key={subscription.id}>
          <h3>{subscription.user.name || subscription.user.email}</h3><p>{subscription.user.email}</p>
          <span className={styles.badge}>{statusLabels[effectiveSubscriptionStatus(subscription)]}</span>
          <p>{th ? "ใช้สิทธิ์ได้ถึง: " : "Access through: "}{subscription.currentPeriodEnd ? formatEnd(subscription.currentPeriodEnd) : (th ? "ไม่กำหนดวันสิ้นสุด" : "No expiry")}</p>
          <p>{th ? "ผู้ให้สิทธิ์: " : "Provider: "}{subscription.provider || (th ? "ไม่ระบุ" : "Unspecified")}</p>
          {subscription.provider === MANUAL_SUBSCRIPTION_PROVIDER && subscription.status === "ACTIVE" && <details><summary>{th ? "ยกเลิกสิทธิ์ที่แอดมินเปิดให้" : "Revoke manual access"}</summary><p className={styles.hint}>{th ? "มีผลทันทีเมื่อยืนยัน รายการสิทธิ์จากผู้ให้บริการอื่นจะยังคงอยู่" : "Takes effect when confirmed. Other provider subscriptions remain valid."}</p><SubscriptionForm th={th} subscriptionId={subscription.id} disabled={!canEdit || offline} /></details>}
        </article>)}
      </section>
    </div>
  </div>;
}
