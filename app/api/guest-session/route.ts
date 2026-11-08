import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { getSessionUser, setSessionUser } from "@/lib/session";
import { isSameOrigin } from "@/lib/guest-origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  try {
    if (await getSessionUser()) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    const email = `guest-${randomUUID()}@guest.humanoidth.local`;
    // Check signing configuration before creating a database record.
    createSessionToken(email);
    const user = await prisma.user.create({ data: { email, name: "ผู้เยี่ยมชม · Guest", role: "USER" } });
    await setSessionUser(user, { maxAgeSeconds: 30 * 24 * 3600 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถเริ่มใช้งานได้ในขณะนี้ กรุณาลองอีกครั้ง" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
