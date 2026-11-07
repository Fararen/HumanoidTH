import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AppRole = "USER" | "COMPANY" | "ADMIN";

export async function getSessionUser() {
  const email = (await cookies()).get("user_email")?.value;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true }
  });
}

export async function hasSessionRole(...roles: AppRole[]) {
  const user = await getSessionUser();
  return Boolean(user && roles.includes(user.role as AppRole));
}
