"use client";

import Link from "next/link";
import type { ChallengeEntryReceipt } from "../types";

export function entryMessage(code: string, th: boolean) {
  const messages: Record<string, [string, string]> = {
    LOADING: ["กำลังโหลดประวัติผลงาน…", "Loading your entries…"],
    SIGN_IN: ["เข้าสู่ระบบด้วยบัญชีของคุณเพื่อส่งและติดตามผลงาน", "Sign in with your account to submit and track entries."],
    REAL_ACCOUNT_REQUIRED: ["บัญชีทดลองส่งผลงานจริงไม่ได้ กรุณาใช้บัญชีที่สมัครไว้", "Demo accounts cannot submit entries. Use a registered account."],
    UNAVAILABLE: ["เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่ ข้อมูลในฟอร์มยังคงอยู่", "The service is unavailable. Please retry; your form has been preserved."],
    INVALID: ["ตรวจชื่อทีม ชื่อผลงาน คำอธิบาย และลิงก์ HTTP/HTTPS ให้ถูกต้อง", "Check the team, title, description, and HTTP/HTTPS links."],
    CLOSED: ["การแข่งขันนี้ปิดรับผลงานแล้ว", "This competition is not accepting entries."],
    NOT_FOUND: ["ไม่พบการแข่งขันนี้", "Competition not found."],
    REQUEST_CONFLICT: ["คำขอนี้ถูกใช้กับข้อมูลอื่นแล้ว กรุณาโหลดหน้าใหม่และตรวจประวัติก่อนส่งอีกครั้ง", "This request was already used for different content. Reload and check your history before submitting again."]
  };
  return messages[code]?.[th ? 0 : 1] ?? messages.UNAVAILABLE[th ? 0 : 1];
}

export default function EntryHistory({ entries, code, th, onRetry }: {
  entries: ChallengeEntryReceipt[]; code: string; th: boolean; onRetry: () => void;
}) {
  const statuses: Record<string, string> = th
    ? { SUBMITTED: "รับผลงานแล้ว — รอตรวจ", UNDER_REVIEW: "กำลังตรวจสอบ", APPROVED: "อนุมัติแล้ว", REJECTED: "ไม่ผ่านการตรวจสอบ" }
    : { SUBMITTED: "Received — awaiting review", UNDER_REVIEW: "Under review", APPROVED: "Approved", REJECTED: "Rejected" };
  return <section className="panel" aria-labelledby="my-challenge-entries" style={{ margin: 0 }}>
    <h2 id="my-challenge-entries" style={{ fontSize: 18 }}>{th ? "ผลงานที่คุณส่ง" : "Your entries"}</h2>
    {code !== "READY" ? <p role="status">{entryMessage(code, th)} {code === "SIGN_IN" || code === "REAL_ACCOUNT_REQUIRED"
      ? <Link href="/profile">{th ? "ไปที่โปรไฟล์" : "Open profile"}</Link>
      : code !== "LOADING" && <button type="button" className="button" onClick={onRetry}>{th ? "ลองใหม่" : "Retry"}</button>}</p>
      : <>
        <p className="muted">{th ? "สูงสุด 50 รายการล่าสุด คะแนนและอันดับจะมีได้หลังการประเมินเท่านั้น" : "Up to 50 recent entries. Scores and ranks require evaluation."}</p>
        {entries.length === 0 && <p>{th ? "ยังไม่มีผลงานที่ส่งในการแข่งขันนี้" : "You have not submitted to this competition yet."}</p>}
        {entries.map(entry => <article key={entry.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0", overflowWrap: "anywhere" }}>
          <strong>{entry.solutionTitle}</strong><p>{entry.teamName} · {statuses[entry.status] || entry.status}</p>
          <small>{th ? "เลขรับผลงาน: " : "Receipt: "}{entry.id} · <time dateTime={entry.submittedAt}>{new Date(entry.submittedAt).toLocaleString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok" })} (UTC+7)</time></small>
        </article>)}
      </>}
  </section>;
}
