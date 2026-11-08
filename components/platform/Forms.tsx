"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { detailPath, type Field, type PlatformItem, type PlatformKind } from "@/lib/platform-catalog";

function inputValue(value: unknown): string | number {
  if (Array.isArray(value)) return value.join("\n");
  return typeof value === "string" || typeof value === "number" ? value : "";
}
function Fields({ fields, values = {} }: { fields: Field[]; values?: Record<string, unknown> }) {
  return <>{fields.map(field => { const Wrapper=field.key === "rounds" ? "div" : "label"; return <Wrapper key={field.key}>{field.label}
    {field.key === "rounds" ? <div className="platform-rounds">{Array.from({ length: 5 }, (_, index) => <fieldset key={index}><legend>รอบ · Round {index + 1}</legend>
      <label>Precision (mm)<input type="number" step="any" min="0" max="10000" name={`precisionMm${index}`} required /></label>
      <label>Speed (seconds)<input type="number" step="any" min="0.001" max="86400" name={`speedSec${index}`} required /></label>
      <label>Evidence URL<input type="url" name={`evidenceUrl${index}`} required /></label>
      <label><input type="checkbox" name={`safetyPassed${index}`} /> Protective stop passed</label>
    </fieldset>)}</div> : field.type === "textarea" ? <textarea aria-label={field.label} name={field.key} required={field.required} rows={4} maxLength={20000} defaultValue={inputValue(values[field.key] ?? field.value)} /> : field.type === "select" ?
      <select aria-label={field.label} name={field.key} required={field.required} defaultValue={String(values[field.key] ?? field.value ?? field.options?.[0] ?? "")}>{field.options?.map(option => <option key={option} value={option}>{field.optionLabels?.[option] || option}</option>)}</select> : field.type === "checkbox" ?
        <input aria-label={field.label} name={field.key} type="checkbox" defaultChecked={Boolean(values[field.key] ?? field.value)} /> :
        <input aria-label={field.label} name={field.key} type={field.type || "text"} step={field.type === "number" ? "any" : undefined} maxLength={4000} required={field.required} defaultValue={inputValue(values[field.key] ?? field.value)} />}
  </Wrapper>; })}</>;
}
function dataFromForm(form: HTMLFormElement, fields: Field[]) {
  const values = new FormData(form);
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.key === "rounds") data.rounds = Array.from({ length: 5 }, (_, index) => ({ precisionMm: Number(values.get(`precisionMm${index}`)), speedSec: Number(values.get(`speedSec${index}`)), evidenceUrl: String(values.get(`evidenceUrl${index}`)), safetyPassed: values.has(`safetyPassed${index}`) }));
    else data[field.key] = field.type === "checkbox" ? values.has(field.key) : field.type === "number" ? values.get(field.key) === "" ? "" : Number(values.get(field.key)) : String(values.get(field.key) || "");
  }
  return data;
}
export function CreateForm({ kind, fields, title = "", parentId, defaults = {}, label = "บันทึก · Save", redirect = true }: { kind: PlatformKind; fields: Field[]; title?: string; parentId?: string; defaults?: Record<string, unknown>; label?: string; redirect?: boolean }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const requestId = useRef<string | null>(null); const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    requestId.current ||= crypto.randomUUID();
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/platform/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: requestId.current, title: String(new FormData(form).get("title") || title), parentId, data: { ...defaults, ...dataFromForm(form, fields) } }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not save");
      setDone(true);
      if (redirect) router.push(detailPath(result.record)); else router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Connection failed; retry with the same form"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="platform-form">
    {kind !== "PROGRESS" && <label>ชื่อรายการ · Title<input name="title" required maxLength={200} defaultValue={title} /></label>}
    <Fields fields={fields} values={defaults} />{error && <p role="alert">{error}</p>}{done && <p role="status">บันทึกแล้ว · Saved</p>}
    <button disabled={busy || done}>{busy ? "กำลังบันทึก…" : label}</button>
  </form>;
}
export function ActionForm({ record, action, label, fields = [] }: { record: PlatformItem; action: string; label: string; fields?: Field[] }) {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/platform/${record.kind}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, revision: record.revision, action, data: dataFromForm(event.currentTarget, fields) }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Save failed");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Save failed; retry"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="platform-form"><h3>{label}</h3><Fields fields={fields} values={record.data} />{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? "กำลังบันทึก…" : label}</button></form>;
}
