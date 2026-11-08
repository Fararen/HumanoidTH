import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { DASHBOARD_PLAN, effectiveSubscriptionStatus, grantsDashboardAccess } from "@/lib/subscription-policy";

export type DashboardSubscription = {
  hasAccess: boolean;
  status: string;
  currentPeriodEnd: Date | null;
};

export async function getDashboardSubscription(): Promise<DashboardSubscription> {
  try {
    const user = await getSessionUser();
    if (!user) return { hasAccess: false, status: "NONE", currentPeriodEnd: null };
    if (user.role === "ADMIN") return { hasAccess: true, status: "ADMIN", currentPeriodEnd: null };
    if (user.id.startsWith("demo:")) {
      const active = (await cookies()).get("demo_subscription")?.value === "ACTIVE";
      return { hasAccess: active, status: active ? "DEMO" : "NONE", currentPeriodEnd: null };
    }
    const now = new Date();
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        plan: DASHBOARD_PLAN,
        status: "ACTIVE",
        OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }]
      },
      orderBy: { updatedAt: "desc" }
    });
    if (subscription) return { hasAccess: grantsDashboardAccess(subscription, now), status: "ACTIVE", currentPeriodEnd: subscription.currentPeriodEnd };
    const latest = await prisma.subscription.findFirst({
      where: { userId: user.id, plan: DASHBOARD_PLAN },
      orderBy: { updatedAt: "desc" }
    });
    return {
      hasAccess: false,
      status: latest ? effectiveSubscriptionStatus(latest, now) : "NONE",
      currentPeriodEnd: latest?.currentPeriodEnd ?? null
    };
  } catch (error) {
    console.error("Failed to check dashboard subscription:", error);
    return { hasAccess: false, status: "UNAVAILABLE", currentPeriodEnd: null };
  }
}

export async function hasDashboardSubscription() {
  return (await getDashboardSubscription()).hasAccess;
}
