"use client";
import type { PlatformItem } from "@/lib/platform-catalog";
export default function RecordExport({ record }: { record: PlatformItem }) {
  function exportLog() {
    const url=URL.createObjectURL(new Blob([JSON.stringify({ exportedAt:new Date().toISOString(), record },null,2)],{type:"application/json"}));
    const anchor=document.createElement("a");anchor.href=url;anchor.download=`${record.kind.toLowerCase()}-${record.id}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <button type="button" onClick={exportLog}>ส่งออกรายงาน JSON · Export report</button>;
}
