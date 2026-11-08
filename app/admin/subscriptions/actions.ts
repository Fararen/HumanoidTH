"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { verifySubscriptionAdmin } from "@/lib/subscription-admin";
import { DASHBOARD_PLAN, MANUAL_SUBSCRIPTION_PROVIDER, subscriptionExpiry } from "@/lib/subscription-policy";

export type SubscriptionActionState = { code: "" | "saved" | "canceled" | "unauthorized" | "invalid" | "missing" | "unavailable" };

export async function manageSubscription(
  _previous: SubscriptionActionState,
  form: FormData
): Promise<SubscriptionActionState> {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== "ADMIN" || admin.id.startsWith("demo:") ||
      !verifySubscriptionAdmin(admin.email, String(form.get("password") ?? ""))) {
      return { code: "unauthorized" };
    }
    const operation = String(form.get("operation") ?? "");
    if (operation === "grant") {
      const email = String(form.get("email") ?? "").trim();
      const currentPeriodEnd = subscriptionExpiry(String(form.get("expiresOn") ?? ""));
      if (!email || email.length > 254 || !currentPeriodEnd) return { code: "invalid" };
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) return { code: "missing" };
      // One manual grant per account; retrying a request cannot create duplicate entitlements.
      await prisma.subscription.upsert({
        where: { provider_providerReference: { provider: MANUAL_SUBSCRIPTION_PROVIDER, providerReference: user.id } },
        create: { userId: user.id, plan: DASHBOARD_PLAN, status: "ACTIVE", currentPeriodEnd,
          provider: MANUAL_SUBSCRIPTION_PROVIDER, providerReference: user.id },
        update: { plan: DASHBOARD_PLAN, status: "ACTIVE", currentPeriodEnd }
      });
    } else if (operation === "cancel") {
      const id = String(form.get("subscriptionId") ?? "");
      if (!id) return { code: "invalid" };
      const result = await prisma.subscription.updateMany({
        where: { id, plan: DASHBOARD_PLAN, provider: MANUAL_SUBSCRIPTION_PROVIDER },
        data: { status: "CANCELED" }
      });
      if (result.count === 0) return { code: "missing" };
    } else {
      return { code: "invalid" };
    }
    for (const path of ["/admin/subscriptions", "/profile", "/subscribe", "/dashboard", "/analytics"]) {
      revalidatePath(path);
    }
    return { code: operation === "cancel" ? "canceled" : "saved" };
  } catch (error) {
    console.error("Subscription management failed:", error);
    return { code: "unavailable" };
  }
}
