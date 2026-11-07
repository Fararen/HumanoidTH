import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AppRole = "USER" | "COMPANY" | "ADMIN";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const email = cookieStore.get("user_email")?.value;
  if (!email) return null;

  const role = cookieStore.get("user_role")?.value;
  const demoRole = cookieStore.get("demo_account")?.value;
  if (process.env.NODE_ENV !== "production" && demoRole === role && ["USER", "COMPANY", "ADMIN"].includes(demoRole || "")) {
    return { id: `demo:${email}`, email, name: email.split("@")[0], role: demoRole as AppRole };
  }

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });
}

export async function hasSessionRole(...roles: AppRole[]) {
  const user = await getSessionUser();
  return Boolean(user && roles.includes(user.role as AppRole));
}
