import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { startHriRun, actOnHriRun, advanceHriRun, hriOutcome, validateHriRun, hriCsvCell } from "../lib/hri-simulation";

const start = (errorReason?: string) => startHriRun({
  runCode: `M01-RUN-${randomUUID()}`, robotId: "test-model", robotName: "Test model",
  tick: 1000, startedAt: "2026-11-08T00:00:00.000Z", errorReason
});

test("navigation measures decision time and records checkpoints when observed", () => {
  const greeting = start();
  const guiding = actOnHriRun(greeting, "navigate", 3500);
  const checkpoint = advanceHriRun(guiding, 5600);
  assert.equal(checkpoint.events.at(-1)?.action, "PASS_CORRIDOR_CHECKPOINT");
  assert.equal(checkpoint.events.at(-1)?.timeSec, 4.6);
  const completed = advanceHriRun(checkpoint, 7700);
  const result = hriOutcome(completed.events, completed.errorReason)!;
  assert.equal(result.durationSec, 6.7);
  assert.equal(result.testCasePassed, true);
  assert.equal(result.navigationSucceeded, true);
  assert.equal(result.terminalStatus, "ARRIVED_AT_DESTINATION");
  assert.equal(validateHriRun(completed).ok, true);
});

test("staff handoff and cancellation pass their cases without claiming navigation success", () => {
  for (const action of ["staff", "cancel"] as const) {
    for (const navigate of [false, true]) {
      let run = start();
      if (navigate) run = advanceHriRun(actOnHriRun(run, "navigate", 1100), 3300);
      run = actOnHriRun(run, action, 4000);
      const result = hriOutcome(run.events, run.errorReason)!;
      assert.equal(result.testCasePassed, true);
      assert.equal(result.navigationSucceeded, false);
      assert.equal(result.durationSec, 3);
      assert.equal(advanceHriRun(run, 100000), run);
      for (const next of ["navigate", "staff", "cancel", "fail"] as const) assert.equal(actOnHriRun(run, next, 5000), run);
    }
  }
});

test("rapid decisions and repeated navigation cannot create reordered or duplicate events", () => {
  let run = actOnHriRun(start(), "navigate", 1001);
  assert.equal(actOnHriRun(run, "navigate", 1002), run);
  run = actOnHriRun(run, "cancel", 1003);
  assert.equal(hriOutcome(run.events, run.errorReason)?.testCasePassed, true);
  assert.ok(run.events.every(event => event.timeSec === 0));
});

test("model-load and injected runtime failures carry reasons and recovery events", () => {
  for (const run of [start("Model unavailable"), actOnHriRun(start(), "fail", 5000), actOnHriRun(actOnHriRun(start(), "navigate", 2000), "fail", 3000)]) {
    assert.equal(run.phase, "ERROR_RECOVERY");
    assert.ok(run.errorReason);
    assert.equal(run.events.at(-1)?.action, "SHOW_RECOVERY_ACTIONS");
    assert.equal(validateHriRun(run).ok, true);
    assert.equal(hriOutcome(run.events, null)?.testCasePassed, false);
  }
});

test("server validation derives metrics and rejects forged, unfinished or malformed traces", () => {
  const run = actOnHriRun(start(), "staff", 2250);
  const valid = validateHriRun({ ...run, durationSec: 99, navigationSucceeded: true, testCasePassed: false });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.durationSec, 1.3);
    assert.equal(valid.data.navigationSucceeded, false);
    assert.equal(valid.data.testCasePassed, true);
  }
  const alter = (index: number, fields: object) => run.events.map((event, i) => i === index ? { ...event, ...fields } : event);
  for (const events of [run.events.slice(1), run.events.slice(0, -1), alter(2, { timeSec: -1 }), alter(2, { timeSec: 90 }), alter(2, { seq: 9 }), alter(2, { actor: "SYSTEM" }), alter(2, { action: "MADE_UP" }), alter(2, { status: "ARRIVED_AT_DESTINATION" })]) {
    assert.equal(validateHriRun({ ...run, events }).ok, false);
  }
  for (const input of [null, {}, start(), { ...run, sceneVersion: "old-scene" }, { ...run, runCode: "M01-RUN-1234" }, { ...run, errorReason: "Unexpected" }]) assert.equal(validateHriRun(input).ok, false);
});

test("CSV preserves quotes and delimiters and neutralizes formula cells", () => {
  assert.equal(hriCsvCell('model, "A"\nline'), '"model, ""A""\nline"');
  assert.equal(hriCsvCell("=1+1"), '"\'=1+1"');
  assert.equal(hriCsvCell("@SUM(A1)"), '"\'@SUM(A1)"');
});
