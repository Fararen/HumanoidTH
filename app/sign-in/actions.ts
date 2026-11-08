"use server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-token";
import { setSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export async function signIn(form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) redirect("/sign-in?error=invalid");
  await setSessionUser(user);
  const destination = String(form.get("from") || "/me");
  redirect(destination.startsWith("/") && !destination.startsWith("//") ? destination : "/me");
}
