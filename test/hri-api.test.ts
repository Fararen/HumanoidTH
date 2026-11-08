import { test } from "node:test";
import type { TestContext } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startHriRun, actOnHriRun } from "../lib/hri-simulation";

// Delegate mocks exercise the real route without connecting to or writing a database.
process.env.DATABASE_URL ||= "postgresql://test:test@127.0.0.1:1/hri_test";
const { prisma } = await import("../lib/prisma");
const { POST, GET } = await import("../app/api/hri-runs/route");
const payload = () => actOnHriRun(startHriRun({ runCode: `M01-RUN-${randomUUID()}`, robotId: "registry-id", robotName: "Client-supplied name", tick: 0, startedAt: "2026-11-08T00:00:00Z" }), "staff", 2000);
const post = (body: unknown) => POST(new Request("http://localhost/api/hri-runs", { method: "POST", body: JSON.stringify(body) }));
function stub(context: TestContext, target: object, method: string, implementation: unknown) {
  const delegate = target as Record<string, unknown>;
  const original = delegate[method];
  delegate[method] = implementation;
  context.after(() => { delegate[method] = original; });
}

test("HRI API validates input, derives metrics, verifies Atlas identity and protects retries", async context => {
  let lookups = 0;
  let exists = true;
  stub(context, prisma.robotModel, "findUnique", async () => { lookups++; return exists ? { canonicalName: "Atlas name" } : null; });
  const stored = new Map<string, object>();
  stub(context, prisma.hriSimulationRun, "upsert", async ({ create }: { create: { runCode: string } }) => {
    if (!stored.has(create.runCode)) stored.set(create.runCode, { ...create, id: "receipt-1", createdAt: new Date() });
    return stored.get(create.runCode);
  });
  assert.equal((await post({})).status, 400);
  assert.equal((await POST(new Request("http://localhost/api/hri-runs", { method: "POST", body: "{" }))).status, 400);
  assert.equal((await POST(new Request("http://localhost/api/hri-runs", { method: "POST", body: "x".repeat(256001) }))).status, 413);
  assert.equal(lookups, 0);
  const input = payload();
  const result = await (await post({ ...input, navigationSucceeded: true, durationSec: 999 })).json();
  assert.equal(result.run.robotName, "Atlas name");
  assert.equal(result.run.durationSec, 2);
  assert.equal(result.run.navigationSucceeded, false);
  assert.equal((await post(input)).status, 200);
  assert.equal(stored.size, 1);
  const conflicting = { ...payload(), runCode: input.runCode, robotId: "other-model" };
  assert.equal((await post(conflicting)).status, 409);
  exists = false;
  assert.equal((await post(payload())).status, 404);
  const missing = startHriRun({ runCode: `M01-RUN-${randomUUID()}`, robotId: "missing", robotName: "missing", tick: 0, startedAt: "2026-11-08T00:00:00Z", errorReason: "Model not found" });
  assert.equal((await post(missing)).status, 200);
});

test("GET scopes history to a model with a bounded result set", async context => {
  stub(context, prisma.hriSimulationRun, "findMany", async (query: unknown) => {
    assert.deepEqual(query, { where: { robotId: "registry-id" }, orderBy: { createdAt: "desc" }, take: 50 });
    return [];
  });
  assert.equal((await GET(new Request("http://localhost/api/hri-runs?robotId=registry-id"))).status, 200);
});

test("database outages return an explicit failure instead of a successful receipt", async context => {
  stub(context, prisma.robotModel, "findUnique", async () => { throw new Error("Test database unavailable"); });
  stub(context, prisma.hriSimulationRun, "findMany", async () => { throw new Error("Test database unavailable"); });
  context.mock.method(console, "error", () => {});
  const response = await post(payload());
  assert.equal(response.status, 500);
  assert.equal((await response.json()).success, false);
  assert.equal((await GET(new Request("http://localhost/api/hri-runs"))).status, 500);
});
