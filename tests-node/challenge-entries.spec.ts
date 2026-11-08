import { test, expect } from "@playwright/test";

const challengeId = "th-humanoid-nav-2026";
const endpoint = `/api/challenges/${challengeId}/submit`;

test("entry endpoints reject anonymous and demo writes and unknown competitions", async ({ request }) => {
  const anonymous = await request.post(endpoint, { data: {} });
  expect(anonymous.status()).toBe(401);
  expect((await anonymous.json()).code).toBe("SIGN_IN");
  expect((await request.get(endpoint)).status()).toBe(401);
  const demo = await request.post(endpoint, {
    headers: { cookie: "user_email=demo@example.test; user_role=USER; demo_account=USER" }, data: {}
  });
  expect(demo.status()).toBe(403);
  expect((await demo.json()).code).toBe("REAL_ACCOUNT_REQUIRED");
  const unknown = await request.post("/api/challenges/does-not-exist/submit", { data: {} });
  expect(unknown.status()).toBe(404);
});

test("a failed save preserves the form; retry shows only a server receipt and reload restores history", async ({ page, context }) => {
  // Control transport responses to test the browser failure path without a live database.
  await context.addCookies([{ name: "lang", value: "en", url: test.info().project.use.baseURL! }]);
  await page.addInitScript(() => {
    sessionStorage.setItem("th_atlas_loaded_before", "true");
    localStorage.setItem("humanoidth_submissions_th-humanoid-nav-2026", JSON.stringify([
      { id: "old-local-only", title: "Ghost local entry", totalScore: 999, rank: 1 }
    ]));
  });
  const receipt = { id: "entry-receipt-123", solutionTitle: "Navigation submission", teamName: "Test team", status: "SUBMITTED", submittedAt: "2026-11-08T12:00:00Z" };
  const payloads: Record<string, unknown>[] = [];
  let saved = false;
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { success: true, entries: saved ? [receipt] : [] } });
      return;
    }
    payloads.push(route.request().postDataJSON());
    if (payloads.length === 1) {
      await route.fulfill({ status: 503, json: { success: false, code: "UNAVAILABLE" } });
      return;
    }
    saved = true;
    await route.fulfill({ status: 201, json: { success: true, entry: receipt } });
  });
  await page.goto(`/challenges/${challengeId}`);
  await expect(page.getByText("You have not submitted to this competition yet.")).toBeVisible();
  await page.getByRole("button", { name: "Submit Prediction / Entry" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Submission Title", { exact: false }).fill(receipt.solutionTitle);
  await dialog.getByLabel("Team / Participant Name", { exact: false }).fill(receipt.teamName);
  await dialog.getByLabel("Technical Abstract", { exact: false }).fill("Reproducible navigation experiment");
  await dialog.getByLabel("Demo Video", { exact: false }).fill("https://youtu.be/navigation");
  await dialog.getByRole("button", { name: "Submit entry", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("unavailable");
  await expect(dialog.getByLabel("Submission Title", { exact: false })).toHaveValue(receipt.solutionTitle);
  await expect(page.getByRole("region", { name: "Your entries" })).not.toContainText(receipt.solutionTitle);
  await dialog.getByRole("button", { name: "Submit entry", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Your entries" })).toContainText("Received — awaiting review");
  expect(payloads).toHaveLength(2);
  expect(payloads[0].requestId).toBe(payloads[1].requestId);
  expect(payloads[1].videoUrl).toBe("https://youtu.be/navigation");
  expect(payloads[1]).not.toHaveProperty("contactEmail");
  expect(payloads[1]).not.toHaveProperty("dockerImage");
  await page.reload();
  await expect(page.getByRole("region", { name: "Your entries" })).toContainText(receipt.id);
  await page.getByRole("button", { name: /^Leaderboard \(/ }).click();
  await expect(page.getByRole("table")).not.toContainText(receipt.solutionTitle);
  await expect(page.getByText("Ghost local entry")).toHaveCount(0);
});

test("closed competition blocks both entry buttons on mobile", async ({ page, context }) => {
  await context.addCookies([{ name: "lang", value: "en", url: test.info().project.use.baseURL! }]);
  await page.addInitScript(() => sessionStorage.setItem("th_atlas_loaded_before", "true"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/challenges/mini-walking-gait-sim");
  await expect(page.getByText("Competition Closed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Prediction / Entry" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Leaderboard \(/ }).click();
  await expect(page.getByRole("button", { name: "+ Submit Prediction", exact: true })).toBeDisabled();
});
