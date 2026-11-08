import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { getDashboardSubscription } from "@/lib/subscription";
import styles from "./Profile.module.css";

export default async function SubscriptionStatus({ th }: { th: boolean }) {
  const subscription = await getDashboardSubscription();
  const labels: Record<string, string> = th ? {
    ACTIVE: "Atlas Plus — ใช้งานอยู่", NONE: "สมาชิกฟรี", CANCELED: "ยกเลิกสมาชิกแล้ว", EXPIRED: "สมาชิกหมดอายุแล้ว",
    PAST_DUE: "ค้างชำระ", ADMIN: "สิทธิ์ผู้ดูแลระบบ", DEMO: "Atlas Plus — บัญชีทดลอง", UNAVAILABLE: "ตรวจสอบสิทธิ์ไม่ได้ในขณะนี้ กรุณาลองใหม่"
  } : {
    ACTIVE: "Atlas Plus — Active", NONE: "Free member", CANCELED: "Subscription canceled", EXPIRED: "Subscription expired",
    PAST_DUE: "Past due", ADMIN: "Administrator access", DEMO: "Atlas Plus — Demo account", UNAVAILABLE: "Access status is unavailable. Please try again."
  };
  const end = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd.getTime() - 1).toLocaleString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
  return <section className={styles.companyWorkspace} aria-label={th ? "สถานะสมาชิก" : "Membership status"}>
    <span className={styles.companyWorkspaceIcon}><BarChart3 size={20} aria-hidden="true" /></span>
    <div><span className={styles.kicker}>{th ? "สมาชิก ATLAS" : "ATLAS MEMBERSHIP"}</span><h2>{labels[subscription.status]}</h2>
      {end && <p>{th ? "วันสิ้นสุดสิทธิ์: " : "Access end: "}{end} (UTC+7)</p>}
    </div>
    {subscription.status !== "UNAVAILABLE" && <Link className={styles.secondaryButton} href={subscription.hasAccess ? "/dashboard" : "/subscribe"}>{subscription.hasAccess ? "Dashboard" : th ? "ดูแผนสมาชิก" : "View plans"}<ArrowRight size={14} aria-hidden="true" /></Link>}
    {subscription.status === "ADMIN" && <Link className={styles.secondaryButton} href="/admin/subscriptions">{th ? "จัดการสมาชิก" : "Manage members"}</Link>}
  </section>;
}
