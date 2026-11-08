"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

let pending: Promise<void> | null = null;
function startGuestSession() {
  if (!pending) pending = fetch("/api/guest-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    .then(response => { if (!response.ok) throw new Error("ไม่สามารถเริ่มใช้งานได้ กรุณาลองอีกครั้ง"); })
    .finally(() => { pending = null; });
  return pending;
}

export function GuestBootstrap({ hasSession, isGuest }: { hasSession: boolean; isGuest: boolean }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState(false);
  const enabled = ["/me", "/profile", "/submit-data", "/learn", "/community", "/challenges", "/competitions", "/simulator", "/evaluate"].some(path => pathname === path || pathname.startsWith(`${path}/`));
  useEffect(() => {
    if (hasSession || !enabled || started.current) return;
    started.current = true;
    startGuestSession().then(() => router.refresh()).catch(() => setError(true));
  }, [hasSession, enabled, router]);
  if (error) return <div role="alert" className="platform-notice">ไม่สามารถเริ่มพื้นที่ผู้เยี่ยมชมได้ กรุณาโหลดหน้าใหม่อีกครั้ง</div>;
  if (!isGuest || !enabled) return null;
  return <div className="platform-notice">ใช้งานในฐานะผู้เยี่ยมชม · ข้อมูลที่บันทึกอยู่ในระบบจริง และเชื่อมกับ browser นี้เป็นเวลา 30 วัน</div>;
}

export function GuestStart({ destination }: { destination: string }) {
  const [error, setError] = useState(false);
  const started = useRef(false);
  function start() {
    setError(false);
    startGuestSession().then(() => window.location.replace(destination)).catch(() => setError(true));
  }
  useEffect(() => { if (!started.current) { started.current = true; start(); } }, []);
  return <div className="platform-page"><h1>กำลังเตรียมพื้นที่ผู้เยี่ยมชม</h1><p>ข้อมูลที่บันทึกจะอยู่ในระบบจริง และเชื่อมกับ browser นี้</p>{error && <><p role="alert">ไม่สามารถเริ่มใช้งานได้ในขณะนี้ กรุณาลองอีกครั้ง</p><button onClick={start}>ลองอีกครั้ง</button></>}</div>;
}
