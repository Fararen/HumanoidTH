import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, sessionEmail } from "./auth-token";

export type AppRole = "USER" | "COMPANY" | "ADMIN" | "REVIEWER" | "LAB" | "ORGANIZER" | "JUDGE" | "MODERATOR";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const email = sessionEmail(cookieStore.get("user_session")?.value);

  const role = cookieStore.get("user_role")?.value;
  const demoRole = cookieStore.get("demo_account")?.value;
  if (!email && process.env.NODE_ENV !== "production" && demoRole === role && ["USER", "COMPANY", "ADMIN"].includes(demoRole || "")) {
    const demoEmail = cookieStore.get("user_email")?.value;
    // Legacy preview cookies cannot supply an account email to downstream database lookups.
    if (demoEmail) return { id: `demo:${demoEmail}`, email: "", name: "Read-only preview", role: "USER" as AppRole };
  }
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });
}

export async function setSessionUser(user: { email: string; role: string }) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production" && process.env.LOCAL_DEMO_MODE !== "1";
  store.set("user_session", createSessionToken(user.email), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 8 * 3600 });
  store.set("user_email", user.email, { path: "/", sameSite: "lax", secure });
  store.set("user_role", user.role, { path: "/", sameSite: "lax", secure });
  store.delete("demo_account");
  if (user.role === "ADMIN") store.set("admin_session", "true", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 8 * 3600 });
  else store.delete("admin_session");
}

export async function hasSessionRole(...roles: AppRole[]) {
  const user = await getSessionUser();
  return Boolean(user && roles.includes(user.role as AppRole));
}
