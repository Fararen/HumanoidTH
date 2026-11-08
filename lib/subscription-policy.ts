export const DASHBOARD_PLAN = "ATLAS_DASHBOARD";
export const MANUAL_SUBSCRIPTION_PROVIDER = "MANUAL";

export type SubscriptionRecord = {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
};

export function grantsDashboardAccess(subscription: SubscriptionRecord, now = new Date()) {
  return subscription.plan === DASHBOARD_PLAN && subscription.status === "ACTIVE" &&
    (subscription.currentPeriodEnd === null || subscription.currentPeriodEnd > now);
}

export function effectiveSubscriptionStatus(subscription: SubscriptionRecord, now = new Date()) {
  return subscription.status === "ACTIVE" && subscription.currentPeriodEnd !== null && subscription.currentPeriodEnd <= now
    ? "EXPIRED" : subscription.status;
}

// Dates are inclusive in Asia/Bangkok; the next midnight is the exclusive access boundary.
export function subscriptionExpiry(date: string, now = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const midnightUtc = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(midnightUtc.getTime()) || midnightUtc.toISOString().slice(0, 10) !== date) return null;
  const expiry = new Date(midnightUtc.getTime() + 17 * 60 * 60 * 1000);
  return expiry > now ? expiry : null;
}
