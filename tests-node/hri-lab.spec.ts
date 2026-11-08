import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { validateHriRun } from "../lib/hri-simulation";

async function transport(page: Page, failFirst = false) {
  const payloads: Record<string, unknown>[] = [];
  await page.route("**/api/hri-runs", async route => {
    const body = route.request().postDataJSON();
    payloads.push(body);
    if (failFirst && payloads.length === 1) { await route.fulfill({ status: 503, json: { success: false } }); return; }
    const validation = validateHriRun(body);
    expect(validation.ok).toBe(true);
    if (!validation.ok) throw new Error(validation.error);
    const { events, ...fields } = validation.data;
    const run = { ...fields, id: body.runCode, eventsJson: events, createdAt: new Date().toISOString() };
    await page.evaluate(saved => {
      const history = JSON.parse(sessionStorage.getItem("hri-test-history") || "[]");
      sessionStorage.setItem("hri-test-history", JSON.stringify([{ ...saved, events: saved.eventsJson }, ...history.filter((item: { runCode: string }) => item.runCode !== saved.runCode)]));
    }, run);
    await route.fulfill({ json: { success: true, run } });
  });
  return payloads;
}
const navigate = (page: Page) => page.getByRole("button", { name: /ให้หุ่นช่วยนำทางไปห้องกิจกรรม/ });
const staff = (page: Page) => page.getByRole("button", { name: /ขอเจ้าหน้าที่มารับช่วงต่อ/ });
const cancel = (page: Page) => page.getByRole("button", { name: /ยกเลิกคำขอและให้หุ่นหยุดทำงาน/ });
const reset = (page: Page) => page.getByRole("button", { name: "เริ่มรอบการทดลองใหม่" });
const saved = (page: Page) => expect(page.getByRole("status", { name: "สถานะการบันทึก" })).toHaveText("บันทึก Run Log ในฐานข้อมูลแล้ว");

test("all four cases produce measured logs; completed runs are immutable and replayable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const payloads = await transport(page);
  await page.goto("/");
  await page.getByRole("tab", { name: /ตารางทวนสอบ/ }).click();
  await expect(page.getByRole("cell", { name: "ยังไม่ได้ทดสอบ (Not run)" })).toHaveCount(4);
  await navigate(page).click();
  await saved(page);
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("ARRIVED_AT_DESTINATION");
  await expect(staff(page)).toBeDisabled();
  await expect(cancel(page)).toBeDisabled();
  await expect(navigate(page)).toBeDisabled();
  await reset(page).click();
  await staff(page).focus();
  await page.keyboard.press("Enter");
  await saved(page);
  await reset(page).click();
  await navigate(page).click();
  await cancel(page).click();
  await saved(page);
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("CANCELLED_BY_USER");
  await reset(page).click();
  await page.getByRole("button", { name: /จำลองกรณีโหลดไม่สำเร็จ/ }).click();
  await saved(page);
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("RECOVERY_READY");
  await expect(page.getByRole("cell", { name: "ยังไม่ได้ทดสอบ (Not run)" })).toHaveCount(0);
  expect(new Set(payloads.map(item => item.runCode)).size).toBe(4);
  expect(payloads).toHaveLength(4);
  await mkdir("docs/evidence/m01", { recursive: true });
  await page.screenshot({ path: "docs/evidence/m01/verification-test-fixture.png", fullPage: true });
  await page.getByRole("tab", { name: /บันทึกเหตุการณ์และผลลัพธ์/ }).click();
  await page.getByRole("button", { name: /ARRIVED_AT_DESTINATION/ }).click();
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("ARRIVED_AT_DESTINATION");
  await expect(page.getByRole("cell", { name: "FAULT_INJECTION_LOAD_ERROR", exact: true })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ส่งออก JSON" }).click();
  const exported = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(exported.simulationResult.durationSec).toBe(exported.events.at(-1).timeSec);
  expect(exported.simulationResult.errorReason).toBeNull();
  expect(exported.persistence).toBe("SAVED");
  await page.reload();
  await cancel(page).click();
  await saved(page);
  await expect(page.getByRole("button", { name: /ARRIVED_AT_DESTINATION/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("failed save preserves the log, supports export, and retries with the same run ID", async ({ page }) => {
  const payloads = await transport(page, true);
  await page.goto("/");
  await staff(page).click();
  await expect(page.getByRole("alert")).toContainText("บันทึกฐานข้อมูลไม่สำเร็จ");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ส่งออก JSON" }).click();
  const exported = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(exported.persistence).toBe("LOCAL_ONLY");
  expect(exported.simulationResult.testCasePassed).toBe(true);
  expect(exported.simulationResult.navigationSucceeded).toBe(false);
  await page.getByRole("button", { name: "ลองบันทึกอีกครั้ง" }).click();
  await saved(page);
  expect(payloads).toHaveLength(2);
  expect(payloads[0]).toEqual(payloads[1]);
  await expect(page.getByRole("button", { name: /HANDED_OFF_TO_STAFF/ })).toHaveCount(1);
});

test("missing model has an exportable failure log and retries the same model", async ({ page }) => {
  await transport(page);
  await page.goto("/?missing=1");
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("ไม่พบรหัสรุ่น");
  await saved(page);
  await expect(navigate(page)).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ส่งออก JSON" }).click();
  const exported = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(exported.atlasProvenance.dataClassification).toBe("UNAVAILABLE");
  expect(exported.simulationResult.terminalStatus).toBe("RECOVERY_READY");
  await page.getByRole("button", { name: "ลองโหลดใหม่ (Retry)" }).click();
  await expect(page).toHaveURL(/missing=1/);
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("ไม่พบรหัสรุ่น");
});

test("history failure leaves the simulation usable on a narrow screen", async ({ page }) => {
  await transport(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?historyError=1");
  await expect(page.getByRole("alert")).toContainText("โหลดประวัติ Run Log ไม่สำเร็จ");
  await staff(page).focus();
  await page.keyboard.press("Space");
  await saved(page);
  await expect(page.getByRole("status", { name: "สถานะการจำลอง" })).toContainText("HANDED_OFF_TO_STAFF");
  const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  await mkdir("docs/evidence/m01", { recursive: true });
  await page.screenshot({ path: "docs/evidence/m01/mobile-test-fixture.png", fullPage: true });
});
