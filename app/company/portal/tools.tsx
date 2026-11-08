"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function CompanyTools({ id, reviewers, canEdit, reviewerId }: { id: string; reviewers: { id: string; name: string | null }[]; canEdit: boolean; reviewerId: string | null }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function act(event: React.FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(`/api/company-models/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, action }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Save failed");
      if (action === "NEW_VERSION") router.push(`/company/models/${result.model.id}`);
      else router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return <><p>Reviewer: {reviewers.find(item => item.id === reviewerId)?.name || reviewerId || "Awaiting assignment"}</p>
    {reviewers.length > 0 && <form className="platform-form" onSubmit={event => act(event, "ASSIGN_REVIEWER")}><label>มอบหมายผู้ตรวจ · Assign reviewer<select name="reviewerId" defaultValue={reviewerId || ""} required><option value="">Choose reviewer</option>{reviewers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button disabled={busy}>Assign</button></form>}
    {canEdit && <form className="platform-form" onSubmit={event => act(event, "NEW_VERSION")}><label>เวอร์ชันใหม่ · New version<input name="version" required maxLength={60} placeholder="v2.0.0" /></label><button disabled={busy}>สร้างเวอร์ชันใหม่ · Create version</button></form>}
    {canEdit && <form className="platform-form" onSubmit={event => act(event, "LINK_REPORT")}><label>รายงาน Physical ที่รับรองของรุ่นนี้ · Certified report ID<input name="physicalReportId" required /></label><p>Linking a pilot report moves the draft into the matching pilot protocol group.</p><button disabled={busy}>เชื่อมรายงาน · Link report</button></form>}
    {canEdit && <form className="platform-form" onSubmit={event => act(event, "SAVE_DOCUMENTS")}><label>เอกสารของเวอร์ชันนี้ · Private document URLs (one per line)<textarea name="documents" rows={3} maxLength={10000} /></label><button disabled={busy}>บันทึกเอกสาร · Save documents</button></form>}
    {error && <p role="alert">{error}</p>}</>;
}
