import assert from "node:assert/strict";
import { test } from "node:test";
import { DASHBOARD_PLAN, effectiveSubscriptionStatus, grantsDashboardAccess, subscriptionExpiry } from "../lib/subscription-policy";
import { verifySubscriptionAdmin } from "../lib/subscription-admin";

const now = new Date("2026-11-08T12:00:00Z");

test("dashboard access requires the correct active plan and an unexpired term", () => {
  const subscription = { plan: DASHBOARD_PLAN, status: "ACTIVE", currentPeriodEnd: new Date("2026-11-09T00:00:00Z") };
  assert.equal(grantsDashboardAccess(subscription, now), true);
  assert.equal(grantsDashboardAccess({ ...subscription, currentPeriodEnd: null }, now), true);
  for (const status of ["CANCELED", "PAST_DUE", "EXPIRED"]) {
    assert.equal(grantsDashboardAccess({ ...subscription, status }, now), false);
  }
  assert.equal(grantsDashboardAccess({ ...subscription, plan: "UNRELATED_PLAN" }, now), false);
  assert.equal(grantsDashboardAccess({ ...subscription, currentPeriodEnd: now }, now), false);
  assert.equal(grantsDashboardAccess({ ...subscription, currentPeriodEnd: new Date(now.getTime() - 1) }, now), false);
});

test("expired active rows display as expired without a scheduled database update", () => {
  const subscription = { plan: DASHBOARD_PLAN, status: "ACTIVE", currentPeriodEnd: now };
  assert.equal(effectiveSubscriptionStatus(subscription, now), "EXPIRED");
  assert.equal(effectiveSubscriptionStatus({ ...subscription, status: "CANCELED" }, now), "CANCELED");
  assert.equal(effectiveSubscriptionStatus({ ...subscription, currentPeriodEnd: null }, now), "ACTIVE");
});

test("access includes the selected Bangkok calendar day, then ends exactly at midnight", () => {
  const expiry = subscriptionExpiry("2026-11-08", now);
  assert.equal(expiry?.toISOString(), "2026-11-08T17:00:00.000Z");
  const subscription = { plan: DASHBOARD_PLAN, status: "ACTIVE", currentPeriodEnd: expiry };
  assert.equal(grantsDashboardAccess(subscription, new Date("2026-11-08T16:59:59.999Z")), true);
  assert.equal(grantsDashboardAccess(subscription, new Date("2026-11-08T17:00:00Z")), false);
  assert.equal(subscriptionExpiry("2026-11-08", new Date("2026-11-08T17:00:00Z")), null);
  assert.equal(subscriptionExpiry("2028-02-29", now)?.toISOString(), "2028-02-29T17:00:00.000Z");
});

test("invalid dates and elapsed access terms cannot become unlimited grants", () => {
  for (const input of ["", "2026-02-29", "2026-02-30", "2026-13-01", "2026-11-07", "2026-1-2", "tomorrow", "2026-11-09T12:00:00Z"]) {
    assert.equal(subscriptionExpiry(input, now), null, input);
  }
});

test("subscription changes require explicit configured credentials", () => {
  const previousEmail = process.env.ADMIN_BASIC_USER;
  const previousPassword = process.env.ADMIN_BASIC_PASSWORD;
  try {
    delete process.env.ADMIN_BASIC_USER;
    delete process.env.ADMIN_BASIC_PASSWORD;
    assert.equal(verifySubscriptionAdmin("admin@example.test", "test-password"), false);
    process.env.ADMIN_BASIC_USER = "admin@example.test";
    process.env.ADMIN_BASIC_PASSWORD = "test-password";
    assert.equal(verifySubscriptionAdmin("admin@example.test", "test-password"), true);
    assert.equal(verifySubscriptionAdmin("other@example.test", "test-password"), false);
    assert.equal(verifySubscriptionAdmin("admin@example.test", "wrong"), false);
    assert.equal(verifySubscriptionAdmin("admin@example.test", ""), false);
  } finally {
    if (previousEmail === undefined) delete process.env.ADMIN_BASIC_USER;
    else process.env.ADMIN_BASIC_USER = previousEmail;
    if (previousPassword === undefined) delete process.env.ADMIN_BASIC_PASSWORD;
    else process.env.ADMIN_BASIC_PASSWORD = previousPassword;
  }
});
