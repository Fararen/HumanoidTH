"use client";

import { useActionState } from "react";
import { manageSubscription, type SubscriptionActionState } from "./actions";
import styles from "./Subscriptions.module.css";

export default function SubscriptionForm({ th, subscriptionId, disabled = false }: {
  th: boolean; subscriptionId?: string; disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<SubscriptionActionState, FormData>(manageSubscription, { code: "" });
  const cancel = Boolean(subscriptionId);
  const messages = th ? {
    saved: "บันทึกสิทธิ์ Atlas Plus แล้ว", canceled: "ยกเลิกสิทธิ์ที่แอดมินเปิดให้แล้ว",
    unauthorized: "ต้องใช้บัญชีแอดมินจริงและรหัสผ่านที่ตั้งไว้ในระบบ",
    invalid: "กรอกอีเมลและวันสิ้นสุดสิทธิ์ที่ยังไม่ผ่านไปให้ถูกต้อง", missing: "ไม่พบบัญชีหรือรายการสิทธิ์ กรุณาให้ผู้ใช้สมัครบัญชีก่อน",
    unavailable: "บันทึกไม่ได้ในขณะนี้ กรุณาลองใหม่", "": ""
  } : {
    saved: "Atlas Plus access saved.", canceled: "Manual access canceled.",
    unauthorized: "Use a real administrator account and the configured administrator password.",
    invalid: "Enter an email and a valid access end date that has not passed.", missing: "Account or subscription not found. The user must register first.",
    unavailable: "Could not save this change. Please try again.", "": ""
  };
  const success = state.code === "saved" || state.code === "canceled";

  return <form action={action} className={styles.form}>
    <input type="hidden" name="operation" value={cancel ? "cancel" : "grant"} />
    {cancel ? <input type="hidden" name="subscriptionId" value={subscriptionId} /> : <>
      <label>{th ? "อีเมลบัญชีสมาชิก" : "Member account email"}<input type="email" name="email" required maxLength={254} autoComplete="off" disabled={disabled || pending} /></label>
      <label>{th ? "ใช้สิทธิ์ได้ถึงวันที่ (เวลาไทย)" : "Access through date (Bangkok time)"}<input type="date" name="expiresOn" required disabled={disabled || pending} /></label>
      <p className={styles.hint}>{th ? "เปิดสิทธิ์ใหม่หรือตั้งวันสิ้นสุดใหม่ให้บัญชีที่มีอยู่ โดยใช้ได้จนสิ้นสุดวันที่เลือก" : "Grant access or replace the end date for an existing account. Access lasts through the selected day."}</p>
    </>}
    <label>{th ? "รหัสผ่านผู้ดูแลระบบ" : "Administrator password"}<input type="password" name="password" required autoComplete="current-password" disabled={disabled || pending} /></label>
    <button className={cancel ? styles.cancel : styles.submit} type="submit" disabled={disabled || pending}>
      {pending ? (th ? "กำลังบันทึก…" : "Saving…") : cancel ? (th ? "ยกเลิกสิทธิ์ทันที" : "Cancel access now") : (th ? "บันทึกสิทธิ์ Atlas Plus" : "Save Atlas Plus access")}
    </button>
    {state.code && <p className={success ? styles.success : styles.error} role={success ? "status" : "alert"}>{messages[state.code]}</p>}
  </form>;
}
