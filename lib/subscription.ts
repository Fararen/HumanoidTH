import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function hasDashboardSubscription() {
  const cookieStore = await cookies();
  const email = cookieStore.get("user_email")?.value;
  const role = cookieStore.get("user_role")?.value;
  const demoRole = cookieStore.get("demo_account")?.value;

  if (!email) return false;
  if (
    process.env.NODE_ENV !== "production" &&
    demoRole === role &&
    ["USER", "COMPANY", "ADMIN"].includes(demoRole || "")
  ) {
    return demoRole === "ADMIN" || cookieStore.get("demo_subscription")?.value === "ACTIVE";
  }

  try {
    const user = await getSessionUser();
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }]
      },
      select: { id: true }
    });
    return Boolean(subscription);
  } catch (error) {
    console.error("Failed to check dashboard subscription:", error);
    return false;
  }
}
